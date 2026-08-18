# Regra de participação por contribuição em atraso

Implementação adicionada em 18/08/2026.

## Regra
- O status considerado é o da contribuição do mesmo mês da data da operação (YYYY-MM).
- Se o operador estiver com status `Em Atraso`, ele pode manter confirmação em no máximo 1 operação naquele mês.
- Se já confirmou uma operação no mês, os demais botões ficam bloqueados com `Limite mensal atingido`.
- O operador ainda pode cancelar a própria confirmação enquanto não tiver check-in; ao cancelar, a vaga mensal é liberada.
- Operação concluída continua consumindo a participação daquele mês.
- Se o ADMIN excluir a operação, a reserva mensal correspondente é removida.
- Operadores `Pago` ou `Pendente` não recebem esse limite.

## Persistência e concorrência
A coleção `game_monthly_limits` guarda uma reserva por usuário/mês. A confirmação usa transação do Firestore para evitar que dois cliques/dispositivos confirmem duas operações simultaneamente.

## Segurança
As regras do Firestore foram atualizadas para:
- validar a reserva mensal junto com a confirmação em jogos novos que possuem `operationMonth`;
- impedir que o operador altere por conta própria o campo `status` de sua contribuição;
- permitir que o operador continue enviando confirmação/comprovante sem mudar o status definido pelo ADMIN.
