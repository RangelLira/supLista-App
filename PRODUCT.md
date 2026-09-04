# TaskFlow — Product Document

*Updated: Jun 2026 — Sprint 13.7*

---

## Developer Philosophy

All projects share the same foundation:

**No ads. No invasive data collection. No unauthorized use of user data.**

Monetization models (per app):
- Open source and free, or
- Free with voluntary contribution request, or
- One-time purchase (own it permanently — no subscriptions)

Technical commitments:
- Apps run locally — no external servers
- No personal data captured or shared
- Backups are end-to-end encrypted — even the backup provider (e.g. Google) cannot read the data
- Sharing features (where applicable) must be designed within these constraints or as close as possible

This is both an ethical stance and a product differentiator. Privacy as a feature, not a disclaimer.

These apps are also a portfolio. The goal is to build products that genuinely help people — and to demonstrate that it's possible to do that without compromising user trust.

---

## Origin & Vision

TaskFlow started from a simple, real problem: a shared shopping list.

The developer and his wife live separate routines during the week and go to the supermarket on weekends. No existing tool solved their actual flow — they tested apps, whiteboards, sticky notes, physical lists on the fridge, WhatsApp messages, Google Calendar events, text messages, group chats. Everything was fragmented. The dream was one app where both could build a shopping list together, add and remove items independently, schedule the trip, and check off items in the store while tracking the total price in real time.

That core use case grew into a broader vision: a single place to coordinate their shared routine. Both have ADHD diagnoses and hyperfocus. Their daughter is 3 years old. The cognitive load of managing daily life across multiple disconnected tools is real and exhausting.

This shaped every design decision:
- Neutral colors, minimal visual noise — intentional accessibility for ADHD
- No ads, no data leaks — their personal routine stays private
- Few options per screen — reduce decision fatigue
- Simple interactions that actually solve real problems

The creator is the user. The wife is the user. The problem is lived daily.

---

## Development Phases

**Phase 0 — Foundation (current)**
Building and refining core features. Defining rules, flows, and interface. No public distribution yet.

**Phase 1 — Beta Testers**
First .apk distributed to 7 people including the developer's wife and close friends.
- UI is being validated — buttons exist even if not yet functional (testers are aware)
- Goal: validate feel, flow, and visual comfort before building backend features
- Sharing button exists in the interface as a placeholder — intentional

**Phase 2 — Play Store**
Public distribution on Google Play Store. All features must be working, including sharing.
- Possible freemium model (free + paid tier), but current focus is a full-featured single version
- Android only — no Apple Store plans (cost prohibitive)

**Phase 3 — Scale decision**
After Play Store launch, evaluate real adoption. If the app finds a community:
- iOS port
- Broader platform expansion
- Possible radical decision (TBD)

Phase 3 may never happen. The goal is to reach Phase 2.

---

## Concept

**Tagline:** "Capture. Organize. Execute."

**Target users:** Anyone who needs to organize their daily routine — especially people with attention deficit, neurodivergence, or ADHD.

**Core problem:** Coordinating routines, shopping lists, undated tasks, and idea flow without losing track of anything.

**Philosophy:** Simple things that make a difference. Small details = big competitive advantages. Don't reinvent — do it better.

### The 3 Pillars

| 📝 LISTS | ⏳ PENDING | 📅 EVENTS |
|---|---|---|
| Organize | Capture | Execute |
| What to do | What not to forget | When to do it |

---

## Screen Structure

### Card Pattern (universal)
All cards (events, pendings, lists) are non-expandable single-line rows — icon/time area + title (`flex:1`) + badges (🔗 📝 👥). Tap → opens `TaskDetailScreen` (or `ShoppingListScreen` for lists). Swipe right → complete/reopen. Swipe left → delete.

**Exception — EventsScreen (calendar):** `EventCard` retains old expand/collapse behavior for backward compat.

**TaskDetailScreen (detail pattern):** Full-screen view for pending/event/rotina. Layout: scrollable body (title, tag, notes textarea) + fixed bottom bar (2×3 action grid + Back button).

**Active event/pending action grid (2×3):**
| Row 1 | Agendar/Adiar/Suspender | Vincular/Desvincular | Compartilhar |
|---|---|---|---|
| Row 2 | Editar | Excluir | Concluir |

**Concluded event/pending action grid:**
- Row 2 becomes: Editar (disabled) | Excluir | Reabrir
- Reopen is smart: past event + auto-migration ON → Alert "Mover para Pendências" or "Reagendar". Pending items always reopen directly.

**Button color rule:** "Desvincular" is always `primary` (purple) — it's a neutral/reversible action. Red (`danger`) is reserved exclusively for Excluir.

