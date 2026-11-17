const API_URL = getApiUrl();

function getUserId() {
  return localStorage.getItem('userId');
}

let autoRefreshInterval = null;
const orderItemsCache = new Map();
const expandedOrders = new Set();

function renderOrderItems(container, items) {
  container.textContent = '';
  for (const item of items) {
    const line = document.createElement('p');
    line.textContent = `${item.name}: ${item.quantity} шт. × ${formatPrice(item.price)} ₽ = ${formatPrice(Number(item.price) * item.quantity)} ₽`;
    container.appendChild(line);
  }
  if (items.length === 0) container.textContent = 'В заказе нет позиций';
}

function addOrderItemsSection(card, orderId) {
  const details = document.createElement('details');
  const summary = document.createElement('summary');
  summary.textContent = 'Состав заказа';
  const content = document.createElement('div');
  details.appendChild(summary);
  details.appendChild(content);
  if (orderItemsCache.has(orderId)) renderOrderItems(content, orderItemsCache.get(orderId));
  details.open = expandedOrders.has(orderId);
  details.addEventListener('toggle', async () => {
    if (!details.open) {
      expandedOrders.delete(orderId);
      return;
    }
    expandedOrders.add(orderId);
    if (orderItemsCache.has(orderId)) return;
    content.textContent = 'Загрузка...';
    try {
      const res = await fetch(`${API_URL}/users/${getUserId()}/orders/${orderId}/items`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Не удалось загрузить состав заказа');
      orderItemsCache.set(orderId, data);
      renderOrderItems(content, data);
    } catch (e) {
      content.textContent = 'Не удалось загрузить состав заказа. Закройте и откройте его повторно.';
    }
  });
  card.appendChild(details);
}

async function loadUserOrders() {
  const userId = getUserId();
  
  if (!userId) {
    showNotice('Сначала войдите в систему', 'error');
    window.location.href = 'login.html';
    return;
  }
  
  try {
    const res = await fetch(`${API_URL}/orders/${userId}`);
    
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
    `;
    addOrderItemsSection(el, order.id);
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
  if (!localStorage.getItem('userId')) {
    window.location.href = 'login.html';
    return;
  }
  
  await loadUserOrders();
  startAutoRefresh();
}

window.addEventListener('beforeunload', () => {
  stopAutoRefresh();
});

initOrdersPage();
