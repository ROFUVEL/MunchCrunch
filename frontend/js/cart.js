const API_URL = getApiUrl();

function getAuthToken() {
  return localStorage.getItem('sessionToken');
}

function getUserId() {
  return localStorage.getItem('userId');
}

function getSelectedBranch() {
  return localStorage.getItem('branchId');
}

async function checkSession() {
  const token = getAuthToken();
  
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

async function loadSelectedBranch() {
  const branchId = getSelectedBranch();
  const branchInfoDiv = document.getElementById('selected-branch-info');
  
  if (!branchInfoDiv) return;
  
  if (!branchId) {
    branchInfoDiv.innerHTML = `
      <div class="branch-message branch-message-warning">
        <strong>Точка не выбрана</strong>
        <p class="branch-message-text">Пожалуйста, выберите ресторан для оформления заказа.</p>
        <button onclick="window.location.href='branches.html'">Выбрать точку</button>
      </div>
    `;
    return false;
  }
  
  try {
    const res = await fetch(`${API_URL}/branches`);
    if (!res.ok) throw new Error('Ошибка загрузки');
    
    const branches = await res.json();
    const branch = branches.find(b => b.id === Number(branchId));
    
    if (branch) {
      branchInfoDiv.innerHTML = `
        <div class="branch-details">
          <div class="branch-description">
            <h3 class="branch-title">Выбранная точка</h3>
            <p class="branch-detail"><strong>${branch.name}</strong></p>
            <p class="branch-detail muted">${branch.address}</p>
            <p class="branch-detail muted">${branch.working_hours || 'Часы работы не указаны'}</p>
          </div>
          <div class="branch-actions">
            <button onclick="window.location.href='branches.html'" class="secondary">Изменить точку</button>
          </div>
        </div>
      `;
      return true;
    } else {
      branchInfoDiv.innerHTML = `
        <div class="branch-message branch-message-error">
          <strong>Выбранная точка не найдена</strong>
          <button onclick="window.location.href='branches.html'">Выбрать точку заново</button>
        </div>
      `;
      return false;
    }
  } catch (e) {
    console.error('Ошибка загрузки точки:', e);
    branchInfoDiv.innerHTML = `
      <div class="branch-message branch-message-error">
        Ошибка загрузки информации о точке
      </div>
    `;
    return false;
  }
}

function getCart() {
  return JSON.parse(localStorage.getItem('cart')) || [];
}

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function renderCart() {
  const cart = getCart();
  const cartDiv = document.getElementById('cart');
  const totalDiv = document.getElementById('total');
  
  if (!cartDiv || !totalDiv) return;

  cartDiv.innerHTML = '';
  let total = 0;

  if (cart.length === 0) {
    cartDiv.innerHTML = '<p>Корзина пуста</p>';
    totalDiv.innerHTML = '';
    return;
  }

  cart.forEach((item, index) => {
    total += item.price * item.quantity;

    const el = document.createElement('div');
    el.className = 'card';
    el.innerHTML = `
      <h3>${item.name}</h3>
      <p>${item.price} ₽</p>
      <p>Количество: ${item.quantity}</p>
    `;

    const plus = document.createElement('button');
    plus.innerText = '+';
    plus.onclick = () => changeQty(index, 1);

    const minus = document.createElement('button');
    minus.innerText = '-';
    minus.onclick = () => changeQty(index, -1);

    const del = document.createElement('button');
    del.innerText = 'Удалить';
    del.onclick = () => removeItem(index);

    el.appendChild(plus);
    el.appendChild(minus);
    el.appendChild(del);
    cartDiv.appendChild(el);
  });

  totalDiv.innerHTML = `
    <h3>Итого: ${total} ₽</h3>
    <button onclick="checkout()">Оформить заказ</button>
  `;
}

function changeQty(index, delta) {
  let cart = getCart();
  cart[index].quantity += delta;
  
  if (cart[index].quantity <= 0) {
    cart.splice(index, 1);
  }
  
  saveCart(cart);
  renderCart();
}

function removeItem(index) {
  let cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
  renderCart();
}

async function checkout() {
  const cart = getCart();
  const userId = getUserId();
  const branchId = getSelectedBranch();
  const token = getAuthToken();

  
  if (cart.length === 0) {
    showNotice('Корзина пуста', 'error');
    return;
  }
  
  if (!userId || !token) {
    showNotice('Сначала войдите в систему', 'error');
    window.location.href = 'login.html';
    return;
  }

  if (!branchId) {
    showNotice('Сначала выберите ресторан', 'error');
    window.location.href = 'branches.html';
    return;
  }

  const orderData = {
    branchId: Number(branchId),
    items: cart.map(item => ({
      dishId: item.dishId,
      quantity: item.quantity,
      price: item.price
    }))
  };

  try {
    const res = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(orderData)
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      showNotice(data.error || 'Не удалось оформить заказ', 'error');
      return;
    }
    
    localStorage.removeItem('cart');
    showNotice('Заказ оформлен!', 'success');
    renderCart();
    
    
    setTimeout(() => {
      window.location.href = 'orders.html';
    }, 1500);
    
  } catch (e) {
    console.error('Ошибка оформления:', e);
    showNotice('Ошибка сети при оформлении заказа', 'error');
  }
}

async function initCartPage() {
  const sessionValid = await checkSession();
  if (!sessionValid) return;
  
  await loadSelectedBranch();
  renderCart();
}

initCartPage();