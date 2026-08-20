# Correção estrita dos planos de fundo por conquista

Os fundos de recompensa agora usam exclusivamente `achievements.completedBy` como fonte de verdade.

Isso significa:
- fundo desbloqueado somente se o UID do operador estiver em `completedBy` daquela conquista;
- `achievement_awards`, notificações antigas, destaques e `unlockedProfileBackgrounds` não liberam fundos;
- ao retirar o operador de `completedBy`, o fundo volta a ficar bloqueado;
- a seleção do ADMIN é refletida imediatamente no estado local após salvar.

No cenário reportado, se o operador estiver apenas em `Primeira Vitoria`, somente `reward-primeira-vitoria` deve aparecer como desbloqueado entre os fundos de conquista.
