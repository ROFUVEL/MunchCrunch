const API_URL = getApiUrl();

let currentPhone = null;

async function loadVerifyPage() {
  // Получаем телефон из sessionStorage (временное хранилище)
  currentPhone = sessionStorage.getItem('verifyPhone');
  
  if (!currentPhone) {
    showNotice('Сессия истекла, войдите заново', 'error');
    window.location.href = 'login.html';
    return;
  }
  
  document.getElementById('phone-display').innerText = currentPhone;
}

async function verifyCode() {
  const code = document.getElementById('code').value;
  
  if (!code || code.length !== 4) {
    showNotice('Введите 4-значный код', 'error');
    return;
  }
  
  // Для курсовой просто проверяем на 1234
  if (code !== '1234') {
    showNotice('Неверный код подтверждения', 'error');
    return;
  }
  
  try {
    const res = await fetch(`${API_URL}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        phone: currentPhone,
        code: code 
      })
    });
    
    const data = await res.json().catch(() => ({}));
    
    if (!res.ok) {
      showNotice(data.error || 'Ошибка подтверждения', 'error');
      return;
    }
    
    // Сохраняем данные пользователя
    localStorage.setItem('userId', data.userId);
    localStorage.setItem('role', data.role);
    localStorage.setItem('userPhone', currentPhone);
    localStorage.setItem('sessionToken', data.token);
    
    // Очищаем временные данные
    sessionStorage.removeItem('verifyPhone');
    
    showNotice('Вход выполнен успешно!', 'success');
    
    // Перенаправляем
    if (data.role === 'staff') {
      window.location.href = 'staff.html';
    } else {
      window.location.href = 'menu.html';
    }
    
  } catch (e) {
    showNotice('Ошибка сервера', 'error');
  }
}

async function resendCode() {
  if (!currentPhone) return;
  
  try {
    const res = await fetch(`${API_URL}/send-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: currentPhone })
    });
    
    if (!res.ok) throw new Error('Ошибка');
    
    showNotice('Код отправлен повторно (1234)', 'success');
  } catch (e) {
    showNotice('Ошибка отправки кода', 'error');
  }
}

function initVerify() {
  const verifyBtn = document.getElementById('verify-btn');
  if (verifyBtn) verifyBtn.addEventListener('click', verifyCode);
  
  const resendBtn = document.getElementById('resend-btn');
  if (resendBtn) resendBtn.addEventListener('click', resendCode);
  
  loadVerifyPage();
}

initVerify();