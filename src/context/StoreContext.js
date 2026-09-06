/**
 * Estado central da app: sessão, dados do utilizador e definições.
 *
 * Estratégia de persistência (igual à da versão web):
 *  - AsyncStorage guarda uma cópia local, para a app abrir instantaneamente
 *    e continuar utilizável sem rede;
 *  - o servidor é a fonte de verdade, sincronizado em segundo plano.
 *
 * As gravações para o servidor são agrupadas (debounce) para não fazer um
 * pedido por cada toque enquanto registas um treino.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import * as api from '../api/client';
import { mergeData, mergeSettings, defaultSettings } from '../lib/defaults';

const CACHE_KEY = 'iron_log_cache_v1';
const SAVE_DEBOUNCE_MS = 800;

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [booting, setBooting] = useState(true);
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState(null);
  const [data, setData] = useState(null);
  const [settings, setSettings] = useState(defaultSettings());
  const [syncState, setSyncState] = useState('idle'); // idle | saving | offline

  const saveTimer = useRef(null);
  const latest = useRef({ token: null, data: null, settings: null });
  latest.current = { token, data, settings };

  /* ---------- Arranque: carrega a cache e sincroniza ---------- */

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(CACHE_KEY);
        if (raw) {
          const cached = JSON.parse(raw);
          if (cached.token) {
            setToken(cached.token);
            setUsername(cached.username);
            setData(mergeData(cached.data));
            setSettings(mergeSettings(cached.settings));

            // Atualiza a partir do servidor, sem bloquear o arranque
            api
              .loadData(cached.token)
              .then((res) => {
                setData(mergeData(res.data));
                setSettings(mergeSettings(res.settings));
              })
              .catch((err) => {
                if (err.status === 401) signOut();
              });
          }
        }
      } catch (e) {
        console.warn('Falha ao ler a cache local', e);
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  /* ---------- Persistência ---------- */

  const writeCache = useCallback(async (next) => {
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('Falha ao gravar a cache local', e);
    }
  }, []);

  const flushToServer = useCallback(async () => {
    const { token: t, data: d, settings: s } = latest.current;
    if (!t || !d) return;
    setSyncState('saving');
    try {
      await api.saveData(t, d, s);
      setSyncState('idle');
    } catch (e) {
      setSyncState('offline');
    }
  }, []);

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(flushToServer, SAVE_DEBOUNCE_MS);
  }, [flushToServer]);

  /**
   * Atualiza os dados do utilizador.
   * Recebe uma função (como o setState do React) para evitar corridas entre
   * alterações rápidas seguidas.
   */
  const updateData = useCallback(
    (updater) => {
      setData((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        writeCache({
          token: latest.current.token,
          username,
          data: next,
          settings: latest.current.settings,
        });
        latest.current = { ...latest.current, data: next };
        scheduleSave();
        return next;
      });
    },
    [scheduleSave, username, writeCache],
  );

  const updateSettings = useCallback(
    (updater) => {
      setSettings((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        writeCache({
          token: latest.current.token,
          username,
          data: latest.current.data,
          settings: next,
        });
        latest.current = { ...latest.current, settings: next };
        scheduleSave();
        return next;
      });
    },
    [scheduleSave, username, writeCache],
  );

  /* ---------- Sessão ---------- */

  const applySession = useCallback(
    async (res) => {
      const nextData = mergeData(res.data);
      const nextSettings = mergeSettings(res.settings);
      setToken(res.token);
      setUsername(res.displayName);
      setData(nextData);
      setSettings(nextSettings);
      await writeCache({
        token: res.token,
        username: res.displayName,
        data: nextData,
        settings: nextSettings,
      });
    },
    [writeCache],
  );

  const signIn = useCallback(
    async (u, p) => applySession(await api.login(u, p)),
    [applySession],
  );

  const signUp = useCallback(
    async (u, p) => applySession(await api.register(u, p)),
    [applySession],
  );

  const signOut = useCallback(async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    await AsyncStorage.removeItem(CACHE_KEY);
    setToken(null);
    setUsername(null);
    setData(null);
  }, []);

  const value = useMemo(
    () => ({
      booting,
      token,
      username,
      isSignedIn: !!token,
      data,
      settings,
      syncState,
      updateData,
      updateSettings,
      signIn,
      signUp,
      signOut,
    }),
    [
      booting,
      token,
      username,
      data,
      settings,
      syncState,
      updateData,
      updateSettings,
      signIn,
      signUp,
      signOut,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore tem de ser usado dentro de <StoreProvider>');
  return ctx;
}
