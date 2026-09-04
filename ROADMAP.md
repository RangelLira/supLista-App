# ROADMAP — TaskFlow

> **Propósito deste documento:** Memória técnica completa do projeto — histórico de sprints, decisões tomadas, e estado atual.  
> Use-o para:  
> 1. Saber **o que já foi tentado e por que foi abandonado** (evitar retrabalho)  
> 2. Entender o **estado atual** de cada módulo  
> 3. Planejar a próxima sprint com contexto completo  
>
> ⚠️ **Antes de propor uma solução, leia a seção [Decisões Revertidas](#decisões-revertidas--abordagens-descartadas).** Se a abordagem já foi tentada, está documentada ali com o motivo da rejeição.

---

## Legenda

| Símbolo | Significado |
|---|---|
| ✅ | Concluído e estável |
| 🔧 | Em desenvolvimento / corrigindo |
| 📋 | Planejado (não iniciado) |
| ❌ | Descartado permanentemente |
| ⚠️ | Atenção — decisão ou risco importante |

---

## Sprint 0 — Fundação (09 Abr 2026)

**Commits:** `61bd222` → `742212b`  
**Objetivo:** Criar base funcional do app do zero.

| # | Item | Status |
|---|---|---|
| 0.1 | Projeto React Native inicializado, 5 telas: Hoje/Listas/Pendências/Eventos/Config | ✅ |
| 0.2 | EventForm e PendingForm separados (conceitos distintos desde o início) | ✅ |
| 0.3 | CalendarView com algoritmo de primeiro dia correto (Sakamoto) | ✅ |
| 0.4 | AsyncStorage para persistência local | ✅ |
| 0.5 | Padronização de headers, botões fixos na parte inferior, FAB removido | ✅ |

**Decisões arquiteturais:**
- Navegação manual via `activeScreen` em `App.tsx` — sem lib de navegação externa. Simples e sob controle total.
- `App.tsx` como único source of truth — sem Zustand/Redux/Context de dados. `useState` + handlers diretos.
- ❌ **FAB (botão flutuante redondo)** — substituído por botão fixo na base. Mais acessível e consistente entre telas.

---

## Sprint 1 — Features Core (10 Abr 2026)

**Commits:** `43d2061` → `3f44ffa`  
**Objetivo:** Eventos, Pendências e Listas com regras de negócio base.

| # | Item | Status |
|---|---|---|
| 1.1 | Steps removidos de EventForm e PendingForm | ✅ |
| 1.2 | Hora opcional no EventForm (sem hora = "Dia Todo") | ✅ |
| 1.3 | Ordenação: Dia Todo no topo, depois por horário crescente | ✅ |
| 1.4 | Bloqueio de criação de evento no passado | ✅ |
| 1.5 | Bloqueio de duplicidade (mesmo título + data + hora) | ✅ |
| 1.6 | Lista de Tarefas (`type: 'tarefas'`) sem quantidade/preço | ✅ |
| 1.7 | Lista de Compras (`type: 'compras'`) com preço/unidade | ✅ |
| 1.8 | Seleção de tipo ao criar lista | ✅ |
| 1.9 | Campo `isArchived` preparado na estrutura de dados | ✅ |

**Decisões:**
- ❌ **Steps (tarefas internas de evento)** — removidos. Adicionavam complexidade sem uso real no fluxo. Substituídos por Anotações (notas livres).
- `Event` unificado para eventos e pendências via flag `is_pending` — não criar tipo separado.

---

## Sprint 2 — Padrão de UI + Anotações (14-15 Abr 2026)

**Commits:** `fa33af7`, `c67404c`, `9a13526`, `96147eb`  
**Objetivo:** Padronizar cards expansíveis, sistema de anotações e seleção de tags.

| # | Item | Status |
|---|---|---|
| 2.1 | Padrão universal de card expansível — apenas 1 card expandido por tela | ✅ |
| 2.2 | Grade de ações 2×3 para eventos/pendências (sem emojis em botões) | ✅ |
| 2.3 | Estado `expanded` movido para a tela-pai (`isExpanded`/`onToggle` como props) | ✅ |
| 2.4 | Anotações com hot-save (AsyncStorage imediato ao clicar "Anotar") | ✅ |
| 2.5 | Pilha de anotações (mais recente no topo) | ✅ |
| 2.6 | Título de pendência livre para editar (restrição removida) | ✅ |
| 2.7 | Tags: chips inline 2×4, sem modal | ✅ |

**Decisões:**
- ❌ **Modal de seleção de tags** — substituído por chips inline. Modal é overhead para 8 opções fixas.
- Estado `expanded` **não fica no `EventCard`** — fica na tela via props. Garante que Concluir/Reabrir não recolha o card.
- ❌ **Título de pendência travado após criação** — revertido. Sem motivo UX para travar.

---

## Sprint 3 — Rotinas + Tema/Idioma (15-16 Abr 2026)

**Commits:** `f7c4e76` → `8032b47`, `5e74044`  
**Objetivo:** Feature Rotinas + infraestrutura de tema e idioma.

| # | Item | Status |
|---|---|---|
| 3.1 | Rotinas recorrentes (diária/semanal/mensal/anual/personalizado) | ✅ |
| 3.2 | RoutineCard com estados: ativo/suspenso/concluído | ✅ |
| 3.3 | Vínculo de lista por **instância** de rotina (não pela rotina inteira) | ✅ |
| 3.4 | EventTypeModal: escolha entre Compromisso e Rotina ao criar | ✅ |
| 3.5 | RoutineForm redesenhado (campos compactos, chips de unidade) | ✅ |
| 3.6 | CalendarView: fórmula de primeiro dia corrigida | ✅ |
| 3.7 | ThemeContext: auto/claro/escuro com Appearance API + persistência | ✅ |
| 3.8 | LanguageContext: pt/en/es, estrutura base + persistência | ✅ |
| 3.9 | Todos os 13 componentes migrados para `useTheme()` + `createStyles(c)` | ✅ |
| 3.10 | Release v0.6.0 para testers | ✅ |

**Decisões:**
- Rotinas **não migram para pendências**. `migrateExpiredEvents()` ignora rotinas completamente.
- Personalizado: máx. 15 repetições. Limite de 2 anos aplicado automaticamente.
- ❌ **Rotina semanal com 7 dias** — bloqueado com alerta. Rotina "todos os dias da semana" é uma rotina diária.

---

## Sprint 4 — Gerenciamento + Firebase (16 Abr 2026)

**Commits:** `d49fa5f`, `a7dd27d`  
**Objetivo:** Gerenciamento de dados e infraestrutura Firebase para compartilhamento futuro.

| # | Item | Status |
|---|---|---|
| 4.1 | Settings: sub-tela de listas arquivadas com exclusão individual | ✅ |
| 4.2 | Painel "Apagar dados" granular (por categoria) com 2 steps de confirmação | ✅ |
| 4.3 | Firebase: `@react-native-firebase` app/auth/firestore instalado | ✅ |
| 4.4 | Auth anônima via `FirebaseContext` | ✅ |
| 4.5 | OnboardingScreen: 3 passos (idioma → sharing → nome) | ✅ |
| 4.6 | `SharingScreen` base + `firestore.ts` com utilitários | ✅ |

**Decisões:**
- Compartilhamento **peer-to-peer, máximo 1 parceiro** por conta. Escopo doméstico — não é uma plataforma de colaboração.
- Auth anônima (sem login/senha visível). UID do Firebase é o identificador permanente do usuário.

---

## Sprint 5 — Compartilhamento Completo + V1.2 (16-17 Abr 2026)

**Commits:** `9e18740` → `5d107e7`  
**Objetivo:** Sistema de compartilhamento funcional + features V1.2 (auto-delete, smart reopen, list cards).

| # | Item | Status |
|---|---|---|
| 5.1 | `ShareModal` + botão Compartilhar em EventCard e ListsScreen | ✅ |
| 5.2 | Listeners em tempo real: `listenToSharedEventsWithMe`/`ListsWithMe` | ✅ |
| 5.3 | Fix: sync contínuo de itens compartilhados | ✅ |
| 5.4 | Fix: salvar perfil (displayName) no Firestore ao habilitar sharing | ✅ |
| 5.5 | Sistema de convites: código de 8 chars + aceite de conexão | ✅ |
| 5.6 | Ajustes de segurança no `google-services.json` | ✅ |
| 5.7 | `completedAt` timestamp em todos os itens concluídos | ✅ |
| 5.8 | Auto-delete policy independente para eventos e pendências | ✅ |
| 5.9 | Smart reopen: evento passado + migração ON → Alert com 2 opções | ✅ |
| 5.10 | List cards no padrão colapsável + concluídas com fundo verde | ✅ |
| 5.11 | Arquivar listas via botão no slot "Vincular" de listas concluídas | ✅ |

> ⚠️ **Débitos criados nesta sprint e corrigidos na Sprint 6:**  
> - `sharedWith: string[]` (array) implementado aqui — modelo errado. Corrigido para `sharedWithUid: string | null`.  
> - Double-query em listeners Firestore implementado aqui. Corrigido em P1.2 da Sprint 6.  
> **Não voltar para esses modelos.**

---

## Sprint 6 — Fase Final Pré-Play Store (25 Mai 2026)

**Commits:** `2cda194` → `48b4a83`  
**Objetivo:** Fechar todos os débitos técnicos, i18n completo, UX refinements, features P4.

### Prioridade 1 — Fixes Críticos (`2cda194`)

| # | Item | Status |
|---|---|---|
| P1.1 | `tsconfig.json`: excluir `node_modules` (elimina erros do VS Code LS) | ✅ |
| P1.2 | Firestore: corrigir double-query em `listenToShareConnections` | ✅ |
| P1.3 | `App.tsx`: sync propaga mudanças do **receptor** de volta ao dono via `ownerUid` | ✅ |
| P1.4 | `exitSharedEvent`/`exitSharedList`: receptor pode sair sem descompartilhar | ✅ |
| P1.5 | `SharingScreen`: bloquear novo parceiro quando já existe 1 ativo | ✅ |
| P1.6 | `ShareModal`: simplificado para toggle único (1 parceiro) | ✅ |
| P1.7 | `sharedWith: string[]` → `sharedWithUid: string \| null` (todos os arquivos) | ✅ |
| P1.8 | `src/utils/schemaUtils.ts` (novo): `migrateEventSchema` + `migrateListSchema` com retrocompat | ✅ |
| P1.9 | `Clipboard` depreciado → `@react-native-clipboard/clipboard` | ✅ |
| P1.10 | About screen: versão 1.2, copyright 2026, features falsas removidas | ✅ |
| P1.11 | Dupla confirmação de exclusão → Alert único com texto descritivo | ✅ |
| P1.12 | Botão `← Voltar` em `ShoppingListScreen` removido (BackHandler já cobre) | ✅ |

### Prioridade 2 — i18n Completo (`bf58f9a`)

| # | Item | Status |
|---|---|---|
| P2.1 | LanguageContext expandido: ~80 novas chaves em pt/en/es | ✅ |
| P2.2 | `dateUtils.ts`: `getDayName`/`getMonthName`/`formatHeaderDate` com suporte a locale | ✅ |
| P2.3 | EventCard: badges, labels, botões, todos os `Alert.alert` | ✅ |
| P2.4 | ShoppingList: formulário de criação, items, footer, todos os Alerts | ✅ |
| P2.5 | ListsScreen: seções, botões, modal de vincular, todos os Alerts | ✅ |
| P2.6 | SettingsScreen: backup, políticas, arquivadas, todos os Alerts | ✅ |
| P2.7 | SearchModal: título, subtitle, placeholder, seções, estado vazio | ✅ |
| P2.8 | HomeScreen + EventsScreen: headers localizados via `formatHeaderDate` | ✅ |

### Prioridade 3 — UX Refinements (`1400ec4`)

| # | Item | Status |
|---|---|---|
| P3.1 | Double-tap no header de list card abre a lista (1º tap expande, 2º tap abre) | ✅ |
| P3.2 | Badge 📝 tappable — abre lista vinculada sem expandir o card | ✅ |
| P3.3 | Sync indicator: `ActivityIndicator` substitui 👥 durante operação Firestore | ✅ |
| P3.4 | Progress bar motivante no header da HomeScreen (4px, `colors.success`) | ✅ |
| P3.5 | Toast/Snackbar global: `ToastProvider` + `useToast` + botão Desfazer (3s) | ✅ |
| P3.6 | Swipe em EventCard: PanResponder, direita=concluir+toast, esquerda=excluir+Alert | ✅ |

### Prioridade 4 — Features Play Store

| # | Item | Status | Notas |
|---|---|---|---|
| P4.1 | Backup para Google Drive (criptografado) | 📋 | Sprint dedicada → Sprint 10 |
| P4.2 | Notificações locais (`@notifee/react-native`) | ✅ | `48b4a83` — daily + per-event |
| P4.3 | QR Code display (`react-native-qrcode-svg`) | ✅ | `bc859ab` |
| P4.3 | QR Code scanner | ❌ | `3d0491f` — NDK 27.1 incompatível ⚠️ |
| P4.4 | Expiração de convites (24h TTL) | ✅ | `bc859ab` |
| P4.5 | Modo Compras em ShoppingList | ✅ | `7c8f76f` |

> ⚠️ **P4.3 Scanner descartado:** `react-native-vision-camera v4` falha de ABI com NDK 27.1. QR **display** funciona (mantido). Texto de UI ajustado em `H1` da Sprint 6.1. **Não tentar adicionar scanner sem resolver compatibilidade de NDK.**

---

## Sprint 6.1 — Correções Pós-Teste (26 Mai 2026)

**Commits:** `08dbf63` → `568eda0`  
**Objetivo:** Corrigir issues encontrados durante testes da Sprint 6.

### Fase 1 — i18n Restante + Cores UX + Auto-collapse (`08dbf63`)

| Código | Item | Status |
|---|---|---|
| A1-A2 | PendingScreen + PendingForm: todos os textos via `t.pending.*` / `t.pendingForm.*` | ✅ |
| A3 | Tags: chave PT mantida no BD, display via `t.tags[key]` em todos os formulários/cards | ✅ |
| A4 | ShoppingList AddItemModal/AddPriceModal: textos + unidades via `t.shoppingItem.*` / `t.units[key]` | ✅ |
| A5-A6 | SharingScreen + RoutineForm: todos os textos via `t.sharing.*` / `t.recurrence.*` | ✅ |
| A7-A10 | RoutineCard + EventForm: todos os alertas e botões traduzidos | ✅ |
| B1 | ListsScreen: botão Share sempre roxo (`gridBtnPrimary`), sem variação de estado | ✅ |
| B4 | RoutineCard: Editar=amarelo, Suspender=roxo; EventCard: Reabrir=roxo | ✅ |
| D1 | EventCard: fecha automaticamente ao Concluir ou Reabrir (dentro de callbacks) | ✅ |
| D2 | HomeScreen rotinas: padding correto entre header da gaveta e primeiro RoutineCard | ✅ |
| D3 | SettingsScreen "Apagar dados": botão Cancelar adicionado + estilo destructive | ✅ |

### Fase 2 — Firestore + QR text (`a5c7b3f`)

| Código | Item | Status |
|---|---|---|
| E1 | Listeners `listenToSharedEventsWithMe/ListsWithMe`: preservar `is_completed` local quando Firestore está desatualizado | ✅ |
| H1 | QR Code: texto atualizado (instrução de "escanear" removida após remoção do scanner) | ✅ |

### Fase 3 — Máquina de Estado de Rotinas (`793f5d4`)

| Código | Item | Status |
|---|---|---|
| C1 | RoutineCard suspenso: Edit e Delete ativos; apenas Complete desabilitado | ✅ |
| C2 | RoutineCard concluído: botão Reabrir ativo + handler `handleUncompleteRotinaInstance` | ✅ |

### Fase 4 — Swipe Aprimorado (`4277b7e`)

| Código | Item | Status |
|---|---|---|
| D4 | EventCard swipe: fundo direcional (verde só ao deslizar p/ direita, vermelho só p/ esquerda) + card voa para esquerda antes do Alert | ✅ |
| F1 | ListsScreen: `SwipeRow.tsx` genérico + swipe nos cards de lista | ✅ |
| F2/F3 | RoutineCard: swipe embutido (HomeScreen + EventsScreen), desabilitado quando concluído/suspenso | ✅ |

### Fase 5 — Navegação de Dias (`67da42a`)

| Código | Item | Status |
|---|---|---|
| G1 | EventsScreen: carrossel `[<] [data] [>]` + link "Ir para Hoje" quando não está em hoje | ✅ |

### Fix Final (`568eda0`)

| Item | Status |
|---|---|
| HomeScreen: eventos concluídos não aparecem mais na lista do Hoje (separado `allTodayEvents` para contagem e `todayEvents` para display) | ✅ |

---

## Sprint 7 — Revisão Geral (27 Mai 2026) 🔧

**Status:** Em andamento  
**Objetivo:** Corrigir problemas remanescentes identificados nos testes da Sprint 6.1 antes das sprints específicas.

> ⚠️ **Escopo desta sprint:** Apenas issues gerais. Os tópicos abaixo têm sprints próprias — **não iniciar aqui:**
> - Revisão da Tela Configurações → Sprint 8
> - Compartilhamento de Rotinas → Sprint 9
> - Backup em Nuvem → Sprint 10

| # | Item | Status |
|---|---|---|
| 7.1 | SharingScreen: "Gerar código de convite" exibia erro silencioso quando displayName estava vazio — adicionado Alert explicativo | ✅ |
| 7.2 | EventsScreen G1: navegação de dias reimplementada corretamente — PanResponder no header (swipe left/right), `Animated.Value` no título, sem botões [‹/›] | ✅ |
| 7.3 | EventsScreen: cabeçalho da tela de detalhe padronizado para `globalStyles.header` (removidos botões invisíveis e "Ir para Hoje") | ✅ |
| 7.4 | RoutineCard: botão Compartilhar corrigido para roxo (`gridBtnPrimary`) quando ativo | ✅ |
| 7.5 | RoutineCard: botão "Vincular" renomeado para "Vincular Lista" (`t.common.link`) | ✅ |
| 7.6 | RoutineCard: Concluir/Reabrir agora recolhe a bandeja automaticamente (`onToggle?.()`) | ✅ |
| 7.7 | RoutineCard: Removidos Alerts de confirmação para Suspender e Reabrir rotina | ✅ |
| 7.8 | ListsScreen: Removida confirmação Alert para reabrir lista — ação direta | ✅ |
| 7.9 | ListsScreen: Duplo-toque removido. Adicionado botão "Ver Lista" (roxo, largura total) como primeiro elemento da bandeja expandida | ✅ |
| 7.10 | HomeScreen: Barra de progresso removida do header. Agora aparece abaixo de "COMPROMISSOS DE HOJE" no conteúdo scroll | ✅ |
| 7.11 | PendingScreen: Barra de progresso adicionada abaixo de "PENDÊNCIAS EM ABERTO". Seção renomeada de "EM ABERTO" | ✅ |
| 7.12 | ShoppingList: Header centralizado e limpo (sem emoji, sem override de alignItems, sem barra de progresso) | ✅ |
| 7.13 | ShoppingList: Seção "ITENS" + barra de progresso + toggle modo compras movidos para dentro do scroll | ✅ |
| 7.14 | ShoppingList: Botão "x" de exclusão de item com `textAlign: 'center'` e `lineHeight: 18` | ✅ |
| 7.15 | i18n: `pending.sectionPending` → "PENDÊNCIAS EM ABERTO" (PT/EN/ES); novas chaves `shoppingLabel`, `tasksLabel`, `itemsSection` em `t.lists` | ✅ |
| 7.16 | CLAUDE.md: regra de header padronizado documentada como requisito indiscutível | ✅ |

**Commit:** `a1702b0` (2026-05-27)

### Sprint 7.2 — Revisão Round 2

| # | Item | Status |
|---|---|---|
| 7.2.1 | HomeScreen: Barra de progresso contabiliza rotinas + eventos (todos os itens do dia) | ✅ |
| 7.2.2 | HomeScreen: Removido emoji 🔥 do subtítulo "Tudo Concluído" (PT/EN/ES) | ✅ |
| 7.2.3 | HomeScreen: Rotinas ficam no topo em gaveta recolhida; só rotinas ativas aparecem; seção + barra desaparecem quando tudo concluído | ✅ |
| 7.2.4 | HomeScreen: Seção de eventos renomeada para "EVENTOS DE HOJE" (nova chave `t.home.sectionToday`) | ✅ |
| 7.2.5 | RoutineCard: BUG — concluir rotina colapsada expandia a gaveta. Corrigido com guard `if (isExpanded) onToggle?.()` | ✅ |
| 7.2.6 | ShoppingList: Removido botão 🛒 de modo compras da linha ITENS | ✅ |
| 7.2.7 | ListsScreen: Recolhe bandeja expandida ao voltar de ShoppingListScreen | ✅ |
| 7.2.8 | EventsScreen detalhe do dia: Rotinas sempre no topo, compromissos abaixo | ✅ |
| 7.2.9 | PendingScreen: Barra permanece 100% cheia quando todos concluídos; desaparece apenas com zero itens | ✅ |

**Commit:** `957b08a` (2026-05-27)

### Sprint 7.3 — Revisão Round 3

| # | Item | Status |
|---|---|---|
| 7.3.1 | EventCard: Swipe habilitado em eventos concluídos — swipe direito = ↩ Reabrir (roxo), swipe esquerdo = 🗑️ Excluir | ✅ |
| 7.3.2 | RoutineCard: Swipe habilitado em rotinas concluídas — swipe direito = ↩ Desconcluir (roxo), swipe esquerdo = 🗑️ Excluir | ✅ |
| 7.3.3 | ListsScreen SwipeRow: Swipe habilitado em listas concluídas — swipe direito = ↩ Reabrir (roxo) | ✅ |
| 7.3.4 | HomeScreen: Espaçamento de 16px entre bloco de rotinas e lista de compromissos | ✅ |
| 7.3.5 | EventsScreen calendário: Botão contextual — sem data selecionada → "Criar Evento"; dia de hoje → "Criar Evento hoje"; outro dia → "Criar Evento neste dia" | ✅ |
| 7.3.6 | EventsScreen calendário: Por padrão nenhuma data selecionada (`selectedDate = null`). Hoje destacado mas não selecionado. Linha de data e botão "Ver detalhes" ocultos quando sem seleção | ✅ |
| 7.3.7 | EventsScreen `navigateDay`: null-safety com fallback `(prev \|\| todayStr)` | ✅ |
| 7.3.8 | CalendarView: prop `selectedDate` atualizada para `string \| null` | ✅ |
| 7.3.9 | i18n: Removido ⭐ de `events.todayStar` (PT/EN/ES). Novas chaves `events.createForDay` e `events.createToday` (PT/EN/ES) | ✅ |

**Decisões de produto registradas:**
- Swipe em itens concluídos foi validado pelos testers e mantido — melhora a UX de correção rápida.
- EventsScreen sem data padrão reduz ambiguidade sobre o que o botão "Criar Evento" vai fazer.
- Hoje é sinalizado no calendário (fundo sutil) mas não "selecionado" — distinção importante para ADHD: o usuário deve agir com intenção, não haver uma seleção padrão implícita.

### Sprint 7.4 — Revisão Round 4

| # | Item | Status |
|---|---|---|
| 7.4.1 | ListsScreen: Estado vazio corrigido — condição `openLists.length === 0 && closedLists.length === 0` (antes `lists.length === 0` deixava tela preta quando todas as listas estavam arquivadas) | ✅ |
| 7.4.2 | ListsScreen: Título do estado vazio corrigido de `t.home.emptyTitle` ("Dia livre!") para `t.lists.emptyTitle` ("Tudo certo!") | ✅ |
| 7.4.3 | Subtítulos de header padronizados em todas as telas — formato "N items . N concluídos", sempre visível (mesmo com 0), sem lógica condicional | ✅ |
| 7.4.4 | HomeScreen: subtítulo sempre exibe `t.home.subtitle(totalCount, completedCount)` — removidos "Nenhum evento hoje" e "Tudo concluído" do header | ✅ |
| 7.4.5 | ListsScreen: subtítulo exibe total de listas (abertas + concluídas) no primeiro N, concluídas no segundo N | ✅ |
| 7.4.6 | PendingScreen: subtítulo exibe pendências abertas no primeiro N, concluídas no segundo N | ✅ |
| 7.4.7 | Textos de estado vazio padronizados (PT/EN/ES): Hoje "Tudo em paz! / Nenhum evento hoje.", Listas "Tudo certo! / Nenhuma lista ainda.", Pendências "Tudo em dia! / Nenhuma pendência por aqui." | ✅ |
| 7.4.8 | Separador `•` → ` . ` em todos os subtítulos (PT/EN/ES) | ✅ |

**Commits:** `1eef03f`, `ed782a1`, commit atual (2026-05-27)

### Sprint 7.5 — Fixes Pendentes

| # | Item | Status |
|---|---|---|
| 7.5.1 | EventsScreen detalhe do dia: botão "Voltar" removido — fora do padrão do app. BackHandler registrado localmente via LIFO (prioridade sobre App.tsx) para fechar o detalhe ao pressionar back | ✅ |
| 7.5.2 | SearchModal: botão "Buscar" (primário) adicionado no footer — descarta teclado; "Cancelar" permanece secundário. Padrão idêntico a EventForm/PendingForm | ✅ |
| 7.5.3 | HomeScreen: título "COMPROMISSOS DE HOJE" sempre exibido antes dos eventos, independente de haver rotinas. Antes só aparecia quando não havia rotinas; quando havia, os eventos ficavam sem título. i18n EN atualizado de "TODAY'S EVENTS" → "TODAY'S APPOINTMENTS" para evitar duplicação com `sectionToday` | ✅ |
| 7.5.4 | BUG: `key` duplicado nos RoutineCards — `instanceKey` é apenas a data (`"2026-05-27"`), então duas rotinas no mesmo dia geravam `key="2026-05-27"` duas vezes. Corrigido para `${rotinaId}-${instanceKey}` em HomeScreen e EventsScreen | ✅ |
| 7.5.5 | EventsScreen detalhe do dia: gaveta de rotinas aberta por padrão (`useState(true)`) — corrigido para `useState(false)`, comportamento consistente com HomeScreen | ✅ |
| 7.5.6 | Back Android: pilha de navegação completa. App.tsx: `previousScreen` (estado morto, nunca lido no BackHandler) substituído por `screenHistory: ScreenName[]`. Pilha: modais → sub-telas (EventsScreen/ListsScreen via LIFO) → telas anteriores → 'hoje' → sai do app. `navigateToListScreen` helper centraliza navegação com histórico. ListsScreen: BackHandler adicionado para fechar ShoppingListScreen | ✅ |

### Sprint 7.6 — Padronização de Labels + BackHandler em Modais

| # | Item | Status |
|---|---|---|
| 7.6.1 | i18n (PT/EN/ES): botões de criar evento renomeados para padrão "Novo/Nueva" — `home.createBtn`, `events.createBtn`, `events.createForDay`, `events.createToday`. Antes usavam "Criar/Create/Crear" enquanto Listas e Pendências já usavam "Nova/Nueva". | ✅ |
| 7.6.2 | SearchModal: emoji 🔍 removido do título (`search.title`) em PT/EN/ES | ✅ |
| 7.6.3 | `EventForm`, `PendingForm`, `CreateListForm`, `SearchModal`, `EventTypeModal`: adicionado `onRequestClose={onClose}` nos Modais. Sem este prop, o back nativo do Android não disparava em nenhum formulário de criação | ✅ |

**Causa raiz do item 7.6.3:** Modais React Native no Android bloqueiam o `BackHandler` JS quando não têm `onRequestClose`. O App.tsx já tinha os handlers corretos para cada modal, mas eles não eram chamados. `onRequestClose` é o hook nativo que conecta o botão físico ao ciclo de vida do Modal.

**Sprint 7 encerrada.**

---

## Sprint 8 — Revisão da Tela Configurações ✅

**Status:** Concluída  
**Complexidade:** Média-Alta  
**Objetivo:** Reorganizar completamente a tela de Configurações — estrutura de seções, UX de sub-telas, e correção de inconsistências identificadas nos testes.

### Problemas identificados e resolvidos

| # | Item | Status |
|---|---|---|
| 8.1 | SettingsScreen sub-telas: header sem subtítulo → visualmente menor → tela "pula" na transição | ✅ |
| 8.2 | SettingsScreen: ausência de título no corpo da tela (ex: "MINHAS PREFERÊNCIAS") causa instabilidade visual no scroll | ✅ |
| 8.3 | Migração automática: label esclarece que aplica-se somente a compromissos; rotinas têm ciclo próprio | ✅ |
| 8.4 | Notificações: layout reestruturado com `policyLabel` para cada sub-opção, sem `sectionTitle` aninhado | ✅ |
| 8.5 | Políticas de auto-exclusão movidas de Backup → Preferências, expandidas para 4 tipos (compromissos/rotinas/listas/pendências) | ✅ |
| 8.6 | Gerenciamento de dados arquivados + Apagar dados movidos de Preferências → Backup e Dados | ✅ |
| 8.7 | Compartilhamento: campo de displayName adicionado no topo da sub-tela antes de SharingScreen | ✅ |

### Novo organograma da Tela Configurações

```
Header:
  Configurações                                    ← Título
  Seus ajustes e preferências                      ← Subtítulo

Corpo:
  [Título de seção: "OPÇÕES DO APP"]               ← padrão de "PENDÊNCIAS EM ABERTO"

  ▶ Minhas Preferências
    (Temas, idiomas e comportamentos)

    Idioma
      ( ) Português   ( ) English   ( ) Español

    Tema
      ( ) Automático   ( ) Claro   ( ) Escuro

    Migração automática de Eventos não concluídos para Pendências:
      [ toggle ◉ Ativar/Desativar ]                ← aplica-se somente a compromissos

    Gerenciamento automático de itens concluídos:
      Compromissos — Excluir após:
        ( ) Nunca   ( ) 1 dia   ( ) 1 semana   ( ) 1 mês
      Rotinas — Excluir após:
        ( ) Nunca   ( ) 1 dia   ( ) 1 semana   ( ) 1 mês
      Listas — ação: ( ) Excluir   ( ) Arquivar — após:
        ( ) Nunca   ( ) 1 dia   ( ) 1 semana   ( ) 1 mês
      Pendências — Excluir após:
        ( ) Nunca   ( ) 1 dia   ( ) 1 semana   ( ) 1 mês

    Gerenciamento de Notificações:
      [ toggle ◉ Ativar/Desativar ]
      ( ) Resumo matinal — sempre às [HH:MM]
      ( ) Por Evento:
            ( ) 15 min antes   ( ) 30 min antes   ( ) 1h antes
            Eventos de dia todo: [HH:MM]

  ▶ Backup e Dados
    (Gerenciamento de dados arquivados, backups, sincronização e restauração)

    Configurações de Backup:
      ( ) Manual   ( ) Automático

    Ações:
      [ Fazer Backup agora ]   [ Restaurar Backup ]

    Gerenciamento de dados arquivados:
      Ver Listas arquivadas
        LISTA ARQUIVADA 1  →  [ Recuperar ]  [ Excluir ]

    Apagar todos os dados:
      ( ) Compromissos   ( ) Rotinas   ( ) Listas   ( ) Pendências   ( ) Tudo
      [ APAGAR ]

  ▶ Compartilhamento
    (Ativar, gerar e administrar compartilhamentos)

    Gerar código de convite
    Usar código de convite
    Meus compartilhamentos
    [ toggle ◉ Ativar/Desativar compartilhamento ]  ← solicitar displayName se não definido

  ▶ Sobre
    (Informações do app e desenvolvimento)
    Informações do App
```

### Notas de implementação

- **8.1 / 8.2 — Header e título de sub-telas:** Todas as sub-telas de Configurações devem usar `globalStyles.header` com subtítulo descritivo. Adicionar título de seção no corpo (ex: `"OPÇÕES DO APP"`) antes do primeiro item de scroll — padrão de `"PENDÊNCIAS EM ABERTO"` em `PendingScreen`.
- **8.3 — Migração automática:** Ajustar label para deixar claro que se aplica somente a compromissos. Rotinas não migram (ciclo próprio — documentado na Sprint 3).
- **8.7 — Nome de exibição:** Ao ativar o toggle de compartilhamento, verificar se `displayName` está definido. Se não, apresentar campo inline antes de prosseguir. Alternativa: campo fixo no topo da sub-tela de Compartilhamento.

---

## Sprint 9 — Rebrand ⚠️

**Status:** Bloqueada — aguardando decisão de produto (nome do app)
**Complexidade:** Média
**Prioridade:** BLOCKER para lançamento na Play Store

### Contexto

O nome atual "TaskFlow" conflita diretamente com um app iOS oficial de mesmo nome e propósito similar (gerenciamento de rotinas). Publicar com esse nome representa risco de trademark e prejudica a descoberta no mercado. Esta sprint não pode ser iniciada sem o novo nome definido.

### Pré-requisito (fora do código)

- [ ] Definir novo nome do app
- [ ] Definir novo logo
- [ ] Validar que o novo nome não tem conflito nas stores (Play Store, App Store) e no mercado

### Escopo técnico (executar após pré-requisitos)

| # | Item | Status |
|---|---|---|
| 9.1 | Renomear app em `android/app/src/main/res/values/strings.xml` | 📋 |
| 9.2 | Atualizar `applicationId` e nome em `android/app/build.gradle` | 📋 |
| 9.3 | Atualizar `package.json` (campo `name`) e `app.json` | 📋 |
| 9.4 | Atualizar bundle identifier e nome do projeto iOS | 📋 |
| 9.5 | Atualizar `SettingsScreen` — tela "Sobre" (nome, versão) | 📋 |
| 9.6 | Avaliar necessidade de novo projeto Firebase (se o package name mudar) | 📋 |
| 9.7 | Substituir logo em todos os assets Android/iOS (mipmap, launch screen) | 📋 |
| 9.8 | Atualizar referências ao nome em `LanguageContext.tsx` | 📋 |
| 9.9 | Documentar paleta de cores e padrões técnicos de UI no `CLAUDE.md` | 📋 |
| 9.10 | Atualizar `CLAUDE.md` e `ROADMAP.md` com novo nome | 📋 |

### Decisões tomadas

- **Paleta de cores atual é mantida** — a identidade visual não muda, apenas nome e logo.
- A documentação técnica de cores e padrões de UI está incompleta no `CLAUDE.md` — será corrigida nesta sprint (item 9.9).

### O que NÃO fazer

- ❌ Não iniciar implementação antes de nome e logo estarem fechados.
- ❌ Não mudar o `applicationId` sem verificar impacto no Firebase (`google-services.json` e SHA-1).

---

## Sprint 10 — HomeScreen Redesign + Sistema de Animações ✅

**Status:** Concluída e mergeada na main  
**Complexidade:** Alta  
**Commit merge:** `0443b02` (Sprint 13.7 consolidou animações em todas as telas)

### Objetivo

Reformular completamente a tela HOJE com nova identidade visual animada, dois blocos de navegação e sistema de animações reutilizável para todas as telas do app.

### Decisão de biblioteca de animações

- **`Animated` API nativo do React Native** — escolha final após reanimated ser descartado (D.12).
  - `useNativeDriver: true` em todas as animações de opacity e transform → 60fps na thread nativa.
  - `useNativeDriver: false` apenas para `width` (barra de progresso — não suporta nativeDriver).
  - `timing`, `spring`, `sequence`, `parallel`, `delay` — suficiente para todas as animações de entrada.

### Nova estrutura da tela HOJE

```
Header (animação: cai de cima via spring)
  Quinta-feira, 12 de Junho
  x eventos . y concluídos

Eventos de hoje              ← texto fixo, some quando count = 0
(barra de progresso)         ← surge 100% cheia e esvazia até o valor real (800ms)

Olá,                         ← desliza da direita para o centro
Hoje você tem:               ← desliza da direita para o centro (delay 150ms)
                             ← delay silencioso antes dos blocos

┌─────────────────────────┐  ← fade in + translateY leve, bloco 1
│   X Rotinas             │
│       [Ver]             │  ← abre sub-tela "Minhas Rotinas"
└─────────────────────────┘

┌─────────────────────────┐  ← fade in + translateY leve, bloco 2 (após bloco 1)
│   Y Compromissos        │
│       [Ver]             │  ← abre sub-tela "Meus Compromissos"
└─────────────────────────┘

(barra de navegação — 5 botões)
```

### Regras dos blocos

- Bloco some completamente quando count = 0 — intenção: incentivar o usuário a "limpar" a tela como conquista.
- "Tudo em paz!" substitui os blocos quando tudo está concluído.
- **Sem botão de criar evento na tela HOJE** — criação concentrada na tela Eventos.

### Sequência de animações

| Fase | Elemento | Animação | Delay acumulado |
|---|---|---|---|
| 1 | Header (data + contador) | Spring de cima (translateY + opacity) | 0ms |
| 2 | "Eventos de hoje" + barra | Fade in; barra 100% → valor real | ~300ms |
| 3 | "Olá," | Slide da direita (Easing.back) | ~600ms |
| 4 | "Hoje você tem:" | Slide da direita | ~950ms |
| 5 | Delay silencioso | — | ~1200ms |
| 6 | Bloco Rotinas | Fade in + translateY leve | ~1350ms |
| 7 | Bloco Compromissos | Fade in + translateY leve | ~1600ms |

### Padrão de animações para as outras telas

- **Todas as telas** (`listas`, `pendencias`, `eventos`, `config`): header cai de cima na primeira abertura.
- **Telas com lista de cards** (`listas`, `pendencias`): cards surgem da direita para a esquerda em cascata.
- **Tela Eventos**: calendário surge da direita para a esquerda.
- Animações ocorrem **apenas uma vez por sessão** (variável de módulo `hasPlayedAnimation`).

### Comportamento "uma vez por sessão"

```ts
let hasPlayedAnimation = false; // módulo — persiste na sessão, reseta com o app
```

### Botão RESET (apenas em desenvolvimento)

```tsx
{__DEV__ && (
  <TouchableOpacity style={styles.headerResetBtn} onPress={handleReset}>
    <Text style={styles.headerResetText}>RESET</Text>
  </TouchableOpacity>
)}
```

`__DEV__` é `true` em debug, `false` em produção — não aparece na Play Store.

### Sub-telas de Hoje

- **Minhas Rotinas** (`activeHomeView === 'routines'`): header próprio + lista de RoutineCards do dia + botão "Voltar" no footer + BackHandler Android.
- **Meus Compromissos** (`activeHomeView === 'appointments'`): header próprio + lista de EventCards do dia + botão "Voltar" no footer + BackHandler Android.

### Mudanças na tela Eventos

- Botão "Novo Evento" pré-seleciona HOJE por padrão.
- Calendário: **1 clique seleciona**, **2º clique no mesmo dia já selecionado abre o detalhe**.
- Botão "Ver detalhes deste dia" removido — substituído pelo 2º clique.

### Decisões de produto

- **Saudação genérica:** "Olá," — sem personalização por nome.
- **Bloco some quando count = 0** — "limpar" a tela é a conquista.
- **"Eventos de hoje" + barra somem quando count = 0** — estado vazio tem visual próprio.
- **Reabrir = verde** — feedback unânime dos testers. Ver D.11.

### O que NÃO fazer

- ❌ Não adicionar botão de criar evento na tela HOJE.
- ❌ Não repetir animações ao navegar entre telas na mesma sessão.
- ❌ Não mostrar o botão RESET em builds de produção.

---

## Sprint 10.1 — Qualidade Geral: UX + Bugs 🔧

**Status:** Parcialmente resolvida — itens C1/C2 absorvidos pelo redesign de Configurações (post-Sprint 14, commit `7653e16`). Itens L e LB ainda pendentes.  
**Complexidade:** Média-Alta

> ⚠️ **Escopo:** Todos os itens desta sprint devem ser concluídos **antes** de iniciar Sprint 10.3 (Compartilhamento) e Sprint 11 (Compartilhamento de Rotinas).

### Geral

| # | Item | Arquivos afetados | Status |
|---|---|---|---|
| G1 | **D.11 — Reabrir = verde** em todos os componentes: `EventCard` (linha ~490), `RoutineCard` (linha ~428), `SwipeRow`, `ListsScreen` | `src/components/EventCard.tsx`, `RoutineCard.tsx`, `SwipeRow.tsx`, `src/screens/ListsScreen.tsx` | 📋 |

### Tela Eventos

| # | Item | Arquivos afetados | Status |
|---|---|---|---|
| E1 | **Subtítulo do header** deve exibir "X compromissos . Y rotinas" (contador master de tudo no dia) — atualmente exibe apenas compromissos | `src/screens/EventsScreen.tsx` + nova chave i18n em `LanguageContext.tsx` | 📋 |

### Tela Listas — UI Overhaul

| # | Item | Arquivos afetados | Status |
|---|---|---|---|
| L1 | **Remover botão "Finalizar"** do footer da lista — somente "Adicionar Itens" permanece. No modo compras, exibir apenas o total (sem "Finalizar"). Conclusão de lista ocorre pelo grid de ações no card de `ListsScreen` | `src/components/ShoppingList.tsx` | 📋 |
| L2 | **Remover "✕" (excluir)** dos itens — substituído pelo swipe (L4). **Remover "+ Preço"** — substituído por botão "Adicionar Preço" mais explícito | `src/components/ShoppingList.tsx` | 📋 |
| L3 | **Checkbox sem troca de tamanho**: substituir emoji `☐`/`☑️` por `View` com dimensões fixas e checkmark interno. Tamanho único marcado/desmarcado, levemente maior que o checkbox marcado atual | `src/components/ShoppingList.tsx` | 📋 |
| L4 | **Swipe nos itens da lista**: esquerda = excluir (vermelho), direita = marcar/desmarcar (verde). Reutilizar padrão de `SwipeRow.tsx` já existente | `src/components/ShoppingList.tsx`, `src/components/SwipeRow.tsx` | 📋 |
| L5 | **Swipe no header para navegar entre listas**: `PanResponder` somente na `View` do header — swipe esquerda avança para próxima lista, direita volta para anterior. Zero impacto visual. Requer que `ShoppingList` receba `lists[]` + índice atual + callbacks `onNavigatePrev`/`onNaviga

teNext` | `src/components/ShoppingList.tsx`, `App.tsx` | 📋 |
| L6 | **Editar nome da lista**: título do header vira `TouchableOpacity` — ao tocar, abre `Modal` simples com `TextInput` pré-preenchido + Cancelar/Salvar. Header visualmente idêntico ao atual | `src/components/ShoppingList.tsx` | 📋 |
| L7 | **Editar item**: tocar no nome do item abre modal idêntico ao "Adicionar Item" com dados pré-preenchidos e título "Editar Item". Se `qty` foi alterada e o item tem preço → ao salvar, abre automaticamente o modal de preço para confirmar nova precificação | `src/components/ShoppingList.tsx` | 📋 |
| L8 | **Barra de progresso geral em `ListsScreen`**: exibe progresso de listas concluídas vs total (não conta itens internos). Mesmo padrão de `PendingScreen` e `HomeScreen` | `src/screens/ListsScreen.tsx` | 📋 |
| L9 | **i18n**: todas as novas strings de L1–L8 adicionadas em pt/en/es | `src/contexts/LanguageContext.tsx` | 📋 |

### Tela Listas — Bugs

| # | Item | Arquivos afetados | Status |
|---|---|---|---|
| LB1 | **Bug: preço não aceita vírgula** — `parseFloat('25,90')` retorna `25`. Fix: normalizar input antes de parsear — remover pontos de milhar, substituir vírgula decimal por ponto. Validação: rejeitar `,90`, `.90`, `99,99,999`, `88.88.9`; aceitar `25,90`, `25.90`, `1.600.000,90` | `src/components/ShoppingList.tsx` → `AddPriceModal` | 📋 |
| LB2 | **Bug: modal de preço espremido** — ao fechar modal de um item e abrir o do item abaixo imediatamente, o modal surge sem teclado e espremido no canto. Causa: Modal anterior não terminou de fechar. Fix: garantir delay pós-fechamento antes de setar `priceModalItem`, ou unificar os dois estados de modal | `src/components/ShoppingList.tsx` | 📋 |
| LB3 | **Preço × quantidade** — o preço informado não leva em conta a unidade. Adicionar campo `priceType: 'unit' \| 'total'` em `ListItem`. No `AddPriceModal`: quando `quantity > 1`, exibir toggle "Preço por unidade (padrão) / Preço total". Cálculo do total: `price × quantity` se `priceType === 'unit'`, senão `price` direto. Schema migration em `schemaUtils.ts` para itens existentes (default `'unit'`) | `src/types/index.ts`, `src/components/ShoppingList.tsx`, `src/utils/schemaUtils.ts` | 📋 |

### Tela Configurações

| # | Item | Arquivos afetados | Status |
|---|---|---|---|
| C1 | **Sub-tela dedicada "Notificações"**: extrair a seção de notificações de "Preferências" para uma sub-tela própria — reduz scroll e organiza melhor as opções de modo/horário/intervalo | `src/screens/SettingsScreen.tsx` | ✅ (post-Sprint 14) |
| C2 | **Sub-tela dedicada "Dados Arquivados"**: extrair gerenciamento de listas arquivadas de "Backup e Dados" para sub-tela própria | `src/screens/SettingsScreen.tsx` | ✅ (post-Sprint 14) |

---

## Sprint 10.2 — Hidratação (Lembrete de Água) ✅

**Status:** Concluída — Jun/2026  
**Complexidade:** Média  
**Contexto:** Feature solicitada por múltiplos testers. Muitos declararam usar um app exclusivo apenas para lembrete de água. A integração na HomeScreen como terceiro bloco é o diferencial — não é um app de água, é uma extensão natural do app de rotinas.

### Visão do produto

O usuário ativa a feature em Configurações. Quando ativa, um terceiro bloco aparece na HomeScreen, abaixo de "Meus Compromissos":

```
┌─────────────────────────────────────┐
│  [animação de garrafa]              │
│  X.X / Y.Y L   (ex: 1.2 / 2.0 L)  │
│        [Registrar]                  │
└─────────────────────────────────────┘
```

- A garrafa vai enchendo conforme o usuário registra ingestões ao longo do dia.
- Quando a meta diária é atingida, o bloco desaparece (mesmo comportamento dos blocos de rotinas e compromissos — "conquista silenciosa").
- Os registros são por dia — reseta à meia-noite.

### Modelo de dados (novos campos em `AppSettings`)

```ts
waterTrackerEnabled?: boolean;           // default: false
waterDailyGoalMl?: number;              // default: 2000 (2L)
waterReminderIntervalMinutes?: number;   // default: 120 (2h), 0 = sem lembrete
```

```ts
// Nova chave AsyncStorage: @taskflow_water
interface WaterDayLog {
  date: string;           // 'YYYY-MM-DD'
  entries: WaterEntry[];
}
interface WaterEntry {
  id: number;
  timestamp: string;      // ISO
  amountMl: number;       // ex: 250
}
```

### Itens de implementação

| # | Item | Arquivos afetados | Status |
|---|---|---|---|
| W1 | **Modelo e persistência**: `WaterDayLog` + `WaterEntry` em `src/types/index.ts`; funções `loadWaterLog`, `saveWaterLog` em `src/utils/storage.ts` | `src/types/index.ts`, `src/utils/storage.ts` | 📋 |
| W2 | **Settings — Hidratação**: nova sub-seção em "Preferências" com toggle ativar/desativar, input meta diária (L), seletor de intervalo de lembrete (desligado / 1h / 2h / 3h / 4h) | `src/screens/SettingsScreen.tsx`, `LanguageContext.tsx` | 📋 |
| W3 | **HomeScreen — Bloco Hidratação**: terceiro bloco animado (mesma sequência de fade in após Compromissos). Garrafa com `Animated.Value` para nível de água. Botão "Registrar" abre modal simples para selecionar quantidade (200ml / 300ml / 500ml / custom) | `src/screens/HomeScreen.tsx` | 📋 |
| W4 | **Modal de registro**: opções rápidas de volume (copos/garrafas comuns) + campo livre. Salva entrada no `WaterDayLog` do dia | `src/screens/HomeScreen.tsx` ou componente próprio | 📋 |
| W5 | **Notificações de lembrete**: quando `waterReminderIntervalMinutes > 0`, usar `@notifee` para agendar notificações recorrentes durante o dia (ex: 8h às 22h, a cada N horas). Cancelar quando meta atingida | `src/utils/notificationUtils.ts` | 📋 |
| W6 | **Reset diário**: no `init()` de `App.tsx`, verificar se o log do dia anterior existe e não é de hoje — ignorar (não excluir, manter histórico). Carregar log do dia atual | `App.tsx` | 📋 |
| W7 | **i18n**: todas as strings em pt/en/es | `src/contexts/LanguageContext.tsx` | 📋 |

### Decisões de produto

- **Unidade padrão:** ml internamente, exibição em L (com 1 casa decimal).
- **Bloco some ao atingir meta** — mesma filosofia dos outros blocos.
- **Sem histórico de dias anteriores na UI** — só o dia de hoje. Histórico pode ser feature futura.
- **Não é uma Rotina disfarçada** — tem persistência e visual próprios.

### O que NÃO fazer

- ❌ Não implementar como Rotina comum — a experiência visual (garrafa) é o diferencial.
- ❌ Não notificar além das 22h.
- ❌ Não mostrar o bloco se `waterTrackerEnabled === false`.

---

## Sprint 10.3 — Compartilhamento: Auditoria e Correção ✅

**Status:** Concluída — incorporada ao Sprint 15 (Jun/2026)  
**Complexidade:** Alta

Ver Sprint 15 para os detalhes das 12 correções implementadas.

---

## Sprint 11 — Redesign Visual + Navegação ✅

**Status:** Concluída — Jun/2026  
**Commit:** `a2c5f5d` (worktree mergeado)

| # | Item | Status |
|---|---|---|
| 11.1 | Redesign completo de cards: layout unificado, ícones padronizados | ✅ |
| 11.2 | Remoção de tag dos cards de evento e rotina | ✅ |
| 11.3 | Padronização de ícones e layout em todas as telas | ✅ |
| 11.4 | List cards redesign: timestamps + badges à direita (worktree mergeado) | ✅ |

---

## Sprint 12 — Nome de Usuário e Saudação ✅

**Status:** Concluída — Jun/2026

| # | Item | Status |
|---|---|---|
| 12.1 | `greetingHello` virou função com nome do usuário | ✅ |
| 12.2 | Mantra padronizado nas 3 telas principais | ✅ |
| 12.3 | Onboarding coleta nome sempre | ✅ |
| 12.4 | Perfil editável em Configurações | ✅ |

---

## Sprint 13 — Task Detail Screen ✅

**Status:** Concluída — 2026-06-17  
**Commit:** `d8b8aed`

| # | Item | Status |
|---|---|---|
| 13.1 | Cards tap → `TaskDetailScreen` (full-screen, grid 2×3 + notas) | ✅ |
| 13.2 | `ShoppingList` com notas livres | ✅ |
| 13.3–13.6 | Refinamentos UX da grade de ações, textarea, layout, back Android | ✅ |

### Sprint 13.7 — Animações + Water Log ✅

**Commit:** `0443b02` (2026-06-23)

| # | Item | Status |
|---|---|---|
| 13.7.1 | Animações propagadas para todas as telas | ✅ |
| 13.7.2 | `resetKey` prop em HomeScreen/ListsScreen/PendingScreen | ✅ |
| 13.7.3 | Water log: editar e deletar entradas | ✅ |
| 13.7.4 | Ordem estável de cards (sem salto ao concluir) | ✅ |
| 13.7.5 | DEV TOOLS: botão RESET visível só em `__DEV__` | ✅ |

### Sprint 13.8 ✅

| # | Item | Status |
|---|---|---|
| 13.8.1 | Cabeçalho do calendário redesenhado | ✅ |
| 13.8.2 | `createdAt` exibido em pendências abertas | ✅ |
| 13.8.3 | Títulos de seção por dia na tela Eventos | ✅ |

**Commit:** `904d35b`

### Sprint 13.9 ✅

| # | Item | Status |
|---|---|---|
| 13.9.1 | TagPicker compartilhado com suporte a tag personalizada | ✅ |
| 13.9.2 | Detecção de tag customizada (`isCustomValue`), sentinel `__custom__` | ✅ |
| 13.9.3 | Retrocompat com tag legada `'Outro'` | ✅ |

**Commit:** `53a34a4`

---

## Sprint 14 — Redesign Telas de Criação ✅

**Status:** Concluída — 2026-06-24  
**Commit:** `7fce69d`

| # | Item | Status |
|---|---|---|
| 14.1 | Padronização das 4 forms: ordem Título → Tag → campos | ✅ |
| 14.2 | Date + Time inline (sem modal separado) | ✅ |
| 14.3 | Modal de frequência em RoutineForm com draft states | ✅ |
| 14.4 | Anti-flickering com `freqInputFocused` síncrono | ✅ |
| 14.5 | Repetições customizadas: limite 2–99 | ✅ |
| 14.6 | `ShoppingList.tag_name` adicionado ao schema + migração | ✅ |

**Pós-Sprint 14 (commits `7653e16` e `b328d6d`):**
- Reorganização completa da tela de Configurações (sub-telas, organograma)
- Redesign da exclusão automática (master toggle + toggles por tipo + delay compartilhado)

---

## Sprint 15 — Onboarding, Google Sign-In, Backup e Compartilhamento ✅

**Status:** Concluída — 2026-06-25  
**Commit:** `cc7d487`

### Onboarding e Auth

| # | Item | Status |
|---|---|---|
| 15.1 | OnboardingScreen: 7 etapas (language → google → sharing → backup → water → terms) | ✅ |
| 15.2 | Google Sign-In via `@react-native-google-signin/google-signin` v13 | ✅ |
| 15.3 | Linking conta anônima → Google (preserva dados existentes) | ✅ |
| 15.4 | `isGoogleConnected` + `signInWithGoogle()` em `FirebaseContext` | ✅ |
| 15.5 | Termos de uso em pt/en/es (`src/content/termsOfService.ts`) | ✅ |

### Backup

| # | Item | Status |
|---|---|---|
| 15.6 | `exportLocalBackup()` — Share nativo (sem permissão de armazenamento) | ✅ |
| 15.7 | `exportCloudBackup(uid)` — Firestore `backups/{uid}` (1 doc por usuário) | ✅ |
| 15.8 | `runAutoBackupIfEnabled()` chamado no `init()` | ✅ |
| 15.9 | SettingsScreen: subscreen de Backup com modo/destino/ações | ✅ |

### Compartilhamento (12 bugs corrigidos)

| # | Bug | Status |
|---|---|---|
| 15.10 | Regras Firestore criadas (`firestore.rules` + `firebase.json`) — corrige "Gerar código" | ✅ |
| 15.11 | `updateSharedEvent/List` → `set({merge:true})` — elimina GET antes de UPDATE | ✅ |
| 15.12 | `createShareRequest` com transação Firestore — previne race condition | ✅ |
| 15.13 | Receptor é colaborador: edita livremente, não pode excluir | ✅ |
| 15.14 | Sair do evento: remove do estado local imediatamente, sem cópia obsoleta | ✅ |
| 15.15 | `isSharedWithMe` nunca deletado pela auto-delete policy | ✅ |
| 15.16 | Múltiplos parceiros suportados (sem limite de conexões por conta) | ✅ |
| 15.17 | SharingScreen: Switch no topo, QRModal direto ao gerar código, Copiar inline | ✅ |
| 15.18 | ShareModal: lista todos os parceiros com loading por linha | ✅ |
| 15.19 | `cleanupSharedDocsOnDisconnect` ao encerrar vínculo | ✅ |
| 15.20 | Strings i18n em ShareModal e SharingScreen | ✅ |
| 15.21 | `onRequestClose` adicionado a todos os Modals de compartilhamento | ✅ |

---

## Sprint 16 — Compartilhamento de Rotinas 📋

**Status:** Planejada  
**Complexidade:** Alta

**Contexto do problema:**
- Rotinas têm instâncias. O modelo `sharedEvents/{ownerUid}_{eventId}` não se aplica.
- Requer: schema Firestore por instância, sync seletivo por data, UI de autoria.

**O que NÃO fazer:**
- ❌ Não reutilizar `sharedWithUid` direto em rotinas sem adaptar o schema.
- ❌ Iniciar sem Sprint 15 estabilizada e testada com 2 dispositivos físicos.

---

## Sprint 15.5 — Backup Completo (Restore + Google no Perfil + Auto) ✅

**Status:** Concluída — 2026-06-25  
**Commits:** `da77146` → `09be4f1` → `3c49b66` → `e0a3db9` → `fdc9f69`  
**Dependência nova:** `react-native-fs@2.20.0` (RNFS)  
**Removida:** `react-native-document-picker` — incompatível com RN 0.80 (ver D.15)

| # | Item | Status |
|---|---|---|
| B1 | `exportLocalBackup()`: escreve arquivo `.json` em Downloads (Android) / Share (iOS) via RNFS | ✅ |
| B2 | `exportLocalBackupSilent()`: auto backup silencioso sem Share sheet | ✅ |
| B3 | `listLocalBackups()`: lista `taskflow-backup-*.json` em Downloads; substitui Document Picker | ✅ |
| B4 | `readLocalBackupFile()`: lê, valida e confirma restore de arquivo local via Alert | ✅ |
| B5 | `importCloudBackup(uid)`: lê `backups/{uid}` Firestore, mostra data, confirma antes de restaurar | ✅ |
| B6 | `applyBackupRestore()`: grava events/lists/rotinas/settings/waterLog via storage | ✅ |
| B7 | `scheduleAutoBackup(uid)`: debounce 10s após mutações — evita spam de escrita | ✅ |
| B8 | `buildBackupPayload()` inclui waterLog (antes estava faltando) | ✅ |
| B9 | `lastBackupAt` em AppSettings — exibido na tela de Backup | ✅ |
| B10 | `reloadAllData()` em App.tsx — relê todo estado pós-restore sem fechar o app | ✅ |
| B11 | Auto backup debounced via `useEffect([events, lists, rotinas])` em App.tsx | ✅ |
| B12 | Perfil: botão "Conectar com Google" funcional + botão "Desconectar conta Google" | ✅ |
| B13 | `signOutGoogle()` no FirebaseContext: sign out Firebase + GoogleSignin, restaura anônimo, reseta `backupLocation` para `'local'` | ✅ |
| B14 | Backup UI: chips Automático/Manual e Local/Nuvem lado a lado; descrições fora dos botões; sem ScrollView (tela não rola) | ✅ |
| B15 | Regra: usuário anônimo não pode selecionar backup em nuvem (bloqueado na UI + `signOutGoogle` reseta setting) | ✅ |
| B16 | Perfil: `birthDate` carregado do AsyncStorage ao abrir a subscreen (corrige bug de não exibir) | ✅ |
| B17 | i18n pt/en/es: strings de restore, Google conectado/desconectar, seleção de arquivo local | ✅ |
| B18 | Modal bottom-sheet de seleção de arquivo local de backup | ✅ |

### Notas de implementação

- **Document Picker removido**: `react-native-document-picker@9.3.1` usa `GuardedResultAsyncTask` removida do RN 0.74+. Substituído por `listLocalBackups()` que varre `Downloads/` com RNFS. Ver D.15.
- **Restore local**: usuário deve colocar o arquivo `.json` em `Downloads/` antes de recuperar. Modal lista os arquivos encontrados.
- **Restore**: replace total dos dados. Confirmação via Alert com botão destrutivo. Reload imediato via `reloadAllData()`.
- **Backup em nuvem**: armazena em Firestore `backups/{uid}` — **transitório, sem criptografia**. Será substituído por Google Drive + AES-256 na Sprint 17.
- **signOutGoogle**: além de sign out, reseta `backupLocation: 'local'` se estava em `'cloud'`.

---

## Sprint 17 — Zero-Knowledge Backup (AES-256 + Google Drive) 📋

**Status:** Planejada  
**Complexidade:** Alta  
**Pré-requisito:** Sprint 15.5 concluída ✅

### Decisão de arquitetura (2026-06-25)

Backup atual (Firestore `backups/{uid}`) armazena dados plaintext no servidor do desenvolvedor — viola política de coleta zero de dados e cria responsabilidade LGPD. Arquitetura nova:

**Usuário anônimo (sem Google):**
- Backup apenas local (`.enc`), criptografado com senha definida pelo usuário
- Chave derivada da senha via PBKDF2 — ninguém (nem desenvolvedor) consegue abrir sem a senha
- Usuário responsável pela guarda do arquivo
- Modo auto ou manual

**Usuário logado (Google):**
- Backup no Google Drive DO USUÁRIO — pasta `appDataFolder` (oculta, pertence ao usuário)
- Criptografado com AES-256-GCM; chave aleatória gerada pelo app
- Chave armazenada em Firestore `keys/{uid}` (protegida por Firebase Auth — só o próprio UID acessa)
- Desenvolvedor tem acesso às chaves mas NÃO aos arquivos de backup → chave sem arquivo = inútil
- Chave rotaciona a cada novo backup
- Sem opção de backup local para usuário logado (Drive já resolve)

**Resultado:** Servidor do desenvolvedor armazena zero dados de usuário. Apenas chaves AES aleatórias.

### Itens da Sprint

| # | Item | Complexidade |
|---|---|---|
| C1 | `src/utils/cryptoUtils.ts`: AES-256-GCM encrypt/decrypt; geração de chave aleatória; PBKDF2 para senha offline | Alta |
| C2 | `src/utils/driveUtils.ts`: upload/download via Google Drive REST API + OAuth token do GoogleSignin | Alta |
| C3 | `src/utils/keyUtils.ts`: gerar, salvar e buscar chave de `keys/{uid}` no Firestore | Média |
| C4 | Atualizar `backupUtils.ts`: export local anônimo → PBKDF2 + AES; export Google → Drive + rotação de chave | Alta |
| C5 | Restore local anônimo: usuário informa senha → PBKDF2 → descriptografa `.enc` | Média |
| C6 | Restore Google: login → busca `keys/{uid}` → lista arquivos Drive → descriptografa | Alta |
| C7 | Detecção de conflito ao trocar conta: dados no device + backup no Drive da nova conta → Alert de escolha | Alta |
| C8 | Remover coleção `backups/{uid}` do Firestore + atualizar `firestore.rules` com `keys/{uid}` | Baixa |
| C9 | UI: tela Backup simplificada — sem opção de destino para usuário logado; campo de senha para anônimo | Média |
| C10 | i18n pt/en/es: strings de senha, criptografia, conflito de conta | Baixa |
| C11 | Biblioteca AES: avaliar `react-native-quick-crypto` (compatibilidade RN 0.80 antes de instalar) | Baixa |

### Notas de design

- `keys/{uid}` Firestore: `{ keyBase64: string, createdAt: string }` — apenas isso
- Arquivo de backup: extensão `.enc`, conteúdo `{ iv: base64, ciphertext: base64 }`
- Google Drive `appDataFolder`: arquivos invisíveis ao usuário no Drive, acessíveis apenas pelo app com o mesmo OAuth scope — não conta contra a cota visível do usuário (mas conta contra os 15GB)
- Conflito de conta (C7): nunca mesclar dados de duas contas; opções são "Restaurar backup de [conta]" ou "Manter dados atuais"
- Se usuário perder acesso à conta Google: perde a chave → não consegue abrir backups Drive. Mas dados ainda estão no app. Pode fazer backup local manual com nova senha.

**O que NÃO fazer:**
- ❌ Não armazenar a senha do usuário em lugar nenhum — só a chave derivada dela (ou a chave AES para usuários Google)
- ❌ Não tentar salvar backup Google em Firestore — mesmo que seja menor, viola a proposta zero-knowledge
- ❌ Não instalar bibliotecas nativas de crypto sem verificar compatibilidade com NDK 27.1 (ver D.9, D.12)

---

## ❌ Decisões Revertidas / Abordagens Descartadas

> **Leia antes de propor qualquer solução.** Cada item aqui representa tempo perdido se repetido.

| # | Abordagem | Sprint | Por que foi descartada | Alternativa atual |
|---|---|---|---|---|
| D.1 | **Steps em EventForm** | 0→1 | Complexidade sem valor real. | Anotações (notas livres em pilha) |
| D.2 | **Modal de seleção de tags** | 1→2 | Overhead para 8 opções fixas. | Chips inline 2×4 |
| D.3 | **Título de pendência travado** | 1→2 | Sem justificativa UX. | Título livremente editável |
| D.4 | **FAB (botão flutuante redondo)** | 0 | Inconsistente entre telas, acessibilidade ruim. | Botão fixo na base de cada tela |
| D.5 | **`sharedWith: string[]`** | 5→6 | Implica N parceiros. Modelo é 1:1. | `sharedWithUid: string \| null` — **não voltar para array** |
| D.6 | **Double-query em `onSnapshot`** | 5→6 | +4 leituras Firestore por atualização. Latência e custo. | Processar snapshot diretamente — **nunca fazer query adicional dentro de `onSnapshot`** |
| D.7 | **Botão `← Voltar` em ShoppingListScreen** | 5→6 | Redundante com BackHandler (Android). | BackHandler já implementado |
| D.8 | **`Clipboard` do core React Native** | 5→6 | API depreciada — pode quebrar em versões futuras do RN. | `@react-native-clipboard/clipboard` |
| D.9 | **QR Scanner via `react-native-vision-camera v4`** | 6 | Incompatível com NDK 27.1 (falha de ABI). Build falha. | QR display via `react-native-qrcode-svg` — **não tentar scanner sem resolver NDK** |
| D.10 | **Dupla confirmação de exclusão** | 5→6 | Dois Alerts encadeados = fadiga cognitiva. | Alert único com texto descritivo e botão destrutivo |
| D.11 | **Reabrir = roxo (B4 Sprint 6.1)** | 6.1→10 | Todos os testers reportaram incoerência. O card já comunica o estado "concluído" visualmente — o botão Reabrir deve ser verde (ação afirmativa), não roxo (ação secundária). | Reabrir = verde (`gridBtnSuccess`) em `EventCard`, `RoutineCard`, `SwipeRow` e `ListsScreen` — implementar em Sprint 10.1 (G1) |
| D.12 | **`react-native-reanimated` v3** | 10 | Mesmo problema de ABI do NDK 27.1 que derrubou o QR scanner (D.9). Linker falha com símbolos `std::__ndk1::*` ausentes — incompatibilidade entre libc++ do NDK 27.1 e o C++ nativo da lib. **Não tentar instalar sem resolver NDK.** | `Animated` API nativo do React Native com `useNativeDriver: true` |
| D.13 | **Leitor de código de barras nos itens de lista** | discussão 10.1 | Mesma família de problema do D.9 e D.12: qualquer lib de câmera nativa tem risco de incompatibilidade com NDK 27.1. Além disso, requer API de banco de produtos (Open Food Facts para alimentos; sem opção gratuita confiável para não-alimentos). Complexidade alta, retorno incerto neste momento. | Não implementar antes de resolver NDK e validar API de produtos. Registrado como ideia para revisão futura. |
| D.14 | **Foto do produto na lista de compras** | discussão 10.1 | Requer Firebase Storage (custo adicional), aumenta tamanho do app, e analytics de apps similares mostram baixo uso da feature de foto. | Descartado. Não implementar. |
| D.15 | **`react-native-document-picker@9.3.1`** | Sprint 15.5 | Usa `GuardedResultAsyncTask` (classe `com.facebook.react.bridge`) removida no RN 0.74+. Build falha com `cannot find symbol`. É a versão mais recente da lib — sem fix disponível. | `listLocalBackups()` via RNFS varre `Downloads/` por arquivos `taskflow-backup-*.json`. Instruir usuário a mover o arquivo para `Downloads/` antes de restaurar. |
| D.16 | **Backup em Firestore `backups/{uid}`** | Sprint 15.5→17 | Armazena dados de usuário em plaintext no servidor do desenvolvedor. Viola política de coleta zero de dados e cria responsabilidade LGPD. Chave sem arquivo é inútil, mas arquivo com dados é um risco. | Google Drive `appDataFolder` (arquivo criptografado, pertence ao usuário) + `keys/{uid}` Firestore (só a chave AES). Implementar na Sprint 17. |

---

## 📌 Estado Atual do App (25 Jun 2026)

**Versão:** 1.4-beta  
**Branch main:** `fdc9f69` — Sprint 15.5 concluída (Backup Completo + Restore + Google no Perfil)

| Módulo | Estado | Notas |
|---|---|---|
| Eventos (criar/editar/concluir/reabrir/agendar) | ✅ Estável | |
| Pendências | ✅ Estável | |
| Listas (compras/tarefas) | ✅ Estável | |
| Rotinas | ✅ Estável | Exceto compartilhamento → Sprint 16 |
| Compartilhamento (eventos + listas) | ✅ Estável | 12 bugs corrigidos em Sprint 15; regras Firestore criadas |
| Compartilhamento (rotinas) | 📋 Não iniciado | Sprint 16 |
| TaskDetailScreen (grade 2×3) | ✅ Estável | Sprint 13 |
| Animações (todas as telas) | ✅ Estável | Sprint 13.7 |
| Telas de Criação (4 forms) | ✅ Redesenhadas | Sprint 14 |
| Tela Configurações | ✅ Reorganizada | Post-Sprint 14 (commit `7653e16`) |
| Exclusão automática | ✅ Implementado | Master toggle + por tipo + delay compartilhado |
| Notificações locais | ✅ Implementado | via `@notifee/react-native` |
| Modo Compras (ShoppingList) | ✅ Implementado | |
| Hidratação (beber água) | ✅ Concluído | Sprint 10.2; editar e deletar entradas (13.7) |
| Onboarding | ✅ Implementado | Sprint 15 — 7 etapas + coleta de nome/idioma/tema |
| Google Sign-In | ✅ Implementado | Sprint 15 — linking anônimo→Google; desconectar em Sprint 15.5 |
| Backup local (RNFS) | ✅ Implementado | Sprint 15.5 — arquivo `.json` em Downloads; modal de seleção |
| Backup em nuvem (Firestore transitório) | ⚠️ Transitório | Sprint 15.5 — plaintext, sem criptografia. Substituir por Drive + AES na Sprint 17 |
| Restore local + nuvem | ✅ Implementado | Sprint 15.5 — valida + confirma + `reloadAllData()` |
| QR Code (display) | ✅ Funcional | |
| QR Code (scanner) | ❌ Descartado | NDK 27.1 incompatível — D.9 |
| Rebrand (nome + logo) | ⚠️ Bloqueado | Aguarda decisão de produto |
| i18n pt/en/es | ✅ ~98% coberto | Sprint 15 adicionou strings de onboarding, backup, compartilhamento |
| Tema dark/light/auto | ✅ Estável | |
| Schema migration | ✅ Implementado | `src/utils/schemaUtils.ts` |

**Próximas sprints:**
- Sprint 16 — Compartilhamento de Rotinas (alta complexidade)
- Sprint 17 — Zero-Knowledge Backup: AES-256 + Google Drive + `keys/{uid}` (pré-requisito Play Store)

---

## Expansões Futuras

> Estas fases só começam **após** o app estar publicado e estável nas stores. Não são parte do roadmap imediato.

### Feature: Pastas / Categorias de Rotinas (pós-lançamento)

**Origem:** Sugestão de tester — poder agrupar rotinas em pastas como "Higiene pessoal", "Trabalho", "Exercícios".

**Análise:** A feature faz sentido mas tem timing errado para pré-lançamento. Usuários com menos de ~10 rotinas (maioria dos testers atuais) não sentem necessidade de categorias. O valor cresce com o volume de uso. Revisitar quando houver dados de quantas rotinas os usuários criam em média.

**Implementação futura:**
- Campo `category?: string` em `Rotina` (`src/types/index.ts`).
- UI de criação/gerenciamento de categorias na sub-tela "Minhas Rotinas" da HomeScreen.
- Agrupamento dos RoutineCards por categoria dentro da sub-tela.
- Schema migration para rotinas existentes (default: sem categoria).

---

### Feature: Badges (números) nos 5 ícones da barra de navegação (pós-lançamento)

**Origem:** Discutido como melhoria de UX — indicar itens pendentes em cada tela sem precisar navegar.

**Pré-requisito:** Definir as regras de negócio de cada badge antes de implementar:
- **Hoje:** total de itens do dia não concluídos?
- **Eventos:** eventos futuros?
- **Listas:** listas ativas com itens pendentes?
- **Pendências:** total de pendências abertas?
- **Config:** atualizações disponíveis? convites pendentes?

Sprint separada após definir as regras.

---

### Feature: Score / Streak de dias "Tudo em paz!" (pós-lançamento)

**Conceito:** Contabilizar discretamente os dias consecutivos em que o usuário concluiu tudo (eventos + rotinas). Usar esse score para variar as mensagens da tela vazia das três telas irmãs:

| Tela | Mensagem atual | Com streak ativo |
|---|---|---|
| Hoje | "Tudo em paz!" | "Tudo em paz! X dias seguidos" |
| Listas | "Tudo em ordem!" | variações motivacionais |
| Pendências | "Tudo em dia!" | variações motivacionais |

**Motivação:** As três frases formam um mantra implícito do app ("em paz, em ordem, em dia"). Hoje ficam escondidas — o usuário só as vê se concluir tudo ou se instalar o app sem dados. O streak tornaria essas mensagens recorrentes e recompensadoras.

**Implementação futura:**
- Campo `streakDays: number` e `lastFullCompletionDate: string` em `AppSettings`.
- Atualizado no `init()` do `App.tsx` ao detectar que o dia anterior teve tudo concluído.
- Mensagens variáveis em `LanguageContext` indexadas por faixas de streak (1-3, 4-7, 8-14, 15+).

**Não implementar antes:** definir o conjunto completo de mensagens motivacionais nos 3 idiomas.

---

### Feature: Recursos Especiais (pós-lançamento)

> Estes recursos ficarão agrupados na sub-tela "Recursos Especiais" em Configurações, que já existe. Cada item abaixo é uma feature independente a ser ativada pelo usuário.

---

#### Cartão de Aniversário

**Conceito:** Um cartão digital personalizável que o usuário cria e compartilha com outro usuário do app para parabenizá-lo pelo aniversário.

**Funcionamento:**
- O usuário escolhe um parceiro conectado, escreve uma mensagem e seleciona um design/layout do cartão.
- O cartão chega como notificação no app do destinatário no dia do aniversário.
- O destinatário pode visualizar, salvar e responder.
- Pré-requisito: o app detecta a data de nascimento registrada no perfil do destinatário (já existe o campo `birthDate` em `AppSettings`).

**Implementação futura:**
- Coleção Firestore `birthdayCards/{id}` com `fromUid`, `toUid`, `message`, `design`, `scheduledDate`.
- Templates de cartão em SVG/componente React Native.
- Notificação local agendada pelo app do remetente na data do aniversário do destinatário.

---

#### Data Especial

**Conceito:** Marcação de uma data com significado especial (aniversário de relacionamento, formatura, viagem, etc.) que pode ser compartilhada com outro usuário conectado.

**Funcionamento:**
- O usuário cadastra uma data com título e descrição curta.
- Opcional: compartilhar com um parceiro — ambos veem a contagem regressiva e recebem notificação no dia.
- Diferente de um Evento comum: não tem hora, não migra para Pendências, e pode ser recorrente anualmente.

**Implementação futura:**
- Campo `type: 'data-especial'` ou entidade separada `SpecialDate` em `src/types/index.ts`.
- UI na tela "Recursos Especiais" com lista de datas cadastradas e botão de adicionar.
- Sync via Firestore se compartilhada, similar a `sharedEvents`.

---

#### Dieta

**Conceito:** Feature dedicada ao acompanhamento de dieta, integrando listas de refeição e marcações diárias de consumo.

**Funcionamento:**
- O usuário cadastra um plano de refeições (café, almoço, lanche, jantar) como listas do tipo `'refeicao'`.
- Cada refeição tem itens (ex: "Salada", "Proteína", "Carboidrato") que podem ser marcados como consumidos ao longo do dia.
- Painel diário mostra o progresso do plano, similar ao bloco de hidratação na HomeScreen.
- Opcional: meta calórica e registro de calorias por item.

**Implementação futura:**
- Novo `type: 'refeicao'` em `ShoppingList` (ou entidade separada `MealPlan`).
- Bloco na HomeScreen (quarto bloco, após Hidratação) com progresso do dia.
- Schema migration para itens com campo `calories?: number`.
- Não implementar antes de validar demanda com usuários — feature de nicho com alta complexidade.

---

#### Contagem Regressiva

**Conceito:** Um contador especial que exibe quanto tempo falta para uma data marcada pelo usuário — em dias, horas, minutos ou segundos, conforme a proximidade.

**Funcionamento:**
- O usuário cria uma contagem regressiva com título e data-alvo (ex: "Viagem para Paris — 47 dias").
- Quando ativo, aparece na tela "Recursos Especiais" como um widget visual.
- Opcional: widget na HomeScreen (abaixo dos blocos de rotinas/compromissos) quando há uma contagem regressiva ativa.
- Quando a data chega, o contador exibe "Chegou o dia!" e pode ser arquivado ou excluído.

**Implementação futura:**
- Entidade `Countdown` em `src/types/index.ts` com `id`, `title`, `targetDate`, `createdAt`.
- Persistência em AsyncStorage com chave `@taskflow_countdowns`.
- UI de lista e criação dentro de "Recursos Especiais".
- Atualização em tempo real via `setInterval` na tela (sem persistência de timer — recalculado ao abrir).

---

### Fase A — Interface Web (pós-Play Store + App Store)

**Conceito:** Painel web tipo "controle remoto" — acesso ao TaskFlow de qualquer PC/Mac via navegador, sem instalar nada. Mesmo dados, mais espaço, mais velocidade de operação.

**Referência de UX:** WhatsApp Web — o celular é o dono dos dados, a web é uma janela extra.

**O que precisaria:**
- Backend com API REST (Cloud Functions no Firebase, que já usamos)
- Autenticação web via Firebase Auth
- Interface web em React (reaproveitamento de lógica do app)
- Sync em tempo real via Firestore (já existe no app)

**Por que faz sentido:** Usuários que gerenciam rotinas complexas preferem teclado + tela grande para organizar tudo de uma vez. O app continua sendo o canal principal (notificações, mobilidade). A web é produtividade em mesa de trabalho.

---

### Fase B — Integração com IA via MCP (pós-Interface Web)

**Conceito:** Expor o TaskFlow como ferramenta conectável na IA que o usuário já usa. O usuário escreve no Claude/Gemini/ChatGPT dele: *"Organiza minha semana no TaskFlow assim..."* — a IA cria os eventos, listas e pendências diretamente no app.

**O que NÃO é:** não é uma IA embutida no app. Tokens, conta e plano são do usuário. O TaskFlow fornece apenas a conexão.

**Arquitetura:**

```
TaskFlow API (Cloud Functions)  ← construída na Fase A
    ├── MCP Server  →  Claude, Gemini, Cursor e qualquer cliente MCP
    └── OpenAPI spec →  ChatGPT Actions (sistema próprio da OpenAI)
```

**Compatibilidade por IA:**
| IA | Protocolo | Status do suporte |
|---|---|---|
| Claude (Anthropic) | MCP nativo | Suporte total — criador do protocolo |
| Gemini (Google) | MCP | Adotado oficialmente em 2025 |
| ChatGPT (OpenAI) | OpenAPI/Actions | Sistema próprio — mesma API, adaptador diferente |
| DeepSeek / outros | MCP (via clients) | Depende do client que o usuário usa |

**Dependência crítica:** A Fase B só é viável depois da Fase A. A API REST que a interface web precisará é a mesma que o MCP Server usará. Construir uma só vez, servir os dois.

**Por que faz sentido:** Muitos usuários já usam IA como assistente pessoal. O TaskFlow seria o "quarinho na porta da geladeira" compartilhado com a IA — não uma aplicação exclusiva de IA, mas uma integração natural com o fluxo que o usuário já tem.

---

*Última atualização: 26 Jun 2026 — Sub-tela "Recursos Especiais" criada em Configurações; Hidratação movida para dentro dela; expansões futuras: Cartão de Aniversário, Data Especial, Dieta e Contagem Regressiva documentadas.*
