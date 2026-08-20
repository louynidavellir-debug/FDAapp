# Planos de fundo desbloqueáveis por conquistas

Esta versão adiciona 7 planos de fundo de imagem à galeria de Editar Perfil → Mudar plano de fundo.

Mapeamentos:

- Lobo de Asgard → conquista `Lobo de Asgard`
- Caçador Noturno → conquista `Caçador Noturno`
- Ceifador → conquista `Ceifador`
- Olho de Odin → conquista `Olho de Odin`
- 100 Baixas → conquista `100 Baixas` (também reconhece título com emoji, como `🏅 100 Baixas`)
- Primeira Vitória → conquista `PRIMEIRA VITORIA` / `Primeira Vitória`
- Veterano de Asgard → conquista `Veterano de Asgard`

O vínculo é feito pelo título normalizado da conquista (maiúsculas/minúsculas, acentos e emojis não interferem).

Comportamento:

- Os 8 temas anteriores continuam livres.
- Os 7 novos fundos aparecem na mesma galeria, mas bloqueados enquanto a conquista correspondente não tiver sido recebida.
- Quando o Firestore sincroniza a concessão da insígnia, o fundo correspondente fica disponível automaticamente.
- O usuário só consegue aplicar um fundo de recompensa se possuir a conquista correspondente.
- Outros operadores veem o plano de fundo escolhido ao abrir o perfil.
- As imagens ficam dentro do próprio PWA em `assets/profile-backgrounds/`, sem Firebase Storage e sem leituras extras do Firestore.
