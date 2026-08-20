# Correção do desbloqueio de planos de fundo por conquistas

O desbloqueio agora usa três camadas de verificação:
1. `unlockedProfileBackgrounds` persistido no perfil quando o ADMIN concede a conquista;
2. `achievement_awards` / `completedBy` em tempo real;
3. compatibilidade com conquistas já concedidas, usando notificações de conquista e insígnias destacadas como evidência.

Isso corrige usuários que já possuíam a insígnia mas continuavam vendo o fundo como bloqueado.
