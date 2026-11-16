const API_URL = getApiUrl();

async function loadProfile() {
  const userId = localStorage.getItem('userId');
  const role = localStorage.getItem('role');
  
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
    renderProfile({
      id: userId,
      phone: localStorage.getItem('userPhone') || 'Не указан',
      role: role
    });
  }
}

function renderProfile(user) {
  const container = document.getElementById('profile');
  if (!container) return;
  
  const isStaff = user.role === 'staff';
  
  container.innerHTML = `
    <div class="card">
      <h3>Информация о пользователе</h3>
      <p><strong>Телефон:</strong> ${user.phone}</p>
      <p><strong>Роль:</strong> ${isStaff ? 'Сотрудник' : 'Клиент'}</p>
      ${user.branch_id ? `<p><strong>Филиал:</strong> ${user.branch_id}</p>` : ''}
      
      <div class="actions actions-spaced">
        ${!isStaff ? '<button id="view-orders-btn" class="secondary">Мои заказы</button>' : ''}
        <button id="logout-btn" class="logout-button">Выйти</button>
      </div>
    </div>
  `;
  
  if (!isStaff) {
    const ordersBtn = document.getElementById('view-orders-btn');
    if (ordersBtn) {
      ordersBtn.addEventListener('click', () => {
        window.location.href = 'orders.html';
      });
    }
  }
  
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }
}

function logout() {
  localStorage.clear();
  showNotice('Вы вышли из системы', 'success');
  window.location.href = 'login.html';
}

loadProfile();