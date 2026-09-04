# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start Metro bundler
npm start

# Run on Android (requires emulator or device)
npm run android

# Run on iOS (requires Mac + Simulator)
npm run ios

# Lint
npm run lint

# Run tests
npm test

# Run a single test file
npx jest __tests__/App.test.tsx
```

iOS only: install CocoaPods before first run or after native dep changes:
```bash
bundle install
bundle exec pod install
```

## Architecture

**TaskFlowV3** is a React Native productivity app (Android/iOS). All app logic lives in `App.tsx` and `src/`.

### State Management
There is no external state library. `App.tsx` is the single source of truth — it holds the full `events` and `lists` arrays in `useState` and passes them down as props to every screen. All mutations go through handlers defined in `App.tsx`, which call `saveEvents`/`saveLists` from `src/utils/storage.ts` to persist to AsyncStorage after every change.

### Data Model (`src/types/index.ts`)
- **`Event`** — the central entity. Doubles as both a scheduled event (`is_pending: false`, `start_time` set) and a pending item (`is_pending: true`, `start_time: null`). Recurring events share a `serieId`. Events can be linked to a `ShoppingList` via `linkedListId`. `completedAt?: string | null` stores the ISO timestamp of when the item was concluded — used for auto-delete policy and for displaying completion time on concluded pending items. `createdAt?: string | null` stores the ISO timestamp of when the pending item was created — displayed on open pending cards.
- **`ShoppingList`** — supports both shopping (`type: 'compras'`) and task (`type: 'tarefas'`) lists. Bidirectionally linked to events/pendings via `linkedEventId`/`linkedPendingId`. `isArchived` removes it from the main list view (managed in Settings). `notes?: string` stores free-text notes (plain string, unlike `Event.notes` which is `string[]`).

### Screens (`src/screens/`)
Navigation is manual — `App.tsx` maintains `activeScreen: ScreenName` and renders the matching screen component. There is no navigation library. Screens: `hoje` (today), `eventos` (calendar), `listas` (lists), `pendencias` (pending), `config` (settings).

**Settings sub-screens** (`SettingsScreen.tsx`): `subScreen` state drives an internal stack. Top-level value `null` shows the main menu. Sub-screens: `'perfil'`, `'preferencias'`, `'notificacoes'`, `'hidratacao'`, `'gerenciamento-dados'`, `'backup'`, `'compartilhamento'`, `'sobre'`. Within `'gerenciamento-dados'` there are two nested sub-screens: `'arquivo-listas'` (lists archive viewer) and `'apagar-dados'` (data deletion panel). Back from these two goes to `'gerenciamento-dados'`, not to the main menu — handled in the `BackHandler` by checking the current `subScreen`.

### Key Flows
- **Startup processing**: On app startup, `init()` in `App.tsx` runs in order: `migrateExpiredEvents()` (converts past events → pending if auto-migration is ON), `cleanupCompletedItems()` (removes concluded items older than `DeleteAfterPolicy`), then `runAutoBackupIfEnabled()` (cloud backup if configured).
- **Completing an item**: `handleCompleteEvent` sets `is_completed: true` and stamps `completedAt = new Date().toISOString()`. This timestamp drives both the auto-delete policy and the date/time display on concluded pending items.
- **Pending ↔ Event**: An event becomes pending when postponed (`is_pending: true`, `start_time: null`). It returns to scheduled when the user picks a date from `PendingScreen` via `handleScheduleEvent`.
- **Smart reopen**: When reopening a concluded event whose date is in the past AND `autoMigrationEnabled` is true, an Alert offers two choices: "Mover para Pendências" (`handleReopenAsPending`) or "Reagendar" (`handleReopenAndReschedule` — clears `is_completed` and opens `EventForm`). Pending items always reopen directly.
- **Bidirectional linking**: When a list is linked to an event (or pending), both sides store a reference. Unlinking clears both sides atomically.
- **Auto-delete policy** (`src/utils/storage.ts`): `DeleteAfterPolicy = 'never' | '1day' | '1week' | '1month'`. Four per-type keys: `deleteCompletedEventsAfter`, `deleteCompletedPendingsAfter`, `deleteCompletedRotinasAfter`, `deleteCompletedListsAfter`. The UI (Settings > Gerenciamento de dados) exposes a master toggle + individual per-type toggles + a single shared delay selector (1 dia / 1 semana / 1 mês). Turning a type toggle ON sets its policy to the shared delay; OFF sets it to `'never'`. Changing the delay updates all currently-enabled types atomically. All four default to `'never'`. Applied on every startup via `cleanupCompletedItems`, `cleanupCompletedRotinas`, `cleanupCompletedLists` in `src/utils/migrationUtils.ts`. `cleanupCompletedLists` always deletes (never archives) — archiving lists is a manual user action only.
- **Water log**: `handleAddWaterEntry`, `handleDeleteWaterEntry`, `handleUpdateWaterEntry` in `App.tsx` mutate `waterLog` state and persist via `saveWaterLog`. Input is always in ml (integer). `WaterEntry.id` is `Date.now()`. Log resets daily (only today's entries are loaded).

### Animation System
All screens use the same one-time-per-session animation pattern:

```ts
let hasPlayedAnimation = false; // module-level — resets when app restarts
```

On first mount: header falls from top (spring), progress bar animates from 100% to real value, greeting slides from right. On subsequent mounts in the same session: values are set immediately without animation.

**resetKey prop**: `App.tsx` passes `resetKey` (counter) to `HomeScreen`, `ListsScreen`, and `PendingScreen`. When the user taps the nav bar icon for the already-active screen, the counter increments and the screen resets its internal sub-view to the root (closes TaskDetailScreen, ShoppingListScreen, etc.) without navigating away.

**DEV RESET button**: All screens with animations expose a `RESET` button in the header (top-right, invisible in production) that re-triggers the animation sequence. Only rendered inside `{__DEV__ && ...}`.

**Swipe animation rule**: After a card flies off (PanResponder dx > 80 or < -80), reset `translateX` via `Animated.timing(translateX, {toValue: 0, duration: 100})` — never via `translateX.setValue(0)`. The `setValue` call can be lost in transit when `useNativeDriver: true` is active, causing the card to stay invisible on its next render.

### Card Ordering (stable)
Cards in `ListsScreen` and `PendingScreen` render all items (open + concluded) in a single unified list without reordering when an item is concluded. Conclusion state is communicated by visual style (opacity, strikethrough) — the card does not "jump" to another section. This prevents the disorienting layout shift that bothered ADHD users.

### UI / Styling
All colors and reusable styles are in `src/styles/theme.ts` (`colors` object + `globalStyles` StyleSheet). Three themes: dark / light / auto (follows system). Theme is managed via `ThemeContext` — always use `colors.*` and `globalStyles.*` from `useTheme()`, never hardcode color values.

**Header consistency rule (non-negotiable):** All screens use `globalStyles.header` without any overrides. The only allowed children are `globalStyles.headerTitle` + `globalStyles.headerSubtitle`. No extra Views, no buttons, no progress bars, no emoji, no custom `alignItems`, no modified padding/height inside the header. Every screen header must look identical in size and position — only the text content changes. This is an accessibility requirement for ADHD users: visual stability across screens eliminates cognitive re-orientation cost. If a design seems to "require" a bigger header, the design must be reconsidered, not the style.

**Card pattern (universal):** All cards (events, pendings, lists, rotinas) are non-expandable single-line rows with uniform structure and height. The `padding: 14` on `cardHeader` must be uniform. Interactions:
- **Tap** → opens `TaskDetailScreen` (or `ShoppingList` detail view for lists)
- **Swipe right** → complete / reopen
- **Swipe left** → delete

**Card layout:** `[leftCol minWidth:52 | title flex:1 | badgesRow]`
- `leftCol`: shows hora (HH:MM, `fontSize: 14, color: primary`) or "DIA TODO" (`fontSize: 11`). Nothing else — no recurrence label, no extra rows. This keeps all card heights uniform.
- `badgesRow`: `View { flexDirection: 'row', alignItems: 'center', gap: 4 }` positioned after the title. Icon size always `fontSize: 14`. Order: `👥` (compartilhado) → `🔗` (vinculado) → tipo `✅`/`🛒` (só Listas). Never use `📝` as a link badge.
- **Suspended rotina badge** (`t.common.suspendedBadge`) renders as plain text inside `badgesRow`, before `🔗`.
- **Title maxLength** enforced in forms: 50 chars for events/pendings/rotinas; 40 chars for lists (lista has one extra badge slot).
- The `🔗` badge in `EventCard` is tappable when `onNavigateToList` is provided — navigates directly to the linked list without opening the detail screen.

**Exception — EventsScreen (calendar):** `EventCard` still uses the old expand/collapse behavior there (backward compat). When `onPress` is provided to `EventCard`/`RoutineCard`, tap calls `onPress` and the expand arrow + expanded content are hidden.

**Detail screen pattern (`TaskDetailScreen`):** Full-screen view for pending/event/rotina. Layout: scrollable body (title, tag, notes textarea) + fixed bottom bar (2×3 action grid + Back button). The fixed bar uses `position: 'absolute', bottom: 0`; the scroll content has `paddingBottom: 240` to avoid overlap.

**Action grid rules (inside detail screens and ShoppingList):**
- **Active pending**: Row 1: Agendar | Vincular/Desvincular | Compartilhar — Row 2: Editar | Excluir | Concluir
- **Active event**: Row 1: Adiar | Vincular/Desvincular | Compartilhar — Row 2: Editar | Excluir | Concluir
- **Active rotina**: Row 1: Suspender/Retomar | Vincular/Desvincular | Compartilhar — Row 2: Editar | Excluir | Concluir
- **Concluded any**: Row 2 becomes: Editar (disabled) | Excluir | Reabrir
- **Active list**: Row 1: Anotações/Itens toggle | Vincular/Desvincular | Compartilhar — Row 2: Editar | Excluir | Concluir
- **Concluded list**: Row 1 Vincular slot becomes Arquivar
- **Received shared item (`isSharedWithMe`)**: Compartilhar slot → Sair (destructive); Excluir slot → `—` (disabled). Receiver is a collaborator with full edit rights except delete. Tapping Sair calls `exitSharedEvent` + immediately removes from local state + navigates back.
- All buttons are text-only — no emojis inside button text.

### Forms / Modals
`EventForm` and `PendingForm` are full-screen modals rendered at the `App` level (above the screens), controlled by `showEventForm`/`showPendingForm` booleans. `SearchModal` follows the same pattern. `CreateListForm` (inside `ShoppingList.tsx`) is rendered within `ListsScreen`.

**RoutineForm frequency modal:** `RoutineForm` contains a nested `Modal` (`showFreqModal`) for frequency configuration. Draft states (`draftType`, `draftWeekdays`, `draftMonthDay`, `draftInterval`, `draftUnit`, `draftReps`) mirror the main frequency states while the modal is open — only committed to main state on confirm (`confirmFrequency()`). Cancelling discards all draft changes. The modal registers its own `BackHandler` listener (checked before the outer form's listener). The "Configurar frequência" button is styled identically to a selected chip (`chip + chipSelected`). The modal hides Salvar/Cancelar while the keyboard is open using `freqInputFocused` (set synchronously via `onFocus`/`onBlur` on each numeric input) to avoid the ~300ms flicker gap. Custom repetitions limit: 2–99.

**ShoppingList tag:** `ShoppingList.tag_name` (optional `string`, default `'Geral'`) was added in the create form redesign. Migration is in `migrateListSchema` in `src/utils/schemaUtils.ts`.

**Android back button rule:** Every full-screen `Modal` must include `onRequestClose={onClose}`. Without this prop, the Android hardware back button does not fire inside Modals — neither the native callback nor the JS `BackHandler`. The `BackHandler` registered inside the component serves as a secondary fallback for LIFO priority ordering.

**Keyboard visibility pattern:** All create/edit forms hide the Salvar/Cancelar action bar while the keyboard is open. Each form tracks `keyboardVisible` (via `Keyboard.addListener('keyboardDidShow'/'keyboardDidHide')`) and a synchronous focus flag (`customInputFocused` for TagPicker; `freqInputFocused` for RoutineForm's frequency modal numeric inputs). The condition is `{!keyboardVisible && !<focusFlag> && <actions>}`. The synchronous flag fires immediately on `onFocus`/`onBlur` — this eliminates the ~300ms gap on Android between `focus()` being called and `keyboardDidShow` firing, which would otherwise cause the buttons to flicker. Never rely on `keyboardVisible` alone for inputs that don't use TagPicker.

### TagPicker (`src/components/TagPicker.tsx`)
Shared component used by `EventForm`, `PendingForm`, `RoutineForm`, and `CreateListForm`. Renders 7 preset tag chips + 1 "Personalizar" chip in a 4×2 grid, always followed by a custom text input.

**Interface:** `value: string` (resolved tag), `onChange: (tag: string) => void`, `onInputFocusChange?: (focused: boolean) => void`.

**Sentinel:** The "Personalizar" chip uses the internal key `'__custom__'` — never stored in `tag_name`. The `onChange` always emits the resolved value (preset string or user-typed string), never the sentinel.

**Custom tag detection:** `isCustomValue(v)` returns true when `v` is not empty, not `'Geral'`, and not in the preset list — used to restore the correct chip + input state when editing an existing item that has a custom tag. Data with legacy `'Outro'` tag_name is handled automatically as a custom tag.

**Input always visible:** The custom text input is always rendered (not conditionally). Tapping it activates the Personalizar chip via `onFocus`. Selecting a preset chip calls `inputRef.current?.blur()` to dismiss the keyboard. Selecting the Personalizar chip programmatically calls `inputRef.current?.focus()`.

**Sync guard:** The `useEffect([value])` that syncs external value changes skips execution when the resolved internal value already equals `value`, preventing the setState→onChange→value→useEffect update loop.

### Persistence
AsyncStorage keys: `@taskflow_events_clean` (events) and `@taskflow_lists` (lists). Settings at `@taskflow_settings`. Rotinas at `@taskflow_rotinas`. All reads/writes go through `src/utils/storage.ts`.

**AppSettings backup/terms fields** (added Sprint 15):
```ts
backupMode?: 'auto' | 'manual';   // default: 'manual'
backupLocation?: 'local' | 'cloud'; // default: 'local'
termsAccepted?: boolean;
termsAcceptedAt?: string;          // ISO timestamp
```

### Internationalization (i18n)
All user-visible strings **must** use the translation system. Never hardcode visible text.
```ts
const { t } = useLanguage();
// ✅ Correct
<Text>{t.common.save}</Text>
// ❌ Wrong
<Text>Salvar</Text>
```
The dictionary lives in `src/contexts/LanguageContext.tsx`. When adding new strings: add to all three languages (pt, en, es) simultaneously. Alert.alert texts also need translation keys.

### Firestore / Sharing Architecture
Real-time sharing uses Firebase Firestore. Security rules are in `firestore.rules` (deploy with `firebase deploy --only firestore:rules`). Collections:
- `users/{uid}` — user profile (displayName)
- `shares/{id}` — bidirectional connections between users
- `shareRequests/{id}` — pending connection requests
- `invites/{code}` — one-time invite codes (8 chars, single-use)
- `sharedEvents/{ownerUid}_{eventId}` — shared event documents
- `sharedLists/{ownerUid}_{listId}` — shared list documents
- `backups/{uid}` — cloud backup document (one per user, overwritten on each backup)

**Sharing permission model:**
- A user can have **multiple partners** (no connection limit). Each event/list has a single `sharedWithUid` (one person at a time).
- The receiver is a **collaborator**: full edit rights, but cannot delete. The Delete button is hidden (`—`) for `isSharedWithMe` items.
- Only the **owner** can delete an item or end sharing. Deleting an item also deletes its Firestore shared doc (`deleteSharedEventDoc`), causing it to disappear from the receiver's app via the listener.
- The **receiver** can exit sharing via the Sair button. On confirm: `exitSharedEvent` nullifies `sharedWithUid` in Firestore, `handleExitSharedEvent` immediately removes the item from local state, and the screen navigates back — no stale copy remains.
- `isSharedWithMe` items are **never auto-deleted** by the cleanup policy (guarded in `cleanupCompletedItems`).

**Critical rule:** When processing Firestore snapshots, always process the snapshot data directly — never make additional queries inside a snapshot callback.

**Update rule:** When a shared item is modified locally (via `onUpdate` in any screen), `updateSharedEvent` or `updateSharedList` must be called immediately after. `syncSharedEvent` in `App.tsx` handles both directions: if `event.isSharedWithMe`, it updates the owner's doc; otherwise it updates its own doc.

**Invite code flow:** `createShareRequest` uses a Firestore transaction to atomically validate + mark the invite as used — prevents race conditions when two people submit the same code simultaneously.

### ID Generation
IDs use `Date.now()` (timestamp in ms). Risk: collision if two items created within the same millisecond. In future: replace with nanoid or UUID. For now, do not rely on IDs being unique across users in shared scenarios.

### Schema Safety
Fields may be `undefined` on data loaded from older versions of the app (e.g., `completedAt` was added in v1.2, `notes` added earlier). Always use nullish coalescing: `event.notes ?? []`, `event.completedAt ?? null`. A migration utility exists in `src/utils/schemaUtils.ts` (`migrateEventSchema`, `migrateListSchema`) — called automatically in `loadEvents`/`loadLists` at startup.

### Notifications Architecture
Local-only. Library: `@notifee/react-native`. No FCM, no server, no Cloud Functions.

**What triggers notifications:** scheduled events only. Pending items and sharing updates never trigger notifications.

**Two modes** (user configures in Settings > App Options):
- `'daily'` — one notification per day at `notificationTime` (default `'08:00'`), summarising all events of the day
- `'per-event'` — one notification per event, `notificationLeadMinutes` before start time (default `30`)

**All-day events** (`start_time` ending in `T00:00:00`): always notified at morning time regardless of mode.

**Scheduling rule:** call `scheduleAllNotifications(events, settings)` from `src/utils/notificationUtils.ts`:
1. On `init()` in `App.tsx` (after loading events)
2. After every event mutation (create, edit, delete, complete)
3. After any notification setting change in `SettingsScreen`

The function always cancels all pending notifications before rescheduling — never accumulate stale notifications.

**Permission:** request only once, when user first enables the toggle. If denied, revert toggle to OFF and show guidance.

**Settings keys** in `AppSettings` (`storage.ts`):
```ts
notificationsEnabled?: boolean;           // default: false
notificationMode?: 'daily' | 'per-event'; // default: 'daily'
notificationTime?: string;                // default: '08:00' (HH:MM)
notificationLeadMinutes?: number;         // default: 30
```

### Google Sign-In / Auth (`src/contexts/FirebaseContext.tsx`)
Firebase Auth supports two modes:
- **Anonymous** — created automatically on first launch; used for sharing without Google account
- **Google** — user signs in via Google to link identity; `isGoogleConnected = user !== null && !user.isAnonymous`

`signInWithGoogle()` uses `@react-native-google-signin/google-signin` v13 API (`isSuccessResponse` / `isCancelledResponse`). On success it links the anonymous account to the Google credential. `FirebaseContext` exposes `isGoogleConnected`, `signInWithGoogle()`, and `signOutGoogle()`. `signOutGoogle()` signs out from Firebase + GoogleSignin, restores anonymous session, and resets `backupLocation` to `'local'` if it was `'cloud'`.

### Backup (`src/utils/backupUtils.ts`)
**Current implementation (Sprint 15.5 — transitional, pre-encryption):**
- `exportLocalBackup()` — writes `.json` to `Downloads/` (Android) or shares via sheet (iOS) using RNFS. No storage permission needed.
- `exportLocalBackupSilent()` — same but no Share sheet; used for auto-backup mode.
- `exportCloudBackup(uid)` — writes plaintext payload to Firestore `backups/{uid}`. **Transitional only — will be replaced in Sprint 17.**
- `listLocalBackups()` — scans `Downloads/` for `taskflow-backup-*.json` files, returns sorted list.
- `readLocalBackupFile(path, onConfirm, strings)` — reads + validates + shows confirm Alert before restoring.
- `importCloudBackup(uid, onConfirm, strings)` — reads Firestore `backups/{uid}`, validates, shows confirm Alert.
- `applyBackupRestore(payload)` — writes events/lists/rotinas/settings/waterLog to AsyncStorage.
- `scheduleAutoBackup(uid)` — module-level 10s debounce timer; triggered by `useEffect([events, lists, rotinas])` in App.tsx.
- `runAutoBackupIfEnabled(uid)` — called in `init()` for startup backup.

**Backup rules (enforced):**
- Anonymous users: local backup only. `backupLocation: 'cloud'` is blocked in UI and reset on `signOutGoogle()`.
- Google users: cloud backup stores to Firestore `backups/{uid}` (temporary — Sprint 17 moves this to Google Drive).

**Sprint 17 target architecture (zero-knowledge):**
- Anonymous: AES-256-GCM encrypted `.enc` file, local only, user-defined password (PBKDF2 key derivation).
- Google: AES-256-GCM encrypted file in user's Google Drive `appDataFolder` (hidden, belongs to user). AES key stored in Firestore `keys/{uid}` (key-only, no data). Key rotates each backup.
- On account switch with existing device data: prompt user to choose between restoring cloud backup or keeping local data — never auto-merge.
- `backups/{uid}` Firestore collection will be removed. Only `keys/{uid}` remains on developer's server.

### Onboarding (`src/screens/OnboardingScreen.tsx`)
7-step flow. Two paths depending on whether Google Sign-In succeeds:
- **With Google**: language → google → sharing → backup → water → terms
- **Manual**: language → google → manual_profile → backup → water → terms

Live theme selection during onboarding. Terms screen requires scroll-to-bottom before accepting. On completion, `handleOnboardingDone` in `App.tsx` reloads settings to pick up all choices made during flow.
