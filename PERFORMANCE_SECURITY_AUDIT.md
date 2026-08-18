# Auditoria de performance e segurança

## Melhorias aplicadas
- Chat em tempo real limitado às 200 mensagens mais recentes no listener do Firestore.
- Feed de atividade limitado às 80 atividades mais recentes.
- Feed deixou de regravar a coleção inteira a cada evento; cada atividade agora é um documento imutável individual.
- Regras de `activities` agora validam autoria (`actorUid == request.auth.uid`), tamanho do texto e tipo permitido.
- Operadores não podem editar atividades antigas; apenas ADMIN pode excluir registros.
- Mantida separação de privilégios já existente para avisos, produtos, conquistas, pedidos e contribuições.
- Mobile: alvos de toque maiores, sidebar compacta, inputs sem zoom involuntário no iOS e modais em formato bottom-sheet.

## Pontos monitorados
- Listeners de perfis, jogos, conquistas, avisos, produtos e pedidos continuam em tempo real porque o volume esperado é baixo/moderado.
- Se mensagens ultrapassarem uso intenso, recomenda-se paginação histórica além das 200 mensagens carregadas.
- Imagens de perfil/arsenal em base64 podem elevar leitura e tamanho dos documentos; para escala maior, migrar mídia para armazenamento dedicado.
