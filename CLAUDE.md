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
```

**Windows note:** `npm run android` / `react-native run-android` can fail on Windows with `'gradlew.bat' não é reconhecido...` (a Node.js `spawn` regression with `.bat` files). Workaround: run Metro (`npm start`) in one terminal, then from `android/`, run `.\gradlew.bat app:installDebug -PreactNativeDevServerPort=8081` directly in PowerShell, then launch the app via `adb shell am start -n com.contestsoftware.suplista/com.contestsoftware.suplista.MainActivity`. If the device shows "Could not connect to development server", run `adb reverse tcp:8081 tcp:8081`.

iOS only: install CocoaPods before first run or after native dep changes:
```bash
bundle install
bundle exec pod install
```

## Architecture

**supLista** is a React Native shopping/task list app (Android/iOS), forked from a larger productivity app (TaskFlow) and stripped down to just the lists feature. Package id `com.contestsoftware.suplista` (developer: Contest Software). The RN module name (`app.json` `name`, `getMainComponentName`, iOS `withModuleName`) is `supLista`. The iOS Xcode project/folder/target are still named `supList` — deliberately not renamed (invisible, risky Xcode surgery); only the bundle id and display name changed. All app logic lives in `App.tsx` and `src/`.

### State Management
There is no external state library. `App.tsx` is the single source of truth — it holds the full `lists` array in `useState` and passes it down as props. Mutation handlers in `App.tsx` (`handleSaveList`/`handleUpdateList`/`handleDeleteList`) only call `setLists`; a **single `useEffect(() => saveLists(lists), [lists])`** persists to AsyncStorage (never call `saveLists` from inside a `setState` updater — the updater must stay pure). `App.tsx` also holds the **item catalog** (`catalog: CatalogItem[]`) and a `recordItems(items, type)` handler threaded down through `ListsScreen` → `ShoppingListScreen`; every item add/edit/inherit/search-add calls it so the catalog accumulates.

### Data Model (`src/types/index.ts`)
- **`ShoppingList`** — the only content entity. Supports both shopping (`type: 'compras'`) and task (`type: 'tarefas'`) lists. `isArchived` exists on the type but nothing in the app currently sets it to `true` (the old archive flow was removed) — it's effectively always `false`; don't build new features assuming lists can be archived without first wiring an entry point. `notes?: string` is free-text (plain string).
- **`ListItem`** — quantity, unit, checked state, optional price (`priceType: 'unit' | 'total'`). Price is always optional; it can be set/edited inline in `AddItemModal` (there is no separate price dialog).
- **`CatalogItem`** — one distinct item the user has ever added (`name` + `type` key), with `unit`, `lastPrice`, `priceType`, `lastUsedAt`, `useCount`. Survives list deletion — it's the history behind "Pesquisar meus itens". Merge/prune logic in `mergeIntoCatalog` (`src/utils/storage.ts`), capped at 500 (LRU).

### Screens (`src/screens/`)
Navigation is manual — `App.tsx` maintains `activeScreen: ScreenName` (`'listas' | 'config'`) and renders the matching screen. There is no navigation library and **no bottom tab bar** — this app has one primary screen (Listas), so navigation to Settings is a single hamburger button (see below).

**Settings sub-screens** (`SettingsScreen.tsx`): `subScreen` state drives an internal stack (`null | 'perfil' | 'preferencias' | 'compartilhamento' | 'sobre'`). `null` shows the main menu. Each sub-screen has its own `BackHandler` that pops back to `null`.

### Hamburger navigation (persistent, every screen)
A 3-white-bar hamburger button (`menuBtn`/`menuBtnBar` styles, positioned `absolute` top-right of the header, aligned to `HEADER_TOP_PADDING` from `src/styles/theme.ts`) appears on **every** screen: `ListsScreen` root, the list detail view (`ShoppingListScreen` in `ShoppingList.tsx`), and all 4 Settings sub-screens. It is wired to a single toggle in `App.tsx`:
- From any Listas-side screen it calls `openSettings()` (pushes current screen onto `screenHistory`, switches to `'config'`).
- From any Settings-side screen it calls `closeSettings()` (pops `screenHistory`, or falls back to `'listas'`).

Both `ListsScreen` and `ShoppingListScreen` receive the same `onOpenSettings` callback (threaded through as a prop); `SettingsScreen` receives `onGoHome`. When adding a new screen, wire its header the same way rather than introducing a different navigation affordance — this is the one deliberate exception to the "header stays plain" convention that most screens follow.

### Key Flows
- **Startup**: `init()` in `App.tsx` loads settings + lists + catalog (no auto-migration or cleanup runs — there is no auto-delete-after-completion policy in this app; deleting a list is always a manual, final user action). If the catalog is empty but lists exist, it's seeded once from those lists (`seedCatalogFromLists`).
- **Creating a list**: `CreateListForm` always creates an **empty** list (no "inherit from previous list" — that concept moved into Adicionar Item, see below). After save the user stays on the **Listas** screen (does NOT auto-open the new list); they tap the card to enter it.
- **Completing a list**: `handleUpdateList` in `App.tsx` stamps `completedAt` when `isCompleted` flips true→false or false→true (cleared on reopen).
- **Adicionar Item** (`AddItemModal`): name + qty/unit + optional **price** (with per-unit/total toggle when qty > 1), all inline. Two extra buttons (add mode only): **Herdar item de lista** — active only when another list of the *same type* has items; opens `InheritItemsView` (full-screen, multi-select across several source lists, dedups against current items). **Pesquisar meus itens** — opens `SearchItemsView` (full-screen, autocomplete over the catalog; tap a result to add it immediately, "Concluído" to return). Both are full-screen conditional renders inside `ShoppingListScreen` driven by `subView` state, NOT `<Modal>` (ScrollView-in-Modal Android bug).
- **Calculadora**: `ShoppingListScreen` renders `Total: R$ x,xx` (plain text, `colors.textPrimary`, at the end of the item list) whenever a *checked* item has a price. Sum is over **checked items only**. If any checked item has no price, a `* Existem itens com preço não informado.` line shows under it. Missing prices never block completing/reopening items or lists.
- **No archiving, no backup**: both were deliberately removed. Lists live only in AsyncStorage on-device. If the user uninstalls the app or loses the device, list data is unrecoverable — this is disclosed in the Terms of Use (`src/content/termsOfService.ts`).

### Animation System
`ListsScreen` uses a one-time-per-session animation pattern:
```ts
let hasPlayedAnimation = false; // module-level — resets when app restarts
```
On first mount: header falls from top (spring), progress bar animates from 100% to real value, greeting slides from right. On subsequent mounts in the same session: values are set immediately without animation.

**DEV RESET button**: `ListsScreen` exposes a `RESET` button in the header (top-right, opposite side from the hamburger) that re-triggers the animation sequence. Only rendered inside `{__DEV__ && ...}`.

### Dev tools (`src/dev/`, `__DEV__` only — never in release)
Settings → Sobre shows two extra buttons inside `{__DEV__ && ...}` ("🐞 Log" / "👥 Fake user"). They open `DevPanel` (`src/dev/DevPanel.tsx`), a full-screen conditional render (not `<Modal>`) driven by `showDev` state in `SettingsScreen`. `DevPanel` is loaded via a **conditional `require`** (`__DEV__ ? require('../dev/DevPanel').default : null`) so Metro drops it from release bundles.
- **devLog** (`src/dev/devLog.ts`): ring buffer (5000 lines) persisted to `@suplista_devlog`, plus a `console.warn`/`console.error` hook. `initDevLog()` is called once from `App.tsx` `init()`; `logEvent(tag, msg, data?)` is a no-op outside `__DEV__` and is sprinkled through `App.tsx` handlers (`handleSaveList`/`handleUpdateList`/`handleDeleteList`/`recordItems`/`syncSharedList`/listeners/nav). Log tab: copy last 1000 lines / share / clear.
- **fakeData** (`src/dev/fakeData.ts` + `pools.ts`): `generateFakeData({seed})` builds ~280 lists / ~4300 items (1 list of 1000, ~9 lists >100, rest ≤10), preset + custom tags, both types, no sharing. Deterministic per seed. Returns `{ lists, catalog, report }`; the report is a plain-text summary shown in DevPanel (copy / share). "Limpar tudo" wipes `@suplista_lists` + `@suplista_item_catalog` (keeps settings/onboarding). After Fake user / Limpar tudo, `DevSettings.reload()` restarts the JS.

**Swipe animation rule**: After a card flies off (PanResponder dx > 80 or < -80), reset `translateX` via `Animated.timing(translateX, {toValue: 0, duration: 100})` — never via `translateX.setValue(0)`. The `setValue` call can be lost in transit when `useNativeDriver: true` is active, causing the card to stay invisible on its next render.

### Card Ordering (stable)
Cards in `ListsScreen` render all lists (open + concluded) in a single unified list without reordering when a list is concluded. Conclusion state is communicated by visual style (opacity, strikethrough) — the card does not "jump" to another section.

### UI / Styling
All colors and reusable styles are in `src/styles/theme.ts` (`colors` object + `globalStyles` StyleSheet). Theme is managed via `ThemeContext` — always use `colors.*` and `globalStyles.*` from `useTheme()`, never hardcode color values.

**Dark/light mode**: three options (`claro` / `escuro` / `auto`, auto follows system) — same as before.

**Accent color** (new): independent of dark/light mode. Four presets in `ACCENT_PRESETS` (`src/styles/theme.ts`): `roxo` (purple, default), `vermelho` (terracotta), `azul` (slate blue), `verde` (aqua green). Each preset has a `dark` and `light` variant (primary/primaryLight) for contrast. `applyAccent(base, accent, isDark)` merges the accent's primary/primaryLight on top of the resolved dark/light base palette in `ThemeContext`. Persisted as `AppSettings.accentColor`. Picker UI lives inside the "Tema" card in Settings > Preferências (`SettingsScreen.tsx`), 4 circular swatches with a checkmark on the selected one.

**Header consistency rule:** `globalStyles.header` normally only contains `headerTitle` + `headerSubtitle`. The hamburger button (see above) and the `__DEV__`-only RESET button are the only sanctioned exceptions, both absolutely positioned so they don't disturb the centered title/subtitle layout.

**Card pattern:** List cards are non-expandable single-line rows. Tap → opens list detail (`ShoppingListScreen`). Swipe right → complete/reopen. Swipe left → delete.

**List detail action row:** exactly 4 buttons in a single row (`actionBarRow`/`actionBarBtn` styles), positioned right below the progress bar and above the item list: Anotações | Compartilhar (or Sair if `isSharedWithMe`) | Excluir | Concluir/Reabrir. There is no Editar or Arquivar button — renaming a list is done by tapping its title in the header (`handleStartEditName`), and archiving doesn't exist. Only "Adicionar Item" stays fixed at the bottom. The list header subtitle shows only `Compras • 3/10` — no running total there; the total lives at the end of the item list (see "Calculadora" under Key Flows).

**Item price display:** an item with a price shows `R$ x.xx` (green, `priceText`); tapping it opens the edit modal. An item without a price shows nothing (no "add price" button — that was removed; price is edited via `AddItemModal`).

**Anotações** (short text) uses the small centered `modalOverlay`/`modalContent` card with a `TextInput` — fine, since a `TextInput` scrolls its own content natively.

**Termos de Uso (and anything else with a long scrollable document)** is rendered as a **plain conditional full-screen view inside the normal component tree** (see `SettingsScreen.tsx`'s `subScreen === 'sobre' && showTerms` branch) — header + `ScrollView(flex:1)` + fixed bottom button — **not** wrapped in RN's `<Modal>`. A `ScrollView` inside `<Modal>` has a known Android bug where it renders full-screen but does not respond to scroll/swipe gestures at all (confirmed by hand: `presentationStyle="fullScreen"` + `ScrollView` inside `<Modal>` displayed correctly but never scrolled on a real Android device). If a screen needs both "full-screen" and "scrollable", make it a real screen/conditional render, not a `Modal`. This also means the small `modalOverlay`/`modalContent` card pattern's tap-outside-to-close trick (nesting a `TouchableOpacity` inside another) should stay reserved for short, non-scrolling forms only.

### Forms / Modals
`CreateListForm` and `AddItemModal` are defined inside `src/components/ShoppingList.tsx` and use the small centered `modalOverlay`/`modalContent` pattern from `globalStyles` (`AddItemModal`'s card content is wrapped in a bounded `ScrollView` since the price field + tool buttons made it taller). The old `AddPriceModal` was removed — price is now a field inside `AddItemModal`. `InheritItemsView` and `SearchItemsView` (same file) are full-screen conditional renders, not modals.

**Android back button rule:** Every full-screen `Modal` must include `onRequestClose={onClose}`. Without this prop, the Android hardware back button does not fire inside Modals.

### TagPicker (`src/components/TagPicker.tsx`)
Used by `CreateListForm`. Renders 7 preset tag chips + 1 "Personalizar" chip in a 4×2 grid, always followed by a custom text input. See inline comments in the component for the sentinel/sync-guard details — behavior is unchanged from before the fork.

### Persistence
AsyncStorage keys: `@suplista_lists` (lists), `@suplista_settings` (settings), `@suplista_item_catalog` (item history for "Pesquisar meus itens"), `@suplista_devlog` (dev log, `__DEV__` only). All reads/writes go through `src/utils/storage.ts` (except the dev log — `src/dev/devLog.ts`).

### Tests
`npm test` (jest, `preset: react-native`). `jest.setup.js` mocks the native modules the app loads at boot (AsyncStorage, `@react-native-firebase/auth`+`firestore`, Google Sign-In, Clipboard, SVG) — without it, importing `App.tsx` in a suite throws `NativeModule … is null`. Pure logic lives in testable utils (`priceUtils`, `dateUtils`, `schemaUtils`, `storage`, `src/dev/*`); `__tests__/App.test.tsx` is a full-tree smoke test. `testTimeout` is 30s because the first (uncached) transform of the whole tree for `App.test` can exceed jest's 5s default.

### Internationalization (i18n)
All user-visible strings **must** use the translation system. Never hardcode visible text.
```ts
const { t } = useLanguage();
// ✅ Correct
<Text>{t.common.save}</Text>
// ❌ Wrong
<Text>Salvar</Text>
```
The dictionary lives in `src/contexts/LanguageContext.tsx` (pt/en/es). When adding new strings: add to all three languages simultaneously. The file still has some dead/unused keys accumulated from the fork — don't treat their presence as evidence a feature is wired up; grep for `t.<namespace>.<key>` usage before relying on one.

### Firestore / Sharing Architecture
Real-time sharing uses Firebase Firestore. The Firebase project is `supApps` (Contest Software's umbrella project, also holds `supAgenda`); this app is registered there under package `com.contestsoftware.suplista`. Anonymous auth is intentionally NOT enabled — sharing requires Google sign-in. Security rules are in `firestore.rules`. Collections actually used by this app:
- `users/{uid}` — user profile (displayName)
- `shares/{id}` — bidirectional connections between users
- `shareRequests/{id}` — pending connection requests
- `invites/{code}` — one-time invite codes (8 chars, single-use)
- `sharedLists/{ownerUid}_{listId}` — shared list documents

`sharedEvents/*` and `backups/*` do not exist in this app's code path (both were part of the original TaskFlow app and were stripped along with events/rotinas/backup).

**Sharing permission model:**
- A user can have multiple partners. Each list has a single `sharedWithUid` (one person at a time).
- The receiver is a **collaborator**: full edit rights, but cannot delete.
- Only the **owner** can delete a list or end sharing. Deleting a list also deletes its Firestore shared doc.
- The **receiver** can exit sharing via the Sair button, which nullifies `sharedWithUid` and removes the list from local state immediately.

**Critical rule:** When processing Firestore snapshots, always process the snapshot data directly — never make additional queries inside a snapshot callback.

**Sync write path:** `handleUpdateList` calls `syncSharedList(list)` on every edit, but it's **debounced per list id (~700ms)** — checking many items / typing notes coalesces into one Firestore write. The timer reads the *live* list from `listsRef` when it fires, so it always pushes current state and self-cancels if the list was unshared or deleted meanwhile (`cancelPendingSync` on delete). Writes go through `toSharedDoc(list)` (`src/utils/firestore.ts`) — an explicit whitelist that keeps local-only fields (`isSharedWithMe`) and any `undefined` out of the shared doc; `ownerUid` always comes from the caller's argument.

### ID Generation
List and item IDs come from `nextId()` (`src/utils/id.ts`) — a millisecond timestamp that's forced strictly increasing, so two entities created in the same ms (create list + add item, inherit several items, fast taps) never collide within a session, and a new session's `Date.now()` is always above the previous session's IDs. Never use bare `Date.now()` for an id. `migrateListSchema` repairs a missing/non-numeric id on load (derives from `createdAt` when possible, else `nextId()`). IDs are still not unique across users — don't rely on that in shared scenarios. The fake-data generator (`src/dev/fakeData.ts`) keeps its own decreasing-counter scheme for determinism.

### Schema Safety
Fields may be `undefined` on data loaded from older versions of the app. Always use nullish coalescing. `migrateListSchema` in `src/utils/schemaUtils.ts` is called automatically in `loadLists()` at startup.

### Google Sign-In / Auth (`src/contexts/FirebaseContext.tsx`)
Firebase Auth supports two modes:
- **Anonymous** — created automatically on first launch; used for sharing without a Google account.
- **Google** — user signs in via Google to link identity; `isGoogleConnected = user !== null && !user.isAnonymous`.

`signInWithGoogle()` uses `@react-native-google-signin/google-signin` v13 API. `webClientId` in `FirebaseContext.tsx` is the project's shared OAuth web client — the Android app's own SHA-1 must be registered in Firebase for sign-in to work (see debug keystore SHA-1 via `cd android && ./gradlew signingReport`).

### No backup, no notifications, no water tracking, no events/rotinas
These all existed in the original TaskFlow app and were removed entirely in this fork, along with their dependencies (`react-native-fs`, `@notifee/react-native`). Don't re-introduce partial versions of these without an explicit product decision; the data model, storage layer, and Settings screen were all deliberately simplified to match.

### Onboarding (`src/screens/OnboardingScreen.tsx`)
4-step flow: language/theme → google → (manual_profile | sharing) → terms. No backup or water steps. `manual_profile` still collects a `birthDate` and writes it to storage, but nothing in the app displays or edits it after onboarding (the Settings > Perfil birthdate field was removed) — it's currently write-only, orphaned data pending a product decision on whether to drop it from onboarding too.