**List card action grid (2×2) — active:**
| Vincular / Desvincular | Compartilhar / Recebido |
|---|---|
| Excluir | Concluir |

**List card action grid (2×2) — concluded:**
| Arquivar | Compartilhar / Recebido |
|---|---|
| Excluir | Reabrir |

### HOJE (Today)
Dashboard of the current day with animated entry (header falls from top, progress bar, greeting slides from right).
- Overview: two blocks — Rotinas and Compromissos. Water tracker block below when enabled.
- Sub-view "Minhas Rotinas": full list of today's RoutineCards + Back button.
- Sub-view "Meus Compromissos": full list of today's EventCards + Back button.
- Sub-view "Meus Registros de Água": history of today's water entries with edit/delete per entry.
- No "create event" button on Today screen — creation happens in EventsScreen.
- Tapping the nav tab while already on Today → resets to overview (no re-navigation).

### LISTAS (Lists)
- Animated entry (same system as HomeScreen).
- Stable card order: cards do not reorder when a list is concluded — concluded state communicated by visual style.
- Mantra text ("Tudo certo!") appears with fade transition when all lists are concluded/empty.
- Tap card → opens ShoppingListScreen as overlay (replaces list view in the same screen slot).
- Tap nav tab while already on Lists → closes ShoppingListScreen and returns to list view.
- Create new: Lista Vazia or Herdar Lista (from Concluded or Archived)
- Herdar Lista: new list starts with unchecked items and zeroed prices
- Inside ShoppingListScreen: toggle between notes view and items view. Progress bar above items. "Adicionar Item/Tarefa" in footer.
  - Toast fires when all items are checked.
  - Excluir and Arquivar accessible from TaskDetailScreen/action grid.

### PENDÊNCIAS (Pending Items)
- Animated entry (same system as HomeScreen).
- Stable card order: items do not jump sections when concluded — all rendered in one unified list.
- Mantra text ("Tudo em dia!") transitions with fade when open count reaches zero. Toast fires at that moment.
- Concluded items show DD/MM + HH:MM in the time area (no "PENDENTE" badge).
- Tap card → opens TaskDetailScreen.
- Tap nav tab while already on Pendências → returns to root if inside TaskDetailScreen.
- Auto-delete policy for concluded pendings: configured in Settings (Nunca / Após 1 dia / 1 semana / 1 mês).
- Pending title is freely editable at any time.

### EVENTOS (Events)
- Section title "MEUS EVENTOS" above the calendar on the main screen
- Section title "MEUS EVENTOS" above event cards in the day detail view
- Visual calendar with monthly navigation
- Subtitle shows "X atrasados" when auto-migration is OFF
- Day detail view: tap "Ver detalhes deste dia" or double-tap a calendar day

### CONFIG (Settings)
Four sections:

**1. Opções do App**
- Theme: Light / Dark / Auto (follows system default)
- Language: Português BR / Español / English
- Auto-migration toggle: when OFF, overdue events stay open and show as "ATRASADO"
- Manage archived lists: view and delete archived lists
- Danger Zone: Delete all app data

**2. Backup e Sincronização**
- Auto-backup frequency: Daily / Weekly / Monthly / Never (UI only — not yet functional)
- **Concluded events auto-delete**: Nunca / Após 1 dia / 1 semana / 1 mês — two independent policies (one for events, one for pendings). Applied on every app startup.
- Actions: "Fazer backup agora" / "Restaurar Backup" (UI only — not yet functional)
- Backup destination: Google Drive (planned)
- ⚠️ iOS compatibility is a future concern — app is Android-only for now

**3. Compartilhamentos**
- Manages active sharing between app users via Firebase Firestore
- Events and lists can be shared with specific users by UID
- Shared items are synced in real-time; deleting an item removes it from all recipients
- "Recebido" badge shown on items shared by others (read-only actions)

**4. Sobre**
- App credits and author signature
- Version info
- ⚠️ Layout not yet defined

---

## Main Flows

**Shopping List:**
Create List → add items during the week → link to "Ir ao Mercado" Event → check items at the store → conclude list → conclude event

**Simple Pending:**
Create Pending → decide the day → Schedule → becomes Event → conclude

**Pending with List:**
Create Pending → link Task List → Schedule → becomes Event (list migrates) → check tasks → conclude list → conclude event

**Inherit List:**
Create new List → Herdar Lista → select Concluded or Archived list → new list with unchecked items and zeroed prices

**Annotations:**
Open event or pending → tap Editar → focus "Escreva uma anotação" field → bottom bar switches to Anotar | Cancelar → tap Anotar → note saved immediately to storage (hot), added to top of stack → bottom bar returns to Salvar | Cancelar → Salvar applies only to title/date/time fields

---

## Competitive Advantages

