/*
 * auth.js – shared authentication logic (front-end only, localStorage).
 *
 * Passwords are never stored. For each user we keep a random salt and a
 * PBKDF2-SHA-256 hash (Web Crypto API). The "session" is a small record in
 * sessionStorage, which the browser clears when the tab is closed.
 *
 * LEARNING DEMO: all of this runs in the browser, so anyone can open dev tools
 * and edit storage. Real systems check credentials on a server.
 */
(function () {
  'use strict';

  const USERS_KEY = 'authDemo.users';
  const SESSION_KEY = 'authDemo.session';
  const ITERATIONS = 150000;

  const GENERIC_LOGIN_ERROR = 'Incorrect username/email or password.';

  // ---------- small helpers ----------
  const normalize = (value) => value.trim().toLowerCase();

  function readUsers() {
    try {
      const data = JSON.parse(localStorage.getItem(USERS_KEY));
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }
  const writeUsers = (users) => localStorage.setItem(USERS_KEY, JSON.stringify(users));

  function toBase64(bytes) {
    let binary = '';
    new Uint8Array(bytes).forEach((b) => { binary += String.fromCharCode(b); });
    return btoa(binary);
  }
  function fromBase64(text) {
    return Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
  }

  // ---------- hashing ----------
  async function hashPassword(password, saltBytes, iterations) {
    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt: saltBytes, iterations }, key, 256
    );
    return toBase64(bits);
  }

  // Compare two strings without bailing out at the first difference
  function safeEqual(a, b) {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
  }

  // ---------- validation ----------
  function validateIdentifier(raw) {
    const value = raw.trim();
    if (!value) return 'Enter a username or email.';
    if (value.includes('@')) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Enter a valid email address.';
    }
    return /^[a-zA-Z0-9_.-]{3,30}$/.test(value)
      ? ''
      : 'Usernames are 3–30 characters: letters, numbers, dots, dashes or underscores.';
  }

  const passwordRules = (password) => ({
    length: password.length >= 8,
    number: /\d/.test(password)
  });

  function validatePassword(password) {
    if (!password) return 'Enter a password.';
    const rules = passwordRules(password);
    if (!rules.length) return 'Password must be at least 8 characters.';
    if (!rules.number) return 'Password must include at least 1 number.';
    return '';
  }

  // ---------- registration ----------
  async function register(identifier, password) {
    const idError = validateIdentifier(identifier);
    if (idError) return { ok: false, field: 'identifier', error: idError };
    const pwError = validatePassword(password);
    if (pwError) return { ok: false, field: 'password', error: pwError };

    const users = readUsers();
    const key = normalize(identifier);
    if (users.some((u) => u.key === key)) {
      return { ok: false, field: 'identifier', error: 'An account with that username or email already exists.' };
    }

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const hash = await hashPassword(password, salt, ITERATIONS);
    users.push({
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random(),
      key,                         // lower-cased, used for duplicate checks and lookups
      display: identifier.trim(),  // as the user typed it
      salt: toBase64(salt),
      hash,
      iterations: ITERATIONS,
      createdAt: Date.now()
    });
    writeUsers(users);
    return { ok: true };
  }

  // ---------- login ----------
  async function login(identifier, password) {
    if (!identifier.trim() || !password) {
      return { ok: false, error: 'Enter your username/email and password.' };
    }
    const user = readUsers().find((u) => u.key === normalize(identifier));

    // If the user doesn't exist we still do the same hashing work, so response
    // time doesn't reveal whether the account exists.
    const salt = user ? fromBase64(user.salt) : crypto.getRandomValues(new Uint8Array(16));
    const hash = await hashPassword(password, salt, user ? user.iterations : ITERATIONS);

    if (!user || !safeEqual(hash, user.hash)) {
      return { ok: false, error: GENERIC_LOGIN_ERROR };
    }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id, startedAt: Date.now() }));
    return { ok: true };
  }

  // ---------- session ----------
  // Returns { user, startedAt } or null. A session pointing at a missing user is discarded.
  function getSession() {
    try {
      const session = JSON.parse(sessionStorage.getItem(SESSION_KEY));
      if (!session) return null;
      const user = readUsers().find((u) => u.id === session.userId);
      if (!user) { sessionStorage.removeItem(SESSION_KEY); return null; }
      return { user, startedAt: session.startedAt };
    } catch (e) {
      return null;
    }
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  const supported = () => !!(window.crypto && crypto.subtle);

  window.Auth = {
    register, login, logout, getSession,
    validateIdentifier, validatePassword, passwordRules, supported
  };
})();
