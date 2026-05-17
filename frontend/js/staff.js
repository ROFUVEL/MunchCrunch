const API_URL = getApiUrl();
const userId = localStorage.getItem('userId');
const role = localStorage.getItem('role');
if (role !== 'staff') {
  showNotice('Нет доступа', 'error');
  window.location.href = 'menu.html';
}
async function loadOrders() {
  const div = document.getElementById('orders');
  if (!div) return;

  div.innerHTML = '<p class="muted">Загрузка...</p>';

  try {
    const res = await fetch(`${API_URL}/staff/orders/${userId}`);
    const orders = await res.json().catch(() => []);

    if (!res.ok) {
      div.innerHTML = '';
      showNotice(orders.error || 'Не удалось загрузить заказы', 'error');
      return;
    }

    if (!Array.isArray(orders) || orders.length === 0) {
      div.innerHTML = '<p class="muted">Заказов нет</p>';
      return;
    }

    div.innerHTML = '';

    orders.forEach(order => {
      const el = document.createElement('div');
      el.className = 'card';
      el.innerHTML = `
        <h3>Заказ #${order.id}</h3>
        <p>Статус: ${order.status}</p>
        <div class="actions">
          <button type="button" onclick="updateStatus(${order.id}, 'cooking')">Готовится</button>
          <button type="button" onclick="updateStatus(${order.id}, 'ready')">Готов</button>
          <button type="button" onclick="updateStatus(${order.id}, 'issued')">Выдан</button>
        </div>
      `;
      div.appendChild(el);
    });
  } catch (e) {
    div.innerHTML = '';
    showNotice('Ошибка сети при загрузке заказов', 'error');
  }
}
async function updateStatus(orderId, status) {
  try {
    const res = await fetch(`${API_URL}/staff/order-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        orderId,
        status
      })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showNotice(data.error || 'Не удалось обновить статус', 'error');
      return;
    }

    showNotice('Статус обновлён', 'success');
    loadOrders();
  } catch (e) {
    showNotice('Ошибка сети при обновлении статуса', 'error');
  }
}
loadOrders();
