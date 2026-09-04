# VISION.md — TaskFlow

## Origem

O app nasceu de um problema cotidiano: coordenar a rotina de uma família com agendas separadas durante a semana.

A lista de mercado era o símbolo do problema. Apps existentes foram testados, assim como soluções físicas — quadro branco, papel na geladeira, grupos de mensagem. Nada centralizava. Nada funcionava junto.

O que faltava era simples: uma lista compartilhada em tempo real, onde qualquer membro da família pudesse adicionar itens, marcar o que já foi pego no mercado, e acompanhar o total da compra. E que esse mesmo app também ajudasse a coordenar o resto da rotina — tarefas, compromissos, pendências — num lugar só.

Isso virou o TaskFlow.

---

## Usuário

Pessoas que têm dificuldade de organizar a rotina — especialmente quem vive com TDAH, ansiedade, hiperfoco, ou gerencia uma rotina complexa com família e filhos pequenos.

O design reflete isso: cores neutras, poucas opções por tela, sem poluição visual, sem decisões desnecessárias. Conforto visual não é estética — é acessibilidade.

---

## Filosofia

- **Sem anúncios** — nenhum, em nenhuma circunstância
- **Sem coleta de dados** — a rotina do usuário é dele
- **Dados locais por padrão** — toda a lógica e persistência rodam no dispositivo. O compartilhamento usa Firebase Firestore (mínimo de dados expostos), mas é opt-in e pode ser desativado.
- **Backup criptografado** — nem o provedor de nuvem (ex: Google Drive) lê os dados do usuário. Criptografia no dispositivo antes do upload é requisito não-negociável.
- **Compartilhamento dentro dessas diretrizes** — peer-to-peer, máximo 1 parceiro, sem servidor próprio.

Privacidade não é uma política. É uma feature.

---

## Monetização

Ainda em definição. As opções consideradas:

- Open source e gratuito
- Gratuito com pedido de contribuição voluntária
- Compra única — sem assinatura

O que está descartado: assinatura, anúncios, freemium com limitações artificiais.

---

## Fases de Desenvolvimento

**Fase 0 — Fundação** *(atual)*
Construção das features core, definição de regras e fluxos, refinamento da interface.

**Fase 1 — Beta**
.apk distribuído para testers próximos. Interface sendo validada. Botões placeholder existem intencionalmente — os testers estão cientes. Objetivo: validar fluxo e conforto visual antes de construir o backend.

**Fase 2 — Play Store**
Distribuição pública no Google Play. Todas as features funcionando, incluindo compartilhamento. Android only — sem planos para Apple Store no curto prazo.

**Fase 3 — Decisão**
Avaliar adoção real. Se o app encontrar uma comunidade: expansão, iOS, escala. Se não: lançar como produto completo e gratuito para que chegue a quem precisa.

Nos dois cenários, o app cumpre seu propósito.
