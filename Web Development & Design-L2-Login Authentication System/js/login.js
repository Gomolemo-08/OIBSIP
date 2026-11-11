(function () {
  'use strict';

  if (Auth.getSession()) { location.replace('dashboard.html'); return; }

  const form = document.getElementById('login-form');
  const identifier = document.getElementById('identifier');
  const password = document.getElementById('password');
  const alertBox = document.getElementById('form-alert');
  const button = document.getElementById('submit-btn');

  UI.initPasswordToggles();

  if (new URLSearchParams(location.search).get('registered') === '1') {
    document.getElementById('notice').hidden = false;
  }

  if (!Auth.supported()) {
    UI.showAlert(alertBox, 'This browser cannot verify passwords securely here. Open the page in a current browser (Chrome, Edge, Firefox or Safari).');
    button.disabled = true;
  }

  identifier.addEventListener('input', () => UI.clearFieldError(identifier));
  password.addEventListener('input', () => UI.clearFieldError(password));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    UI.showAlert(alertBox, '');

    // No empty submissions
    const idEmpty = !identifier.value.trim();
    const pwEmpty = !password.value;
    UI.setFieldError(identifier, idEmpty ? 'Enter your username or email.' : '');
    UI.setFieldError(password, pwEmpty ? 'Enter your password.' : '');
    if (idEmpty) { identifier.focus(); return; }
    if (pwEmpty) { password.focus(); return; }

    button.disabled = true;
    button.textContent = 'Checking…';
    try {
      const result = await Auth.login(identifier.value, password.value);
      if (!result.ok) {
        // One generic message: never say whether the username or the password was wrong
        UI.showAlert(alertBox, result.error);
        password.value = '';
        password.focus();
        return;
      }
      location.replace('dashboard.html');
    } catch (err) {
      UI.showAlert(alertBox, 'Something went wrong while logging in. Please try again.');
    } finally {
      button.disabled = false;
      button.textContent = 'Login';
    }
  });
})();
