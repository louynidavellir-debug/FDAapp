# Filhos de Asgard — Auditoria de arquitetura e experiência v1.0

## Alterações aplicadas
- Dashboard transformado em Central de Comando, com identidade do operador, nível, XP e próxima operação.
- Perfil reforçado como ficha do operador, preservando histórico, presença, arsenal, nível e 3 insígnias em destaque.
- Membros enriquecidos com função, nível, total de insígnias e presença em tempo real.
- Jogos reorganizados visualmente em operações abertas e operações anteriores; operações só saem da área aberta ao serem concluídas pelo ADMIN.
- Arsenal ganhou filtro Sniper/DMR e tratamento de galeria mantido leve com imagens lazy-loaded.
- Conquistas ganharam raridade: Comum, Incomum, Rara, Épica e Lendária. A raridade define o XP da conquista (100/125/150/200/250 XP).
- Chat ganhou resposta contextual a mensagens, separadores por data e preservou menções @, fotos/vídeos e notificações apenas por menção.
- Central de notificações recebeu descrição contextual, mantendo deep-links para as áreas relevantes.

## Performance revisada
- Chat continua limitado às 200 mensagens recentes no listener realtime.
- Feed continua limitado às 80 atividades recentes.
- Re-renderizações de snapshots permanecem agrupadas pelo scheduler existente.
- Imagens de membros/arsenal/chat continuam com lazy loading quando aplicável.
- Atualizações visuais adicionais foram feitas sobre os dados já em memória, sem criar listeners Firestore extras.
- Quando o app fica oculto, overlays temporários do chat são fechados e uma atualização consolidada é feita apenas quando o app volta a ficar visível.

## Segurança revisada
- Regras atuais mantêm conquistas, jogos administrativos, produtos e avisos sob escrita de ADMIN.
- Confirmação de presença continua limitada ao próprio UID do operador.
- Mensagens continuam vinculadas ao UID/callsign autenticado e limitadas a 2.000 caracteres.
- Mídia continua protegida pelas regras do Firebase Storage já incluídas no projeto.
- Seleção de insígnias em destaque é salva apenas no próprio perfil do operador.

## Observação de engenharia
A aplicação ainda é um SPA grande, com `app.js` concentrando muitos módulos. Para uma futura v2, o próximo refactor recomendado é dividir o código em módulos ES: auth, presence, chat, games, achievements, store e UI. Para a v1 atual, não foi feita essa quebra para evitar risco desnecessário de regressão no deploy estático do GitHub Pages.
