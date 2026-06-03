const API_URL = getApiUrl();

// Очистка старых данных при загрузке страницы логина
function clearOldSession() {
  localStorage.clear();
  sessionStorage.clear();
}

// Валидация телефона
function validatePhone(phone) {
  if (!phone) {
    showNotice('Введите номер телефона', 'error');
    return false;
  }
  
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length < 10 || cleanPhone.length > 11) {
    showNotice('Введите корректный номер телефона (10-11 цифр)', 'error');
    return false;
  }
  
  return true;
}

// Шаг 1: Логин (отправка телефона)
async function login() {
  const phoneInput = document.getElementById('phone');
  const phone = phoneInput.value.trim();
  
  if (!validatePhone(phone)) {
    return;
  }
  
  // Блокируем кнопку на время запроса
  const loginBtn = document.getElementById('login-btn');
  const originalText = loginBtn.innerText;
  loginBtn.innerText = 'Отправка...';
  loginBtn.disabled = true;
  
  try {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    
    const data = await res.json().catch(() => ({}));
    
    if (!res.ok) {
      showNotice(data.error || 'Ошибка входа', 'error');
      loginBtn.innerText = originalText;
      loginBtn.disabled = false;
      return;
    }
    
    // Сохраняем телефон во временное хранилище
    sessionStorage.setItem('verifyPhone', phone);
    
    showNotice('Код подтверждения отправлен', 'success');
    
    // Переходим на страницу подтверждения
    window.location.href = 'verify.html';
    
  } catch (e) {
    console.error('Login error:', e);
    showNotice('Ошибка сервера. Попробуйте позже.', 'error');
    loginBtn.innerText = originalText;
    loginBtn.disabled = false;
  }
}

// Обработчик нажатия Enter в поле телефона
function onPhoneKeyPress(event) {
  if (event.key === 'Enter') {
    login();
  }
}

// Инициализация страницы
function initLoginPage() {
  // Очищаем старые сессии
  clearOldSession();
  
  // Кнопка входа
  const loginBtn = document.getElementById('login-btn');
  if (loginBtn) {
    loginBtn.addEventListener('click', login);
  }
  
  // Кнопка очистки (если есть)
  const clearBtn = document.getElementById('clear-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      const phoneEl = document.getElementById('phone');
      if (phoneEl) phoneEl.value = '';
    });
  }
  
  // Обработчик Enter
  const phoneInput = document.getElementById('phone');
  if (phoneInput) {
    phoneInput.addEventListener('keypress', onPhoneKeyPress);
  }
}

// Запуск
initLoginPage();