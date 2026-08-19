# Acesso como convidado

1. Firebase Console > Authentication > Sign-in method > Anonymous > Enable.
2. Publique o `firestore.rules` deste pacote.
3. Atualize os arquivos do site/PWA no GitHub Pages.

O convidado usa Firebase Authentication anônimo apenas para ter um UID temporário seguro.
Ele não recebe documento em `profiles`, não possui perfil, conquistas, chat, loja ou outras telas.
O cliente carrega somente `games` e `guest_confirmations`.
A confirmação entra no mesmo array `confirmed` do jogo, então o ADMIN pode fazer check-in normalmente.
