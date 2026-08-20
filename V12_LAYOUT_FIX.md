# V12 — Correção estrutural de Dashboard e Jogos

Causa identificada:
1. A Dashboard tinha múltiplas regras concorrentes de grid. Em algumas larguras o grid de 12 colunas permanecia ativo, mas os cards não recebiam spans confiáveis.
2. A seção "Operações abertas" era inserida no mesmo grid dos cards, podendo virar uma célula alta ao lado de um jogo.
3. O Service Worker anterior podia continuar servindo CSS antigo porque a nova versão ficava aguardando ativação.

Correções:
- Dashboard agora usa grid-template-areas com classes semânticas.
- Jogos usam wrappers de seção + grid interno; o cabeçalho não participa mais do grid de cards.
- CSS/JS receberam nomes versionados V12 para eliminar colisão de cache.
- Service Worker V12 usa skipWaiting para ativar imediatamente após o deploy.
