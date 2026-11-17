const API_URL = getApiUrl();

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

async function login() {
  const phoneInput = document.getElementById('phone');
  const phone = phoneInput.value.trim();
  
  if (!validatePhone(phone)) {
    return;
  }
  
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
    
    sessionStorage.setItem('verifyPhone', phone);
    
    showNotice('Код подтверждения отправлен', 'success');
    
    window.location.href = 'verify.html';
    
  } catch (e) {
    console.error('Login error:', e);
    showNotice('Ошибка сервера. Попробуйте позже.', 'error');
    loginBtn.innerText = originalText;
    loginBtn.disabled = false;
  }
}

function onPhoneKeyPress(event) {
  if (event.key === 'Enter') {
    login();
  }
}

function initLoginPage() {
  const loginBtn = document.getElementById('login-btn');
  if (loginBtn) {
    loginBtn.addEventListener('click', login);
  }
  
  const phoneInput = document.getElementById('phone');
  if (phoneInput) {
    phoneInput.addEventListener('keypress', onPhoneKeyPress);
  }
}

initLoginPage();
