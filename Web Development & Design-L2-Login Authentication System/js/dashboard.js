(function () {
  'use strict';

  const session = Auth.getSession();
  if (!session) { location.replace('login.html'); return; } // guard.js already redirects; this is a second check

  const fmt = new Intl.DateTimeFormat('en-ZA', { dateStyle: 'long', timeStyle: 'short' });
  document.getElementById('user-name').textContent = session.user.display;   // textContent: no HTML injection
  document.getElementById('user-id').textContent = session.user.display;
  document.getElementById('created').textContent = fmt.format(new Date(session.user.createdAt));
  document.getElementById('started').textContent = fmt.format(new Date(session.startedAt));

  document.getElementById('logout-btn').addEventListener('click', () => {
    Auth.logout();
    location.replace('login.html');
  });

  // Reveal the page only now that the session is confirmed
  document.body.classList.remove('guard');

  // Back/forward cache: re-check if the page is restored after logout
  window.addEventListener('pageshow', (e) => {
    if (e.persisted && !Auth.getSession()) location.replace('login.html');
  });
})();
