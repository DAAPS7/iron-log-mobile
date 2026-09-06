# Iron Log — app mobile (React Native + Expo)

Versão mobile do Iron Log. Fala com **exatamente o mesmo backend** da versão
web (Cloudflare Worker + KV), por isso a conta e os dados são partilhados: o
que registas na app aparece no site e vice-versa.

## Arranque rápido

```bash
npm install
npx expo start
```

Depois lê o QR code com a app **Expo Go** (iOS/Android) para testar no
telemóvel sem compilar nada.

> **Antes de tudo:** abre `src/api/client.js` e confirma que `API_BASE` aponta
> para o teu Worker. É o único sítio com o endereço do servidor.

## Estrutura

```
src/
├── api/client.js          Todas as chamadas ao servidor, num só sítio
├── context/
│   ├── StoreContext.js    Sessão + dados + sincronização (cache offline)
│   └── ThemeContext.js    Tema derivado das definições do utilizador
├── theme/theme.js         Cores (claro/escuro), tipografia, espaçamento
├── lib/                   Lógica pura, sem UI — testável isoladamente
│   ├── biometrics.js      Idade, gordura corporal, BMR, calorias dos macros
│   ├── sets.js            Formato das séries, parsing, PRs, aquecimentos
│   ├── schedule.js        Plano semanal e revisão de fim de semana
│   ├── exercises.js       Biblioteca de exercícios (ordem alfabética)
│   └── defaults.js        Forma dos dados + merge com o servidor
├── components/            Primitivos de UI (Card, Button, Input, gráficos…)
├── screens/               Um ficheiro por ecrã
└── navigation/            Tabs + stack
```

### Princípios que vale a pena manter

- **A lógica de negócio vive em `src/lib/`** e não sabe que o React existe.
  É o que permite testá-la com Node puro e garantir que os cálculos são
  idênticos aos da versão web.
- **Nenhum ecrã escreve cores à mão** — tudo vem de `useTheme()`, para o modo
  escuro funcionar em todo o lado sem casos especiais.
- **O formato das séries** (ex: `"5 × 100 kg (RIR 2)"`) é escrito e lido
  apenas por `src/lib/sets.js`. Nunca faças parsing à mão noutro sítio.

## Persistência

- `AsyncStorage` guarda uma cópia local → a app abre instantaneamente e
  continua utilizável sem rede.
- O servidor é a fonte de verdade; as gravações são agrupadas (debounce de
  800 ms) para não fazer um pedido por cada toque durante um treino.
- O registo de um treino em curso é guardado como rascunho, e a app oferece
  retomá-lo se fechares a meio.

## O que já está feito

| Área | Estado |
|---|---|
| Login / registo / sessão persistente | ✅ |
| Perfil, biometrias e registo de peso | ✅ |
| Treinos: criar, editar, reordenar exercícios | ✅ |
| Registar sessão (força + cardio, aquecimentos, notas) | ✅ |
| Treino livre (sem plano) | ✅ |
| Plano semanal + lembrete do dia | ✅ |
| Progresso: gráficos, PRs, diferenças entre registos | ✅ |
| Nutrição: registo, macros, metas, Open Food Facts | ✅ |
| Histórico agrupado por treino (colapsável) | ✅ |
| Amigos: pedidos, notificações, partilha de treinos | ✅ |
| Definições: tema claro/escuro, sessão | ✅ |

## Próximos passos naturais

1. **Notificações push** — o grande ganho de ser nativo. Com
   `expo-notifications` dá para lembrar o treino do dia mesmo com a app
   fechada (precisa de um Cron Trigger no Worker para as agendar).
2. **Planos alimentares** — o backend já os guarda (`data.mealPlans`); falta
   só o ecrã para os montar, como existe no site.
3. **Apple Health / Google Fit** — importar peso e treinos automaticamente.
4. **Publicação** — `eas build` para gerar os binários e submeter às lojas.
