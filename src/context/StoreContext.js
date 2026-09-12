/**
 * Estado central da app: sessão, dados do utilizador e definições.
 *
 * Estratégia de persistência (igual à da versão web):
 *  - AsyncStorage guarda uma cópia local, para a app abrir instantaneamente
 *    e continuar utilizável sem rede;
 *  - o servidor é a fonte de verdade — MAS só quando sabemos que não há
 *    alterações locais por gravar. Se a última gravação para o servidor
 *    não tiver sido confirmada (`dirty: true`), a cache local é tratada
 *    como a versão mais recente, e é ela que é empurrada para o servidor —
 *    nunca o contrário. Sem isto, uma gravação falhada (ex: sem rede
 *    momentaneamente) fazia com que, ao reabrires a app, os dados antigos
 *    do servidor apagassem por cima os teus registos mais recentes.
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
import { mergeUserData } from '../lib/merge';

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
  const latest = useRef({ token: null, username: null, data: null, settings: null });
  latest.current = { token, username, data, settings };

  /* ---------- Persistência ---------- */

  const writeCache = useCallback(async (next) => {
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('Falha ao gravar a cache local', e);
    }
  }, []);

  const flushToServer = useCallback(async () => {
    const { token: t, username: u, data: d, settings: s } = latest.current;
    if (!t || !d) return;
    setSyncState('saving');
    try {
      const res = await api.saveData(t, d, s);
      setSyncState('idle');

      // Se tiveres continuado a mexer enquanto o pedido viajava pela rede,
      // latest.current já não é o mesmo objeto que foi enviado — há algo
      // novo que o servidor ainda não viu.
      //
      // Isto tem de olhar para os DOIS lados. Só verificar os dados fazia
      // com que trocar de tema durante uma gravação em curso revertesse a
      // escolha: a resposta trazia as definições antigas (as que tinham
      // sido enviadas) e essas eram aplicadas por cima das novas.
      const dataAdvanced = latest.current.data !== d;
      const settingsAdvanced = latest.current.settings !== s;
      const localAdvancedDuringRequest = dataAdvanced || settingsAdvanced;

      // O servidor já funde isto com o que outros dispositivos possam ter
      // gravado entretanto. Aqui funde-se mais uma vez com o estado local
      // MAIS RECENTE, para essas edições feitas durante o pedido não se
      // perderem.
      const serverData = res && res.data ? mergeData(res.data) : null;
      const mergedData = serverData
        ? mergeUserData(serverData, latest.current.data)
        : latest.current.data;
      // As definições não se fundem campo a campo: o que vale é sempre a
      // escolha mais recente do utilizador neste dispositivo.
      const mergedSettings =
        settingsAdvanced || !res?.settings
          ? latest.current.settings
          : mergeSettings(res.settings);
      setData(mergedData);
      setSettings(mergedSettings);
      latest.current = { ...latest.current, data: mergedData, settings: mergedSettings };

      await writeCache({
        token: latest.current.token,
        username: latest.current.username,
        data: mergedData,
        settings: mergedSettings,
        // Se avançou durante o pedido, essa parte ainda não está
        // confirmada no servidor — mantém marcado como por gravar.
        dirty: localAdvancedDuringRequest,
      });

      if (localAdvancedDuringRequest) {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(flushToServer, SAVE_DEBOUNCE_MS);
      }
    } catch (e) {
      setSyncState('offline');
    }
  }, [writeCache]);

  /* ---------- Arranque: carrega a cache e só sincroniza com segurança ---------- */

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(CACHE_KEY);
        if (raw) {
          const cached = JSON.parse(raw);
          if (cached.token) {
            const cachedData = mergeData(cached.data);
            const cachedSettings = mergeSettings(cached.settings);
            setToken(cached.token);
            setUsername(cached.username);
            setData(cachedData);
            setSettings(cachedSettings);
            // Atualiza a referência já, sem esperar por um novo render —
            // flushToServer (chamado ainda dentro desta função) precisa de
            // ler estes valores imediatamente, não os antigos.
            latest.current = {
              token: cached.token,
              username: cached.username,
              data: cachedData,
              settings: cachedSettings,
            };

            if (cached.dirty) {
              // Há alterações locais que podem não ter chegado ao
              // servidor da última vez. Em vez de as substituir pelo que
              // vier de lá, empurra-as já para o servidor primeiro.
              await flushToServer();
            } else {
              // Sem alterações pendentes — seguro trazer a versão mais
              // recente do servidor (útil se tiveres usado outro
              // dispositivo entretanto).
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
        }
      } catch (e) {
        console.warn('Falha ao ler a cache local', e);
      } finally {
        setBooting(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          username: latest.current.username,
          data: next,
          settings: latest.current.settings,
          dirty: true,
        });
        latest.current = { ...latest.current, data: next };
        scheduleSave();
        return next;
      });
    },
    [scheduleSave, writeCache],
  );

  const updateSettings = useCallback(
    (updater) => {
      setSettings((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        writeCache({
          token: latest.current.token,
          username: latest.current.username,
          data: latest.current.data,
          settings: next,
          dirty: true,
        });
        latest.current = { ...latest.current, settings: next };
        scheduleSave();
        return next;
      });
    },
    [scheduleSave, writeCache],
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
      latest.current = {
        token: res.token,
        username: res.displayName,
        data: nextData,
        settings: nextSettings,
      };
      await writeCache({
        token: res.token,
        username: res.displayName,
        data: nextData,
        settings: nextSettings,
        dirty: false,
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
