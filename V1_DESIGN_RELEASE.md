# Filhos de Asgard — Atualização v1.0 de design e experiência

Esta versão consolida o aplicativo como uma central de comando da equipe, sem criar abas desnecessárias.

## Interface
- Dashboard com identidade do operador, função, nível, XP e próxima operação.
- Visual grafite/preto com ciano mais contido e elementos nórdicos discretos.
- Cards, botões, modais e responsividade mobile refinados.
- Perfil tratado como ficha do operador, com estatísticas, histórico, arsenal e 3 insígnias favoritas.
- Membros exibem função, nível, insígnias e presença.

## Operações
- Jogos apresentados como Operações.
- Separação visual entre operações abertas e histórico concluído.
- Confirmação de presença permanece disponível enquanto a operação não for concluída/excluída.

## Conquistas
- Raridades: Comum, Incomum, Rara, Épica e Lendária.
- XP por raridade: 100, 125, 150, 200 e 250 XP.
- O ADMIN escolhe a raridade ao criar/editar a conquista.

## Chat
- Responder a uma mensagem com contexto.
- Separadores por data.
- Menções @ preservadas, com notificação somente para quem foi marcado.
- Fotos e vídeos preservados.

## Arsenal
- Layout de galeria preservado e refinado.
- Novo filtro Snipers/DMR por identificação do nome do equipamento.

## Engenharia
- Nenhum listener Firestore novo foi adicionado para as melhorias visuais.
- Listeners de mensagens/feed continuam limitados às janelas recentes.
- Re-renderizações continuam agrupadas.
- Arquivos antigos de backup foram removidos do pacote final para reduzir confusão no deploy.

Consulte também `V1_RELEASE_AUDIT.md` e `V1_STATIC_TEST.json`.
