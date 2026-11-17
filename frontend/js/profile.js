const API_URL = getApiUrl();

async function loadProfile() {
  const userId = localStorage.getItem('userId');
  
  if (!userId) {
    window.location.href = 'login.html';
    return;
  }
  
  try {
    const res = await fetch(`${API_URL}/users/${userId}`);
    if (!res.ok) throw new Error('Ошибка загрузки');
    
    const user = await res.json();
    renderProfile(user);
  } catch (e) {
    const container = document.getElementById('profile');
    if (container) {
      container.innerHTML = '<div class="card" role="alert">Не удалось загрузить профиль. Попробуйте обновить страницу.</div>';
    }
  }
}

function renderProfile(user) {
  const container = document.getElementById('profile');
  if (!container) return;
  
  
  container.innerHTML = `
    <div class="card">
      <h3>Информация о пользователе</h3>
      <p><strong>Телефон:</strong> ${user.phone}</p>
      
      <div class="actions actions-spaced">
        <button id="view-orders-btn" class="secondary">Мои заказы</button>
        <button id="logout-btn" class="logout-button">Выйти</button>
      </div>
    </div>
  `;
  
  const ordersBtn = document.getElementById('view-orders-btn');
  if (ordersBtn) {
    ordersBtn.addEventListener('click', () => {
      window.location.href = 'orders.html';
    });
  }
  
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }
}

function logout() {
  localStorage.clear();
  sessionStorage.clear();
  showNotice('Вы вышли из системы', 'success');
  window.location.href = 'login.html';
}

loadProfile();
