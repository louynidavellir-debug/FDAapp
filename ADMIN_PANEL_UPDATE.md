# Painel Admin — atualização

- Nova aba `Painel Admin`, visível somente para contas com função ADMIN.
- Vendas foi movida para dentro do Painel Admin.
- Histórico de Partidas mostra somente operações concluídas, confirmados e check-ins.
- Histórico Administrativo usa o feed de atividades já existente para reunir ações relevantes.
- Diagnóstico mostra configuração do Firebase, conexão, estado do PWA/Service Worker, caches e contagem local de dados.
- Botão `Forçar atualização do app` atualiza o Service Worker, limpa caches estáticos e recarrega.
- Botão `Limpar cache local e recarregar` remove apenas caches locais; não apaga dados do Firebase.
- A Visão Geral reúne atalhos rápidos para Jogos, Conquistas, Membros e Contribuições.
- O modo Convidado continua restrito à aba Jogos.

Não é necessário alterar as regras do Firestore especificamente para esta interface. As ações continuam usando as permissões já existentes do ADMIN.
