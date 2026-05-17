function getNoticeEl() {
  let el = document.getElementById('notice');
  if (!el) {
    el = document.createElement('div');
    el.id = 'notice';
    el.className = 'notice notice--hidden';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    document.body.insertBefore(el, document.body.firstChild);
  }
  return el;
}

function showNotice(message, variant = 'info') {
  const el = getNoticeEl();
  el.className = `notice notice--${variant}`;
  el.textContent = message;
  window.clearTimeout(el.__hideTimer);
  el.__hideTimer = window.setTimeout(() => {
    el.className = 'notice notice--hidden';
    el.textContent = '';
  }, 3500);
}

function getApiUrl() {
  return window.APP_CONFIG && window.APP_CONFIG.API_URL
    ? window.APP_CONFIG.API_URL
    : 'http://localhost:3000/api';
}
