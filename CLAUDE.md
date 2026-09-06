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

**Windows note:** `npm run android` / `react-native run-android` can fail on Windows with `'gradlew.bat' não é reconhecido...` (a Node.js `spawn` regression with `.bat` files). Workaround: run Metro (`npm start`) in one terminal, then from `android/`, run `.\gradlew.bat app:installDebug -PreactNativeDevServerPort=8081` directly in PowerShell, then launch the app via `adb shell am start -n com.suplist.list/com.suplist.list.MainActivity`. If the device shows "Could not connect to development server", run `adb reverse tcp:8081 tcp:8081`.

iOS only: install CocoaPods before first run or after native dep changes:
```bash
bundle install
bundle exec pod install
```

## Architecture

**supList** is a React Native shopping/task list app (Android/iOS), forked from a larger productivity app (TaskFlow) and stripped down to just the lists feature. Package id `com.suplist.list`. All app logic lives in `App.tsx` and `src/`.

### State Management
There is no external state library. `App.tsx` is the single source of truth — it holds the full `lists` array in `useState` and passes it down as props. All mutations go through handlers defined in `App.tsx`, which call `saveLists` from `src/utils/storage.ts` to persist to AsyncStorage after every change.

### Data Model (`src/types/index.ts`)
- **`ShoppingList`** — the only content entity. Supports both shopping (`type: 'compras'`) and task (`type: 'tarefas'`) lists. `isArchived` exists on the type but nothing in the app currently sets it to `true` (the old archive flow was removed) — it's effectively always `false`; don't build new features assuming lists can be archived without first wiring an entry point. `notes?: string` is free-text (plain string).
- **`ListItem`** — quantity, unit, checked state, optional price (`priceType: 'unit' | 'total'`).

### Screens (`src/screens/`)
Navigation is manual — `App.tsx` maintains `activeScreen: ScreenName` (`'listas' | 'config'`) and renders the matching screen. There is no navigation library and **no bottom tab bar** — this app has one primary screen (Listas), so navigation to Settings is a single hamburger button (see below).

**Settings sub-screens** (`SettingsScreen.tsx`): `subScreen` state drives an internal stack (`null | 'perfil' | 'preferencias' | 'compartilhamento' | 'sobre'`). `null` shows the main menu. Each sub-screen has its own `BackHandler` that pops back to `null`.

### Hamburger navigation (persistent, every screen)
A 3-white-bar hamburger button (`menuBtn`/`menuBtnBar` styles, positioned `absolute` top-right of the header, aligned to `HEADER_TOP_PADDING` from `src/styles/theme.ts`) appears on **every** screen: `ListsScreen` root, the list detail view (`ShoppingListScreen` in `ShoppingList.tsx`), and all 4 Settings sub-screens. It is wired to a single toggle in `App.tsx`:
- From any Listas-side screen it calls `openSettings()` (pushes current screen onto `screenHistory`, switches to `'config'`).
- From any Settings-side screen it calls `closeSettings()` (pops `screenHistory`, or falls back to `'listas'`).

Both `ListsScreen` and `ShoppingListScreen` receive the same `onOpenSettings` callback (threaded through as a prop); `SettingsScreen` receives `onGoHome`. When adding a new screen, wire its header the same way rather than introducing a different navigation affordance — this is the one deliberate exception to the "header stays plain" convention that most screens follow.

### Key Flows
- **Startup**: `init()` in `App.tsx` loads settings + lists (no auto-migration or cleanup runs — there is no auto-delete-after-completion policy in this app; deleting a list is always a manual, final user action).
- **Completing a list**: `handleUpdateList` in `App.tsx` stamps `completedAt` when `isCompleted` flips true→false or false→true (cleared on reopen).
- **No archiving, no backup**: both were deliberately removed. Lists live only in AsyncStorage on-device. If the user uninstalls the app or loses the device, list data is unrecoverable — this is disclosed in the Terms of Use (`src/content/termsOfService.ts`).

### Animation System
`ListsScreen` uses a one-time-per-session animation pattern:
```ts
let hasPlayedAnimation = false; // module-level — resets when app restarts
```
On first mount: header falls from top (spring), progress bar animates from 100% to real value, greeting slides from right. On subsequent mounts in the same session: values are set immediately without animation.

**DEV RESET button**: `ListsScreen` exposes a `RESET` button in the header (top-right, opposite side from the hamburger) that re-triggers the animation sequence. Only rendered inside `{__DEV__ && ...}`.

