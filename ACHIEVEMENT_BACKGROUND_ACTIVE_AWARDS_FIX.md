# Correção de desbloqueio de fundos

A galeria agora considera exclusivamente os registros ativos em `achievement_awards`.

- Conceder uma conquista cria/atualiza o award ativo.
- Retirar a conquista exclui o award correspondente.
- `completedBy`, notificações, insígnias destacadas e `unlockedProfileBackgrounds` não desbloqueiam mais fundos.
- Assim, se o operador possui somente Primeira Vitória, somente esse fundo de recompensa aparece desbloqueado.
