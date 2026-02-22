// Section: Global UI helpers for theme behavior
(() => {
  const THEME_STORAGE_KEY = 'theme';

  // Section: Theme helpers
  function getSavedTheme() {
    return localStorage.getItem(THEME_STORAGE_KEY); // Read saved user preference.
  }

  function shouldUseDarkTheme() {
    const savedTheme = getSavedTheme();

    if (savedTheme === 'dark') {
      return true;
    }

    if (savedTheme === 'light') {
      return false;
    }

    return false; // Default theme is light.
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
})();
