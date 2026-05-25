const API_URL = getApiUrl();

async function loadStaffOrders() {
  const userId = localStorage.getItem('userId');
  const role = localStorage.getItem('role');
  
  if (role !== 'staff') {
    showNotice('Нет доступа', 'error');
    window.location.href = 'menu.html';
    return;
  }
  
  if (!userId) {
    window.location.href = 'login.html';
    return;
  }
  
  try {
    const res = await fetch(`${API_URL}/staff/orders/${userId}`);
    if (!res.ok) throw new Error('Ошибка загрузки');
    
    const orders = await res.json();
    renderOrders(orders);
  } catch (e) {
    showNotice(e.message, 'error');
  }
}

function renderOrders(orders) {
  const container = document.getElementById('orders');
  if (!container) return;
  
  if (orders.length === 0) {
    container.innerHTML = '<p class="muted">Нет заказов</p>';
    return;
  }
  
  container.innerHTML = '';
  
  orders.forEach(order => {
    const el = document.createElement('div');
    el.className = 'card';
    el.innerHTML = `
      <h3>Заказ #${order.id}</h3>
      <p>Сумма: ${order.total_price} ₽</p>
      <p>Статус: <strong>${getStatusText(order.status)}</strong></p>
      <p>Дата: ${new Date(order.created_at).toLocaleString()}</p>
      <select id="status-${order.id}" class="status-select">
        <option value="created" ${order.status === 'created' ? 'selected' : ''}>Создан</option>
        <option value="cooking" ${order.status === 'cooking' ? 'selected' : ''}>Готовится</option>
        <option value="ready" ${order.status === 'ready' ? 'selected' : ''}>Готов</option>
        <option value="issued" ${order.status === 'issued' ? 'selected' : ''}>Выдан</option>
        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Отменен</option>
      </select>
      <button onclick="updateStatus(${order.id})">Обновить статус</button>
    `;
    container.appendChild(el);
  });
}

function getStatusText(status) {
  const statuses = {
    'created': 'Создан',
    'cooking': 'Готовится',
    'ready': 'Готов к выдаче',
    'issued': 'Выдан',
    'cancelled': 'Отменен'
  };
  return statuses[status] || status;
}

async function updateStatus(orderId) {
  const select = document.getElementById(`status-${orderId}`);
  const status = select.value;
  const userId = localStorage.getItem('userId');
  
  try {
    const res = await fetch(`${API_URL}/staff/order-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, orderId, status })
    });
    
    if (!res.ok) throw new Error('Ошибка');
    
    showNotice('Статус обновлен', 'success');
    loadStaffOrders();
  } catch (e) {
    showNotice('Ошибка обновления', 'error');
  }
}

function initStaff() {
  const role = localStorage.getItem('role');
  if (role !== 'staff') {
    window.location.href = 'menu.html';
    return;
  }
  loadStaffOrders();
}

initStaff();