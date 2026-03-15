# AGENTS.md - FlashMind Developer Guide

> **Note to Agents:** This document is your primary source of truth for the FlashMind codebase. Read this before proposing changes or generating code.

## 1. Project Overview
**FlashMind** is a Progressive Web App (PWA) for flashcard learning using Spaced Repetition (SR).
- **Core Philosophy:** Offline-first, privacy-focused (local DB), mobile-optimized.
- **Key Feature:** Uses `sql.js` (SQLite) running in the browser, persisted via `localforage` (IndexedDB).

## 2. Technology Stack
- **Framework:** React 19 + Vite 6
- **Language:** TypeScript (~5.8)
- **Styling:** Tailwind CSS (Dark/Light mode compliant)
- **Database:** `sql.js` (WASM SQLite) + `localforage` (Persistence)
- **AI Integration:** `@google/genai` (Gemini) for automatic card generation
- **Icons:** `lucide-react`

## 3. Architecture & Patterns

### 3.1. Routing (Crucial)
**DO NOT** introduce `react-router` or `react-router-dom`.
- The app uses a simple State-Based Routing mechanism in `App.tsx`.
- **Mechanism:** `const [view, setView] = useState<View>(View.HOME);`
- **Navigation:** Pass `setView` or callbacks (e.g., `onClose`, `onSelectDeck`) to child components.

### 3.2. Data Layer (`db.ts`)
- **Pattern:** Singleton Class `DatabaseService` exported as `db`.
- **Integration:** 
  - `sql.js` is loaded via a script tag (CDN) or local wasm file (see `index.html` logic).
  - The entire SQLite DB file is saved as a binary blob (`Uint8Array`) in IndexedDB (via `localforage`) after every write operation (`save()` method).
- **Rules:**
  - Always await `db.init()` before querying (handled in methods usually, but be aware).
  - **Schema Changes:** Must be handled in `init()` via raw SQL `ALTER TABLE` or `CREATE TABLE IF NOT EXISTS` checks. There is no external migration tool.

### 3.3. State Management
- **Global:** `LanguageContext` (Context API) for i18n.
- **Local:** `App.tsx` holds the "Single Source of Truth" for the currently active Deck and View.
- **Data Sync:** Data is re-fetched from `db` when needed (`refreshDecks()`). React State is used to render the UI, but `db` is the master record.

### 3.4. Styling (Tailwind)
- **Dark Mode:** Mandatory support. Use `dark:` variants for all colors.
- **Colors:** Use semantic colors (`text-primary`, `bg-gray-50`) where possible, derived from the Tailwind config.
- **Responsiveness:** Mobile-first approach. Test layouts on small screens.

## 4. Key Systems

### Spaced Repetition Algorithm
- Implementation: `db.reviewCard()`
- Logic: Modified SM-2 Algorithm.
- Intervals: Calculated in days.
- Ratings: 1 (Again), 2 (Hard), 3 (Good), 4 (Easy).

### Internationalization
- Use the `useLanguage` hook.
- Keys are stored in `contexts/LanguageContext`.
- **Rule:** Do not hardcode strings in components. Always use `t('key.path')`.

## 5. Directory Structure
```
/
├── App.tsx             # Main entry point & Router
├── db.ts               # Database Service (SQL logic)
├── types.ts            # Shared TypeScript interfaces (Deck, Card)
├── components/         # UI Components (Functional, stateless where possible)
├── contexts/           # React Contexts (Language, etc.)
├── services/           # Business logic (if separate from db)
└── public/             # Static assets (manifest, sql-wasm.wasm)
```

## 6. Rules for Agents
1.  **Preserve Offline Capability:** Do not add dependencies that require a server for core functionality (except AI features, which naturally require internet).
2.  **No "Prop Drilling" Complaints:** The app is small. Passing props is acceptable. Introduce Context only if strictly necessary.
3.  **Performance:** Be mindful that `save()` writes the *entire* DB to IndexedDB. Avoid calling `save()` inside tight loops; use transactions or batch updates if mass-inserting (e.g., `importDeck`).
4.  **Consistency:** Match the existing UI aesthetic (clean, modern, rounded corners, subtle shadows). 

## 7. Common Tasks

### Adding a New View
1.  Add entry to `enum View` in `App.tsx`.
2.  Add rendering logic in the `App` component return statement.
3.  Add navigation buttons in the Header or Bottom Nav as appropriate.

### Modifying Database Schema
1.  Edit `createTables()` in `db.ts` for new installs.
2.  Add a migration block in `init()` for existing users (e.g., `try { db.run("ALTER TABLE...") } catch { ... }`).
