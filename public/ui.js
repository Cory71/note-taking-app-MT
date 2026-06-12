// Section: Global UI helpers for theme behavior
(() => {
  const THEME_STORAGE_KEY = 'theme';

  // Section: Theme helpers
  function getSavedTheme() {
    return localStorage.getItem(THEME_STORAGE_KEY); // Read saved user preference.
  }

  // Section: Read the operating system's dark-mode setting.
  function systemPrefersDark() {
    return (
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  }

  function shouldUseDarkTheme() {
    const savedTheme = getSavedTheme();

    if (savedTheme === 'dark') {
      return true;
    }

    if (savedTheme === 'light') {
      return false;
    }

    return systemPrefersDark(); // No saved choice: follow the operating system.
  }

  // Section: Add or remove the dark-mode class on the page body.
  function applyTheme(isDark) {
    document.body.classList.toggle('dark', isDark);

    const toggle = document.getElementById('themeToggle');

    if (toggle) {
      toggle.checked = isDark; // Keep switch UI in sync with current theme.
    }
  }

  // Section: Save the user's theme choice so it is remembered after refresh.
  function saveTheme(isDark) {
    localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
  }

  // Section: Update the theme when the OS setting changes,
  // unless the user has made a manual choice (that always wins).
  function watchSystemTheme() {
    if (typeof window.matchMedia !== 'function') {
      return;
    }

    const query = window.matchMedia('(prefers-color-scheme: dark)');

    query.addEventListener('change', (event) => {
      if (getSavedTheme()) {
        return; // A saved manual preference overrides the system setting.
      }

      applyTheme(event.matches); // Follow the new OS setting live.
    });
  }

  // Section: Setup
  function setupThemeToggle() {
    applyTheme(shouldUseDarkTheme()); // Apply saved theme when page first loads.

    const toggle = document.getElementById('themeToggle');

    if (!toggle) {
      return; // Some pages may not render the toggle.
    }

    toggle.addEventListener('change', (event) => {
      const isDark = !!event.target.checked; // Checkbox true means dark mode on.
      applyTheme(isDark);
      saveTheme(isDark);
    });
  }

  setupThemeToggle();
  watchSystemTheme();
})();
