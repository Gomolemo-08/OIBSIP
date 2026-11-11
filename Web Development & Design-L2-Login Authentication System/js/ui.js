/* ui.js – tiny helpers shared by the login and register pages */
(function () {
  'use strict';

  window.UI = {
    setFieldError(input, message) {
      const errorEl = document.getElementById(input.id + '-error');
      errorEl.textContent = message;
      errorEl.hidden = !message;
      input.setAttribute('aria-invalid', message ? 'true' : 'false');
    },
    clearFieldError(input) { this.setFieldError(input, ''); },

    showAlert(box, message) {
      box.textContent = message;
      box.hidden = !message;
    },

    // Wire up every "Show/Hide" button next to a password field
    initPasswordToggles() {
      document.querySelectorAll('.toggle').forEach((btn) => {
        btn.addEventListener('click', () => {
          const input = document.getElementById(btn.dataset.target);
          const show = input.type === 'password';
          input.type = show ? 'text' : 'password';
          btn.textContent = show ? 'Hide' : 'Show';
          btn.setAttribute('aria-pressed', String(show));
        });
      });
    }
  };
})();
