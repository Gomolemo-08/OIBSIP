/* guard.js – runs in <head> of protected pages, before anything is displayed */
(function () {
  'use strict';
  if (!Auth.getSession()) {
    location.replace('login.html'); // replace() keeps the protected URL out of the Back button history
  }
})();
