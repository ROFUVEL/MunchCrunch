const API_URL = getApiUrl();
const userId = localStorage.getItem('userId');

async function loadOrders() {
  const div = document.getElementById('orders');
  if (!div) return;

  if (!userId) {
    div.innerHTML = `
      <div class="card">
        <p>Чтобы посмотреть заказы, нужно войти.</p>
        <button type="button" onclick="location.href='login.html'">Войти</button>
      </div>
    `;
    return;
  }

  div.innerHTML = '<p class="muted">Загрузка...</p>';

  try {
    const res = await fetch(`${API_URL}/orders/${userId}`);
    if (!res.ok) {
      div.innerHTML = '';
      showNotice('Не удалось загрузить заказы', 'error');
      return;
    }

    const orders = await res.json();

    if (!Array.isArray(orders) || orders.length === 0) {
      div.innerHTML = '<p class="muted">Заказов пока нет</p>';
      return;
    }

    div.innerHTML = '';

    orders.forEach(order => {
      const el = document.createElement('div');
      el.className = 'card';
      el.innerHTML = `
        <h3>Заказ #${order.id}</h3>
        <p>Сумма: ${order.total_price} ₽</p>
        <p>Статус: ${order.status}</p>
      `;
      div.appendChild(el);
    });
  } catch (e) {
    div.innerHTML = '';
    showNotice('Ошибка сети при загрузке заказов', 'error');
  }
}

loadOrders();
