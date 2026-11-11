# To-Do Web App

A vanilla HTML/CSS/JavaScript task manager. No build step, no dependencies.

## Run it
Open `index.html` in any modern browser. (Fonts load from Google Fonts when online; the app falls back to system fonts offline.)

## Features
- Add tasks with the input + "Add Task" button (Enter works too; blank tasks are rejected)
- New tasks appear immediately in Pending Tasks
- Tick the checkbox to move a task to Completed Tasks (untick to move it back)
- Edit inline (Enter or Save to confirm, Esc or Cancel to discard)
- Delete permanently from either list
- Live counts: "X pending" and "Y completed"
- Timestamps for when a task was added and completed
- Tasks persist in localStorage across refreshes
- Friendly empty-state messages for both lists

## Files
- `index.html` – page structure
- `style.css` – layout and theme (responsive, visible keyboard focus, reduced-motion support)
- `script.js` – state array -> `render()` pattern; user text is inserted with `textContent`
