# Planos de fundo personalizados do perfil

Foi adicionada a opção **Mudar plano de fundo** em Editar Perfil.

## Temas disponíveis
- Asgard
- Nidavellir
- Niflheim
- Muspelheim
- Yggdrasil
- Bifrost
- Valhalla
- Corvos de Odin

A escolha é armazenada no próprio documento do operador em `profiles/{uid}` no campo `profileBackground`. Não há upload de imagem, uso de Firebase Storage nem listener adicional. Outros operadores enxergam automaticamente o tema escolhido ao abrir o perfil porque a coleção de perfis já é sincronizada em tempo real.

Convidados não possuem perfil e, portanto, não têm acesso a essa personalização.