| Feature | TaskFlow | Todoist | Any.do | Google Cal |
|---|---|---|---|---|
| List ↔ Event linking | ✅ | ❌ | ❌ | ❌ |
| Inherit list | ✅ | ❌ | ❌ | ❌ |
| Pending → Event | ✅ | ❌ | ❌ | ❌ |
| Date-aware search | ✅ | ❌ | ❌ | ❌ |
| Capture→Organize→Execute ecosystem | ✅ | ❌ | ❌ | ❌ |
| Auto-migration of overdue events | ✅ | ❌ | ❌ | ❌ |

---

## Roadmap

### ✅ V1.0 — Done
- Full navigation
- Events system with calendar
- Pending items system
- Shopping lists
- Global search with date detection
- Auto-migration of overdue events (toggle in Settings)
- AsyncStorage persistence
- Settings screen with archived lists management
- Optional time on events (Dia Todo)
- Task List type (alongside Shopping List)
- List ↔ Event/Pending bidirectional linking
- Inherit list when creating new (from Concluded or Archived)
- List archiving
- Pending conclusion flow (archive → creates historical event)
- ATRASADO badge for overdue events when auto-migration is OFF

### ✅ V1.1 — Done (Session 4)
- Universal expandable card pattern (one expanded at a time per screen)
- Event/Pending action grid: 2×3, text-only, equal-width buttons, context-aware states
- List card action grid: 2×2 in Lists screen
- ShoppingListScreen footer simplified: only Adicionar Item + Finalizar/Reabrir
- Notes saved to AsyncStorage immediately on "Anotar" (hot save)
- Notes displayed as stack (most recent on top)
- Note input field always visible in form; "Anotar/Cancelar" replaces "Salvar/Cancelar" while typing
- Keyboard properly dismissed after Anotar/Cancelar
- `keyboardShouldPersistTaps="handled"` — single tap registers even with keyboard open
- Pending item title freely editable (restriction removed)
- Unlink list from list card side (`handleUnlinkFromList` — bidirectional)
- Section title "MEUS EVENTOS" on Events screen (calendar view and day detail)
- Expanded state lifted to screen level — Concluir/Reabrir no longer collapses the card

### ✅ V1.2 — Done (Session 5)
- Real-time sharing via Firebase Firestore (events and lists)
- No emojis inside any button text (text-only rule enforced everywhere)
- List cards: collapsed = single line (header only); expanded shows body + actions
- Concluded list cards: strikethrough title + green card background
- Archive lists: "Arquivar" button replaces Vincular slot on concluded list cards
- Concluded event/pending action grid: 1×3 — Editar (disabled) | Excluir | Reabrir
- Smart reopen for past events: Alert → "Mover para Pendências" or "Reagendar"
- `completedAt` timestamp on all concluded events and pendings
- Concluded pendings: display DD/MM + HH:MM of conclusion in collapsed header (no "PENDENTE" badge)
- Concluded pendings sorted by completion date descending (most recent first)
- Auto-delete policy for concluded items: two independent settings (events / pendings), applied on startup
- Settings > Backup: two real policy pickers wired to AsyncStorage
- Text standardization: Pendências title (no emoji), "EM ABERTO" / "CONCLUÍDAS" sections

### ✅ V1.3 — Final Phase (Sessions 6–6.1, May 2026)

Critical fixes (P1) — all done:
- ✅ Fixed double-query anti-pattern in Firestore share listeners
- ✅ Auto-propagate updates to Firestore when shared items change (via `syncSharedEvent`/`syncSharedList`)
- ✅ Schema migration in `src/utils/schemaUtils.ts` (applied on every `loadEvents`/`loadLists`)
- ✅ Replaced deprecated `Clipboard` API
- ✅ Single-confirmation alerts across all delete actions
- ✅ `sharedWith: string[]` → `sharedWithUid: string | null` (1:1 partner model enforced)
- ✅ `exitSharedEvent`/`exitSharedList`: recipient can leave without unsharing

i18n completion (P2) — all done:
- ✅ ~80 new keys in `LanguageContext.tsx` covering all 3 languages
- ✅ `getDayName`/`getMonthName`/`formatHeaderDate` with locale support
- ✅ All Alert dialogs use translation keys
- ✅ PendingScreen, PendingForm, SharingScreen, RoutineForm, RoutineCard fully translated

UX refinements (P3) — all done:
- ✅ Double-tap list card header opens list directly
- ✅ Tappable 📝 badge opens linked list from card header
- ✅ Visual sync indicator (ActivityIndicator replaces 👥 during Firestore ops)
- ✅ Motivational progress bar on Today screen
- ✅ Toast/Snackbar global with Undo (3s)
- ✅ Swipe actions on EventCard (PanResponder, no external lib)