**Swipe animation rule**: After a card flies off (PanResponder dx > 80 or < -80), reset `translateX` via `Animated.timing(translateX, {toValue: 0, duration: 100})` — never via `translateX.setValue(0)`. The `setValue` call can be lost in transit when `useNativeDriver: true` is active, causing the card to stay invisible on its next render.

### Card Ordering (stable)
Cards in `ListsScreen` render all lists (open + concluded) in a single unified list without reordering when a list is concluded. Conclusion state is communicated by visual style (opacity, strikethrough) — the card does not "jump" to another section.

### UI / Styling
All colors and reusable styles are in `src/styles/theme.ts` (`colors` object + `globalStyles` StyleSheet). Theme is managed via `ThemeContext` — always use `colors.*` and `globalStyles.*` from `useTheme()`, never hardcode color values.

**Dark/light mode**: three options (`claro` / `escuro` / `auto`, auto follows system) — same as before.

**Accent color** (new): independent of dark/light mode. Four presets in `ACCENT_PRESETS` (`src/styles/theme.ts`): `roxo` (purple, default), `vermelho` (terracotta), `azul` (slate blue), `verde` (aqua green). Each preset has a `dark` and `light` variant (primary/primaryLight) for contrast. `applyAccent(base, accent, isDark)` merges the accent's primary/primaryLight on top of the resolved dark/light base palette in `ThemeContext`. Persisted as `AppSettings.accentColor`. Picker UI lives inside the "Tema" card in Settings > Preferências (`SettingsScreen.tsx`), 4 circular swatches with a checkmark on the selected one.

**Header consistency rule:** `globalStyles.header` normally only contains `headerTitle` + `headerSubtitle`. The hamburger button (see above) and the `__DEV__`-only RESET button are the only sanctioned exceptions, both absolutely positioned so they don't disturb the centered title/subtitle layout.

**Card pattern:** List cards are non-expandable single-line rows. Tap → opens list detail (`ShoppingListScreen`). Swipe right → complete/reopen. Swipe left → delete.

**List detail action row:** exactly 4 buttons in a single row (`actionBarRow`/`actionBarBtn` styles), positioned right below the progress bar and above the item list: Anotações | Compartilhar (or Sair if `isSharedWithMe`) | Excluir | Concluir/Reabrir. There is no Editar or Arquivar button — renaming a list is done by tapping its title in the header (`handleStartEditName`), and archiving doesn't exist. Only "Adicionar Item" stays fixed at the bottom.

**Modals that need to be readable/scrollable** (Anotações, Termos de Uso) use a **full-screen** `Modal` (`presentationStyle="fullScreen"`) with a normal header + `ScrollView(flex:1)` + fixed bottom purple button — not the small centered `modalOverlay`/`modalContent` card. That small-card pattern (still used by `AddItemModal`/`AddPriceModal`) is only for short forms; nesting a `ScrollView` inside the tap-outside-to-close `TouchableOpacity` trick breaks scrolling, so don't reuse it for anything with more than a few lines of content.

### Forms / Modals
`CreateListForm`, `AddItemModal`, `AddPriceModal` are all defined inside `src/components/ShoppingList.tsx` and use the small centered `modalOverlay`/`modalContent` pattern from `globalStyles`.

**Android back button rule:** Every full-screen `Modal` must include `onRequestClose={onClose}`. Without this prop, the Android hardware back button does not fire inside Modals.

### TagPicker (`src/components/TagPicker.tsx`)
Used by `CreateListForm`. Renders 7 preset tag chips + 1 "Personalizar" chip in a 4×2 grid, always followed by a custom text input. See inline comments in the component for the sentinel/sync-guard details — behavior is unchanged from before the fork.

### Persistence
AsyncStorage keys: `@suplist_lists` (lists), `@suplist_settings` (settings). Both are namespaced separately from the original TaskFlow app's keys (`@taskflow_*`) so the two apps can coexist on the same device without clobbering each other's data. All reads/writes go through `src/utils/storage.ts`.

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
Real-time sharing uses Firebase Firestore, same Firebase project as the original TaskFlow app (separate registered app, package `com.suplist.list`). Security rules are in `firestore.rules`. Collections actually used by this app:
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

### ID Generation
IDs use `Date.now()` (timestamp in ms). Risk: collision if two items are created within the same millisecond. Do not rely on IDs being unique across users in shared scenarios.

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
