# Jogos sem limite de participantes

- Não existe limite máximo de operadores por jogo, treinamento ou operação.
- Cada operador elegível pode confirmar a própria presença enquanto a operação estiver aberta.
- A lista `confirmed` não é truncada pela interface.
- Campos legados de capacidade (`maxPlayers`, `capacity`, `vagas` etc.) são ignorados ao criar/editar operações.
- A regra separada de contribuição **Em Atraso** (1 operação por mês por operador) continua válida; ela não limita a quantidade total de participantes de uma operação.
- O cache do PWA foi versionado novamente para evitar que código antigo com eventual limite continue ativo no aparelho.
