(function () {
  'use strict';

  // Already signed in? Skip straight to the dashboard.
  if (Auth.getSession()) { location.replace('dashboard.html'); return; }

  const form = document.getElementById('register-form');
  const identifier = document.getElementById('identifier');
  const password = document.getElementById('password');
  const confirm = document.getElementById('confirm');
  const alertBox = document.getElementById('form-alert');
  const button = document.getElementById('submit-btn');

  UI.initPasswordToggles();

  if (!Auth.supported()) {
    UI.showAlert(alertBox, 'This browser cannot hash passwords securely here. Open the page in a current browser (Chrome, Edge, Firefox or Safari).');
    button.disabled = true;
  }

  // Live checklist for the password rules
  password.addEventListener('input', () => {
    const met = Auth.passwordRules(password.value);
    document.querySelectorAll('#password-rules li').forEach((li) => {
      li.classList.toggle('met', met[li.dataset.rule]);
    });
    UI.clearFieldError(password);
  });
  identifier.addEventListener('input', () => UI.clearFieldError(identifier));
  confirm.addEventListener('input', () => UI.clearFieldError(confirm));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    UI.showAlert(alertBox, '');

    // Client-side checks first: no empty or invalid submissions
    const idError = Auth.validateIdentifier(identifier.value);
    const pwError = Auth.validatePassword(password.value);
    const confirmError = password.value !== confirm.value ? 'Passwords do not match.' : '';
    UI.setFieldError(identifier, idError);
    UI.setFieldError(password, pwError);
    UI.setFieldError(confirm, pwError ? '' : confirmError);

    const firstBad = [[idError, identifier], [pwError, password], [confirmError, confirm]].find(([err]) => err);
    if (firstBad) { firstBad[1].focus(); return; }

    button.disabled = true;
    button.textContent = 'Creating account…';
    try {
      const result = await Auth.register(identifier.value, password.value);
      if (!result.ok) {
        const target = result.field === 'password' ? password : identifier;
        UI.setFieldError(target, result.error); // includes the duplicate-user error
        target.focus();
        return;
      }
      location.href = 'login.html?registered=1';
    } catch (err) {
      UI.showAlert(alertBox, 'Something went wrong while creating your account. Please try again.');
    } finally {
      button.disabled = false;
      button.textContent = 'Register';
    }
  });
})();
