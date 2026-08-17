# FILHOS DE ASGARD — FASE 2 FIREBASE

Esta versão usa **Firebase Authentication + Cloud Firestore** e mantém o Netlify como hospedagem do PWA.
Não usa Supabase, SQL ou senha armazenada no navegador.

## 1. Criar o projeto Firebase

1. Entre em https://console.firebase.google.com/
2. Crie ou abra o projeto **Filhos de Asgard**.
3. Em **Configurações do projeto > Seus apps**, clique no ícone **Web (</>)**.
4. Registre o app. Não é necessário ativar Firebase Hosting porque o site pode continuar no Netlify.
5. Copie o objeto `firebaseConfig` mostrado pelo Firebase.

## 2. Configurar o site

Abra `firebase-config.js` e cole os valores do seu `firebaseConfig`:

```js
window.ASGARD_FIREBASE_CONFIG = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

A configuração web do Firebase é pública por design. A proteção do banco é feita pelas **Firestore Security Rules**.
Nunca coloque chaves de conta de serviço/Admin SDK no site.

## 3. Ativar login por senha

No Firebase Console:

1. **Authentication > Começar**.
2. Abra **Método de login / Sign-in method**.
3. Ative **E-mail/senha**.
4. Salve.

O usuário continuará vendo apenas **CALLSIGN + SENHA**. Internamente, o app gera um e-mail técnico a partir do callsign.

## 4. Criar o Cloud Firestore

1. Abra **Firestore Database > Criar banco de dados**.
2. Escolha uma região próxima aos usuários.
3. Pode iniciar em modo de produção.

Depois abra a aba **Regras / Rules**, apague o conteúdo existente, cole todo o conteúdo de `firestore.rules` e clique em **Publicar**.

Não é necessário criar coleções manualmente. O aplicativo cria os documentos necessários quando os usuários começam a utilizar o sistema.

## 5. Primeiro administrador

O **primeiro cadastro realizado no aplicativo** recebe automaticamente a função `admin` e cria o documento de bootstrap do sistema.
Todos os cadastros seguintes recebem `operador`.

Por isso, após configurar Firebase e Firestore, faça primeiro o cadastro da conta que deve ser o administrador.

## 6. Publicar no Netlify

Envie todos os arquivos desta pasta para o mesmo site Netlify ou para o repositório GitHub conectado a ele.
O PWA funciona em desktop e mobile e o Firestore sincroniza alterações em tempo real entre dispositivos conectados.

## 7. Estrutura online

- `profiles` — perfis e funções dos usuários
- `messages` — chat
- `games` — jogos, presença e check-in
- `announcements` — avisos
- `products` — loja
- `orders` — pedidos
- `activities` — atividades recentes
- `settings/contributions` — valor e PIX das contribuições
- `contributions` — contribuição individual por usuário/mês e comprovante comprimido
- `system/bootstrap` — identifica o primeiro administrador

## 8. Imagens

Esta edição não depende do Firebase Storage. As imagens são comprimidas no navegador antes de serem salvas junto aos documentos do Firestore. Isso evita obrigar o projeto a usar um plano pago apenas para Storage.
Mantenha as imagens pequenas; o app já reduz fotos de perfil/produtos e comprovantes.

## 9. Atualização do PWA

O Service Worker usa a versão `asgard-pwa-firebase-v1`. Ao publicar futuras alterações importantes, aumente esse identificador para forçar a substituição do cache antigo.
