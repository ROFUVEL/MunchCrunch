const API_URL = getApiUrl();

function getAuthToken() {
  return localStorage.getItem('sessionToken');
}

function getUserId() {
  return localStorage.getItem('userId');
}

function getUserRole() {
  return localStorage.getItem('role');
}

async function checkSession() {
  const token = getAuthToken();
  const role = getUserRole();
  
  if (role === 'staff') {
    window.location.href = 'staff.html';
    return false;
  }
  
  if (!token) {
    window.location.href = 'login.html';
    return false;
  }
  
  try {
    const res = await fetch(`${API_URL}/check-session`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!res.ok) {
      localStorage.clear();
      window.location.href = 'login.html';
      return false;
    }
    
    return true;
  } catch (e) {
    window.location.href = 'login.html';
    return false;
  }
}

let autoRefreshInterval = null;

async function loadUserOrders() {
  const userId = getUserId();
  const token = getAuthToken();
  
  if (!userId || !token) {
    showNotice('Сначала войдите в систему', 'error');
    window.location.href = 'login.html';
    return;
  }
  
  try {
    const res = await fetch(`${API_URL}/orders/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || 'Ошибка загрузки');
    }
    
    const orders = await res.json();
    renderOrders(orders);
  } catch (e) {
    console.error('Ошибка:', e);
    showNotice(e.message || 'Ошибка загрузки заказов', 'error');
  }
}

function renderOrders(orders) {
  const container = document.getElementById('orders');
  if (!container) return;
  
  if (orders.length === 0) {
    container.innerHTML = '<div class="card"><p class="muted center">У вас пока нет заказов</p></div>';
    return;
  }
  
  container.innerHTML = '';
  
  orders.forEach(order => {
    const el = document.createElement('div');
    el.className = 'card order-card';
    el.dataset.id = order.id;
    el.dataset.status = order.status;
    
    el.innerHTML = `
      <h3>Заказ #${order.id}</h3>
      <p><strong>Сумма:</strong> ${formatPrice(order.total_price)} ₽</p>
      <p><strong>Статус:</strong> <span id="status-${order.id}" class="order-status status-${order.status}">${getStatusText(order.status)}</span></p>
      <p><strong>Дата:</strong> ${formatDate(order.created_at)}</p>
      ${order.updated_at && order.updated_at !== order.created_at ? 
        `<p class="muted">Последнее обновление: ${formatTime(order.updated_at)}</p>` : ''}
      ${order.status === 'ready' ? 
        '<button onclick="confirmReceived()" class="secondary" style="margin-top: 10px;">Подтвердить получение</button>' : ''}
    `;
    container.appendChild(el);
  });
}

function formatPrice(price) {
  return Number(price).toLocaleString('ru-RU');
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function formatTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getStatusText(status) {
  const statuses = {
    'created': 'Создан',
    'cooking': 'Готовится',
    'ready': 'Готов к выдаче',
    'issued': 'Получен',
    'cancelled': 'Отменен'
  };
  return statuses[status] || status;
}

function confirmReceived() {
  showNotice('Подтвердите получение заказа у сотрудника ресторана', 'info');
}

function startAutoRefresh() {
  if (autoRefreshInterval) clearInterval(autoRefreshInterval);
  autoRefreshInterval = setInterval(() => {
    loadUserOrders();
  }, 10000);
}

function stopAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
  }
}

async function initOrdersPage() {
  const sessionValid = await checkSession();
  if (!sessionValid) return;
  
  await loadUserOrders();
  startAutoRefresh();
}

window.addEventListener('beforeunload', () => {
  stopAutoRefresh();
});

initOrdersPage();