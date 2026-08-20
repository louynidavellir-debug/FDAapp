# Correção definitiva do desbloqueio de fundos

- O fundo vinculado agora é gravado como entitlement para **todos os operadores atualmente marcados como concluintes**, não apenas para quem foi detectado como recém-premiado.
- A gravação usa `arrayUnion`, portanto é idempotente e não duplica entradas.
- O cliente agora também faz auto-reparo: se detectar a insígnia via `achievement_awards` ou `completedBy`, mas o perfil ainda não tiver `unlockedProfileBackgrounds`, ele persiste o desbloqueio no próprio perfil.
- Isso cobre conquistas antigas e inconsistências de versões anteriores.
