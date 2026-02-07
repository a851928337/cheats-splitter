export function setupThemeToggle({ buttonEl, rootEl = document.body }) {
  function apply(isDark) {
    rootEl.setAttribute('data-theme', isDark ? 'dark' : 'light');
    buttonEl.textContent = isDark ? '🌑' : '🔆';
  }

  apply(rootEl.getAttribute('data-theme') === 'dark');

  buttonEl.addEventListener('click', () => {
    const isDark = rootEl.getAttribute('data-theme') === 'dark';
    apply(!isDark);
  });
}
