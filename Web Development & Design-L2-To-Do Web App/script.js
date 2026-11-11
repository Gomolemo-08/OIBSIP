(() => {
  'use strict';

  const STORAGE_KEY = 'todo-app.tasks.v1';

  // ---------- State ----------
  // Each task: { id, text, completed, createdAt, completedAt }
  let tasks = loadTasks();
  let editingId = null;      // id of the task currently being edited inline
  let movedId = null;        // id of the task that just changed list (for a brief highlight)

  // ---------- Elements ----------
  const form = document.getElementById('add-form');
  const input = document.getElementById('task-input');
  const formError = document.getElementById('form-error');
  const pendingList = document.getElementById('pending-list');
  const completedList = document.getElementById('completed-list');
  const pendingCount = document.getElementById('pending-count');
  const completedCount = document.getElementById('completed-count');
  document.getElementById('today-date').textContent =
    new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' });

  // ---------- Persistence (localStorage) ----------
  function loadTasks() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(saved) ? saved : [];
    } catch (err) {
      return []; // corrupted data or storage blocked: start fresh
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (err) {
      /* storage full or blocked: app still works for this session */
    }
  }

  // ---------- Helpers ----------
  const stampFormat = new Intl.DateTimeFormat('en-ZA', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  });
  const formatStamp = (ms) => stampFormat.format(new Date(ms));

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text; // textContent keeps user text safe from HTML injection
    return node;
  }

  function showError(message) {
    formError.textContent = message;
    formError.hidden = !message;
  }

  // ---------- Actions ----------
  function addTask(text) {
    tasks.unshift({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      text,
      completed: false,
      createdAt: Date.now(),
      completedAt: null
    });
    saveTasks();
    render();
  }

  function toggleTask(id) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    task.completed = !task.completed;
    task.completedAt = task.completed ? Date.now() : null;
    movedId = id;
    saveTasks();
    render();
  }

  function deleteTask(id) {
    tasks = tasks.filter((t) => t.id !== id);
    if (editingId === id) editingId = null;
    saveTasks();
    render();
  }

  function saveEdit(id, newText) {
    const text = newText.trim();
    const task = tasks.find((t) => t.id === id);
    if (task && text) task.text = text; // an empty edit keeps the old text
    editingId = null;
    saveTasks();
    render();
  }

  // ---------- Rendering ----------
  function buildTask(task) {
    const li = el('li', 'task' + (task.completed ? ' done' : ''));
    if (task.id === movedId) li.classList.add('just-moved');

    const check = el('input', 'check');
    check.type = 'checkbox';
    check.checked = task.completed;
    check.setAttribute('aria-label', task.completed ? 'Mark as pending' : 'Mark complete');
    check.addEventListener('change', () => toggleTask(task.id));
    li.appendChild(check);

    if (editingId === task.id) {
      const editInput = el('input', 'edit-input');
      editInput.type = 'text';
      editInput.value = task.text;
      editInput.maxLength = 200;
      editInput.setAttribute('aria-label', 'Edit task text');
      editInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveEdit(task.id, editInput.value);
        if (e.key === 'Escape') { editingId = null; render(); }
      });
      li.appendChild(editInput);

      const actions = el('div', 'actions');
      const save = el('button', 'btn btn-save', 'Save');
      save.type = 'button';
      save.addEventListener('click', () => saveEdit(task.id, editInput.value));
      const cancel = el('button', 'btn', 'Cancel');
      cancel.type = 'button';
      cancel.addEventListener('click', () => { editingId = null; render(); });
      actions.append(save, cancel);
      li.appendChild(actions);
      return li;
    }

    li.appendChild(el('p', 'task-text', task.text));

    const stamp = task.completed
      ? `Added ${formatStamp(task.createdAt)} · Completed ${formatStamp(task.completedAt)}`
      : `Added ${formatStamp(task.createdAt)}`;
    li.appendChild(el('p', 'stamps', stamp));

    const actions = el('div', 'actions');
    const edit = el('button', 'btn', 'Edit');
    edit.type = 'button';
    edit.addEventListener('click', () => { editingId = task.id; render(); });
    const del = el('button', 'btn btn-danger', 'Delete');
    del.type = 'button';
    del.addEventListener('click', () => deleteTask(task.id));
    actions.append(edit, del);
    li.appendChild(actions);
    return li;
  }

  function buildEmpty(title, hint) {
    const li = el('li', 'empty');
    li.append(el('strong', '', title), document.createTextNode(hint));
    return li;
  }

  function render() {
    const pending = tasks.filter((t) => !t.completed);
    const done = tasks
      .filter((t) => t.completed)
      .sort((a, b) => b.completedAt - a.completedAt);

    pendingList.replaceChildren(
      ...(pending.length
        ? pending.map(buildTask)
        : [buildEmpty('Nothing pending', 'Add a task above to get started.')])
    );
    completedList.replaceChildren(
      ...(done.length
        ? done.map(buildTask)
        : [buildEmpty('Nothing completed yet', 'Tick a task when it is done and it will show up here.')])
    );

    pendingCount.textContent = `${pending.length} pending`;
    completedCount.textContent = `${done.length} completed`;

    movedId = null;

    const active = document.querySelector('.edit-input');
    if (active) { active.focus(); active.setSelectionRange(active.value.length, active.value.length); }
  }

  // ---------- Events ----------
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) {
      showError('Type a task before adding it.');
      input.focus();
      return;
    }
    showError('');
    addTask(text);
    input.value = '';
    input.focus();
  });

  input.addEventListener('input', () => showError(''));

  render();
})();