Features (P4) — status:
- ✅ Local notifications (`@notifee/react-native`) — daily + per-event modes
- ✅ QR Code display for invite codes
- ❌ QR Code scanner removed — `react-native-vision-camera v4` incompatible with NDK 27.1
- ✅ Invite expiry (24h TTL)
- ✅ Shopping mode in ShoppingList

Post-test corrections (Sprint 6.1) — all done:
- ✅ Full i18n coverage for PendingForm, ShoppingList items, RoutineCard/Form, SharingScreen
- ✅ RoutineCard suspended state: Edit/Delete active, only Complete disabled
- ✅ RoutineCard completed: Reopen button active
- ✅ Swipe improvements: directional backgrounds + card fly-off animation
- ✅ Swipe on list cards (`SwipeRow.tsx`) and RoutineCard
- ✅ Day navigation carousel in EventsScreen (`[<] [date] [>]`)
- ✅ Completed events no longer appear in Today screen list

### ✅ V1.4 — Done (Sprints 13–13.7, Jun 2026)
- ✅ TaskDetailScreen: full-screen detail view with 2×3 action grid and inline notes textarea
- ✅ Animations propagated to all screens (EventsScreen, ListsScreen, PendingScreen)
- ✅ Stable card ordering — no reorder on complete/reopen
- ✅ Mantra text transitions (fade) when all items are done
- ✅ Water log: view, edit, and delete individual daily entries
- ✅ DEV TOOLS section in Settings (seed injector + clear data, __DEV__ only)
- ✅ Unit tests for core utilities (dateUtils, rotinaUtils, schemaUtils, storage, migrations)
- ✅ "Desvincular" button unified as primary (purple) — not danger

### 🔧 V1.5 — Next
- Sharing audit and fixes (Sprint 10.3) — testers reported sharing features broken
- Routine sharing restructure (Sprint 11) — high complexity
- Backup to Google Drive with end-to-end encryption (Sprint 12)
- ShoppingList bugs: price with comma, modal squeeze, price × qty (Sprint 10.1 LB1–LB3)

### 🔮 V2.0 — Future
- Automatic backup to Google Drive with E2E encryption (UI exists in Settings, not functional — see Sprint 9)
- Push notifications (FCM-based — distinct from local notifications already implemented)
- Light/dark theme toggle: **done** — `ThemeContext` fully working; selector in Settings is functional
- Multiple languages: **~95% coverage** — structure and most strings complete in pt/en/es

---

## Known Issues (Beta v1.4)

- **Routine sharing:** Routines cannot be shared. `sharedWithUid` exists on Event/ShoppingList but not on Rotina. Dedicated sprint required.
- **Backup:** Settings > Backup UI exists but has no implementation. Planned.
- **QR Scanner:** Removed due to `react-native-vision-camera v4` / NDK 27.1 ABI incompatibility. Invite codes work via text sharing.
- **Sharing regressions:** Testers reported sharing features not working reliably — audit and fix Sprint 10.3.
- **ShoppingList price input:** Decimal comma not handled (`parseFloat('25,90')` → 25). Fix pending (LB1).
- **ShoppingList modal squeeze:** Opening price modal immediately after closing another causes visual glitch (LB2).
- **About screen version:** Displays static string — not read from `package.json`. Low priority.

---

## Ideas Under Development

### Notifications
Implemented in v1.3 (Priority 4). Fully local — no server, no FCM, no Cloud Functions. Uses `@notifee/react-native` for scheduling.

**Design decisions (final):**
- **Off by default** — opt-in only. The app works fully without notifications.
- **Two modes** (user picks one when enabling):
  - *Resumo matinal*: one notification per day at a configured time (default 08:00) — "You have 3 events today". Opens the Today screen.
  - *Por evento*: one notification per scheduled event, with configurable lead time (15min / 30min / 1h / 2h).
- **All-day events**: always notified at morning time (08:00), never with minute-based lead time.
- **Pending items**: no notifications. Pendências have no temporal urgency by design.
- **Sharing**: no notifications between users. 100% out of scope.
- **No badge count**, no forced sound, no persistent notifications.

Settings stored in `AppSettings`: `notificationsEnabled`, `notificationMode`, `notificationTime`, `notificationLeadMinutes`.
Scheduling logic in `src/utils/notificationUtils.ts` — rescheduled on every app open and after every event mutation.

### Backup
Backup UI exists in Settings but is not functional. Planned destination: Google Drive. Data must be end-to-end encrypted before upload so that even Google cannot read it. Priority: v2.0.

### Sharing — "Last edited by"
Shared items should display who made the last change and when. Not a full audit log — just `lastEditedBy: { displayName, at }`. Builds trust and prevents conflicts. Priority: v1.3.
