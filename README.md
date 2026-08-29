# Contas em Dia

App mobile (iOS + Android) para controle de contas a pagar (água, luz,
streaming, nutricionista, carro etc.) com aviso de vencimento
personalizável.

## Stack

- [Expo](https://expo.dev) (React Native) + TypeScript
- [Expo Router](https://docs.expo.dev/router/introduction/) (navegação
  por arquivos, raiz em `src/app`)
- [NativeWind](https://www.nativewind.dev) (Tailwind para React Native)
- [Supabase](https://supabase.com) (Postgres + Auth + Edge Functions)
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
  (push nativo via APNs/FCM)
- [EAS Build](https://docs.expo.dev/build/introduction/) para gerar os
  builds iOS/Android

## Estrutura de pastas

```
src/
  app/          rotas (Expo Router, file-based)
  components/   componentes de UI reutilizáveis
  lib/          clientes e integrações (ex: lib/supabase.ts)
  types/        tipos TypeScript (ex: types/database.ts, do schema SQL)
  global.css    entrada do Tailwind/NativeWind
supabase/
  schema_contas.sql          schema completo (fonte da verdade)
  migrations/                migrations incrementais sobre o schema
  functions/                 Edge Functions (Deno)
eas.json                     perfis de build do EAS (development/preview/production)
```

## Configurar o backend (Supabase)

1. Crie um projeto em [supabase.com](https://supabase.com).
2. No SQL Editor do projeto, rode o conteúdo de
   `supabase/schema_contas.sql`.
   - Se você já tinha rodado uma versão anterior deste schema (com
     `push_subscriptions` no formato Web Push), rode em vez disso
     `supabase/migrations/0001_push_subscriptions_expo.sql` — leia o
     comentário no topo do arquivo antes de rodar.
3. Em **Project Settings > API**, copie a **Project URL** e a
   **anon public key**.

## Rodar o app localmente

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Copie `.env.example` para `.env` e preencha com as credenciais do
   passo anterior:

   ```bash
   cp .env.example .env
   ```

3. Inicie o servidor de desenvolvimento:

   ```bash
   npx expo start
   ```

   No terminal, escolha abrir em um
   [build de desenvolvimento](https://docs.expo.dev/develop/development-builds/introduction/),
   emulador Android, simulador iOS, ou Expo Go.

## Scripts

- `npm run android` — abre no emulador/dispositivo Android
- `npm run ios` — abre no simulador/dispositivo iOS (requer macOS)
- `npm run web` — abre no navegador
- `npm run lint` — roda o ESLint (`expo lint`)

## Build e distribuição (EAS)

O app usa [EAS Build](https://docs.expo.dev/build/introduction/) pra
gerar os binários iOS/Android — não dá pra fazer isso sem uma conta
Expo (grátis) e, no caso do iOS, sem passar pela Apple em algum
momento. Os passos abaixo são pra você rodar localmente (fora deste
ambiente).

### 1. Login e vincular o projeto ao EAS

```bash
npx eas-cli login          # cria conta grátis em expo.dev se não tiver
npx eas-cli init           # vincula este projeto, gera um projectId
```

O `eas init` escreve um `extra.eas.projectId` no `app.json`. **Esse
projectId é obrigatório** para o Expo Push Token funcionar de verdade
— até você rodar isso, o registro de push (`src/lib/notifications.ts`)
falha silenciosamente com `nao_suportado`.

### 2. Build de desenvolvimento (development client)

Um build de desenvolvimento é um binário instalável que já vem com o
`expo-dev-client` — dá pra testar push notifications reais, deep
links, etc., com hot reload conectando no seu `npx expo start`, sem
precisar publicar em loja nenhuma.

```bash
npx eas-cli build --profile development --platform android
npx eas-cli build --profile development --platform ios
```

- **Android**: gera um `.apk`. Não precisa de conta de developer paga
  — baixa o link que o EAS te dá e instala direto no aparelho
  (`adb install` ou abrindo o link no celular).
- **iOS**: pra instalar num iPhone físico, precisa de uma [conta Apple
  Developer](https://developer.apple.com/programs/) (US$99/ano) — o
  EAS gerencia os certificados/provisioning profiles automaticamente
  se você deixar (`eas credentials`). Sem conta paga, ainda dá pra
  rodar no **simulador iOS** (`eas build --profile development
  --platform ios --local` não é necessário; o build normal do EAS já
  gera uma variante pra simulador se você responder isso no prompt) —
  mas o simulador **não recebe push notifications reais**, só serve
  pra testar o resto do app.

Depois de instalado, rode `npx expo start --dev-client` e abra o app
no aparelho — ele conecta automaticamente no bundler.

### 3. TestFlight (beta testing no iOS)

Exige conta Apple Developer Program ativa.

```bash
npx eas-cli build --profile production --platform ios
npx eas-cli submit --profile production --platform ios
```

O `eas submit` manda o build pro App Store Connect. De lá:

1. Abra [appstoreconnect.apple.com](https://appstoreconnect.apple.com),
   vá no app > aba **TestFlight**.
2. O build leva alguns minutos pra passar pelo processamento da Apple.
3. Adicione testadores internos (sua equipe, até 100 pessoas, sem
   review da Apple) ou crie um grupo público de teste externo (até
   10.000 pessoas, passa por uma review leve da Apple na primeira
   vez).
4. Os testadores recebem um convite por email, instalam o app
   **TestFlight** da App Store, e instalam a build por lá.

### 4. Preview builds (Android, sem loja)

Pra distribuir uma versão de teste do Android sem passar pela Play
Store, o profile `preview` do `eas.json` já gera um `.apk` instalável
direto por link:

```bash
npx eas-cli build --profile preview --platform android
```

## Ícone e splash screen

O ícone/splash atuais (`assets/images/icon.png`,
`android-icon-*.png`, `splash-icon.png`) são um placeholder simples
(check branco em fundo indigo `#4F46E5`) — servem pra não ficar com a
marca genérica do template Expo, mas valem a pena trocar por uma
identidade visual de verdade antes de publicar em loja. Pra
regenerar: substitua esses arquivos (mantendo os mesmos nomes/formatos
— 1024×1024, fundo transparente nos que têm `-foreground`/`-monochrome`
e no `splash-icon.png`) e rode `npx expo prebuild --clean` antes do
próximo build.

## Status do desenvolvimento

- [x] Etapa 1 — Setup do projeto (Expo Router, NativeWind, cliente
      Supabase, tipos do schema)
- [x] Etapa 2 — Autenticação
- [x] Etapa 3 — CRUD de contas
- [x] Etapa 4 — Dashboard
- [x] Etapa 5 — Configurações
- [x] Etapa 6 — Notificações push nativas
- [x] Etapa 7 — Build e distribuição (EAS)
