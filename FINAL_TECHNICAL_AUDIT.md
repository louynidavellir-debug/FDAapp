# Auditoria técnica final — Filhos de Asgard

## Experiência do usuário
- Estados vazios receberam apresentação visual consistente e mais legível.
- Botões e campos desabilitados agora têm estado visual explícito.
- Foi preparado estilo de operação em andamento (`is-busy`) para ações assíncronas.
- Mensagens de erro do Firebase agora diferenciam cota excedida, permissão negada e falta de conexão.
- Modais e abas do Painel Admin foram refinados para telas pequenas; abas administrativas podem rolar horizontalmente no mobile.
- O Centro de Alertas do ADMIN funciona como ponto único para pendências importantes.

## Firestore / cota
- Mantido heartbeat de presença em 4 minutos, evitando o consumo excessivo que anteriormente esgotava a cota.
- Chat permanece limitado às 200 mensagens mais recentes.
- Feed permanece limitado às 80 atividades mais recentes.
- Corrigida a escuta de contribuições: snapshots não disparam mais um novo `getDocs()` completo a cada alteração.
- Escritas de avisos, produtos e conquistas não fazem mais uma leitura completa de confirmação quando o realtime já está ativo; o próprio snapshot atualiza a interface.
- A função de papel/permissão reutiliza o papel da sessão em cache para evitar leitura repetida do perfil.

## Convidados
- O convidado continua limitado à aba Jogos.
- O primeiro acesso do convidado não executa mais `getDocs()` e logo em seguida `onSnapshot()` nas mesmas coleções. Os listeners realtime são a única fonte de atualização após autenticação.
- A autenticação anônima continua sem criar perfil de operador.

## Service Worker / cache
- Navegações usam network-first.
- `firebase-config.js` agora usa network-first para evitar configuração Firebase antiga em cache.
- Assets estáticos continuam com stale-while-revalidate para inicialização rápida.
- O novo Service Worker não força `skipWaiting` automaticamente; assim o Painel Admin pode detectar uma versão aguardando instalação e mostrar o alerta de atualização.
- O botão existente “Forçar atualização do app” continua responsável por aplicar a nova versão quando o ADMIN decidir.

## Centro de Alertas do ADMIN
Exibe automaticamente:
- contribuições em atraso no mês atual;
- pedidos pendentes;
- operações cuja data chegou e ainda têm confirmados sem check-in;
- convidados presentes nas listas de operações abertas;
- nova versão do PWA disponível.

Os alertas são derivados dos dados já presentes no cache realtime do app. Não foi criado polling adicional do Firestore apenas para alimentar o painel.

## Validação estática
- `app.js`: sintaxe validada.
- `cloud.js`: sintaxe validada.
- `sw.js`: sintaxe validada.
- IDs HTML duplicados: 0.
- Referências `$('<id>')` sem elemento correspondente: 0.
