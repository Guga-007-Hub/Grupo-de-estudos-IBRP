# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Single-page web app (Brazilian Portuguese UI) for managing an IBRP study group: books being studied, study events with chapters/themes, and per-event attendance separating members from visitors. Pure vanilla HTML/CSS/JS with no build system, no dependencies, no tests, no package manager. The entire app is three files at the repo root: [index.html](index.html), [app.js](app.js), [style.css](style.css).

## Running the app

There is no build, lint, or test pipeline. Open `index.html` directly in a browser, or serve the directory with any static server (e.g. VS Code's Live Server) for development. Changes to JS/CSS take effect on page reload.

## Architecture

### State and persistence
A single in-memory `state` object holds `{ books, currentBookId, events }` and is persisted to `localStorage` under the key `grupo_estudo_v1` ([app.js:153](app.js#L153)). `load()` validates shape on read and falls back to an empty base; `save(state)` rewrites the entire blob. Mutations follow a strict pattern: mutate `state` → `save(state)` → call a render function. There is no diffing or reactive layer — re-renders rebuild the affected `<ul>` from scratch and re-attach event listeners.

### Domain model
- **Book**: `{ id, name }`. `currentBookId` selects which book new events get attached to.
- **Event**: `{ id, bookId, date, chaptersText, themes, attendance[] }`. Always belongs to a book; orphaned events are deleted when their book is removed.
- **Attendance entry**: `{ id, name, isVisitor }`. The `isVisitor` boolean is the basis for the members-vs-visitors split shown in book stats ([attendanceStatsByBookSeparated](app.js#L198)).

IDs are generated client-side via `Date.now() + random suffix` ([app.js:184](app.js#L184)).

### UI subsystems
- **Toast** ([app.js:2](app.js#L2)) — non-blocking notifications. Use `Toast.success/error/warning/info(message)` for all user feedback; do not use `alert()`.
- **Modal** ([app.js:78](app.js#L78)) — promise-based confirmation dialog. Use `await Modal.confirm(title, message, { danger, confirmText })` for any destructive action; do not use `confirm()`.
- **Edit mode**: a single module-level `editingEventId` flag drives whether the event form creates or updates. `startEdit(eventId)` populates the form and switches the submit button label; `cancelEdit()` resets it. Removing a book or event that is currently being edited must call `cancelEdit()` to clear the dangling reference (see existing call sites in `renderBooks` and `renderEvents`).

### Backup format
Export/import round-trips the full `state` shape as JSON. `isValidBackup(obj)` ([app.js:699](app.js#L699)) is a strict structural validator — any new top-level field, event field, or attendance field must be added there or imports will reject otherwise-valid files. Importing replaces all data after a confirm modal.

## Conventions

- All user-facing strings are Brazilian Portuguese — keep new strings consistent in language and tone (informal "você").
- Render functions own their own event-listener wiring after `innerHTML =` (re-bind on every render). Don't add long-lived listeners to elements inside the rendered lists.
- Inline SVG icons are used throughout instead of an icon font; copy the existing `viewBox="0 0 24 24"` stroke pattern when adding icons.
- CSS is organized as a design-system token block at the top of [style.css](style.css) (CSS variables for colors, spacing, etc.) followed by component classes. Card sections are flex columns with `gap: var(--spacing-lg)` for uniform vertical spacing — don't add ad-hoc margins between siblings inside a card; reuse the gap. Prefer existing `.btn` / `.card` / `.list-item` / `.badge-*` classes over bespoke styles. All button variants currently share the same neutral gray look — destructive actions rely on the confirm modal, not color, to signal risk.
