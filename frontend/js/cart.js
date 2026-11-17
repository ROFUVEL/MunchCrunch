const API_URL = getApiUrl();

let checkedBranchId = null;
let availableDishIds = [];
let isCheckingCart = false;
let isSubmittingOrder = false;

async function refreshCart() {
  const branchId = getSelectedBranch();
  checkedBranchId = null;
  isCheckingCart = true;
  renderCart();

  try {
    if (!branchId) return false;
    const res = await fetch(`${API_URL}/menu?branchId=${branchId}`);
    if (!res.ok) throw new Error('Ошибка загрузки меню');
    const dishes = await res.json();
    if (!Array.isArray(dishes)) throw new Error('Некорректное меню');
    if (branchId !== getSelectedBranch()) return false;

    const cart = getCart();
    for (const item of cart) {
      const dish = dishes.find(dish => dish.id === item.dishId);
      if (dish) {
        item.price = dish.price;
        item.name = dish.name;
      }
    }
    saveCart(cart);
    availableDishIds = dishes.map(dish => dish.id);
    checkedBranchId = branchId;
    return true;
  } catch (e) {
    showNotice('Не удалось проверить цены и доступность блюд. Повторите проверку.', 'error');
    return false;
  } finally {
    isCheckingCart = false;
    renderCart();
  }
}

function getUserId() {
  return localStorage.getItem('userId');
}

function getSelectedBranch() {
  return localStorage.getItem('branchId');
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
  const isChecked = checkedBranchId !== null && checkedBranchId === getSelectedBranch();
  let hasUnavailableItems = false;

  if (cart.length === 0) {
    cartDiv.innerHTML = '<p>Корзина пуста</p>';
    totalDiv.innerHTML = '';
    return;
  }

  cart.forEach((item, index) => {
    const isAvailable = isChecked && availableDishIds.includes(item.dishId);
    if (isAvailable) total += item.price * item.quantity;
    if (isChecked && !isAvailable) hasUnavailableItems = true;

    const el = document.createElement('div');
    el.className = 'card';
    el.innerHTML = `
      <h3></h3>
      <p>${!isChecked ? 'Цена и доступность не проверены' :
        isAvailable ? `${item.price} ₽` : 'Недоступно в этом ресторане'}</p>
      <p>Количество: ${item.quantity}</p>
    `;
    el.querySelector('h3').textContent = item.name;

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
    ${isChecked ? `<h3>Итого за доступные блюда: ${total.toLocaleString('ru-RU')} ₽</h3>` :
      '<p>Для расчёта суммы нужно проверить меню выбранного ресторана.</p>'}
    ${hasUnavailableItems ? '<p role="alert">Удалите недоступные блюда или выберите другой ресторан для оформления заказа.</p>' : ''}
    ${!isChecked ? `<button onclick="refreshCart()" ${isCheckingCart ? 'disabled' : ''}>${isCheckingCart ? 'Проверка...' : 'Повторить проверку'}</button>` : ''}
    <button onclick="checkout()" ${!isChecked || hasUnavailableItems || isSubmittingOrder ? 'disabled' : ''}>Оформить заказ</button>
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
  if (isSubmittingOrder || isCheckingCart) return;
  let cart = getCart();
  const userId = getUserId();
  const branchId = getSelectedBranch();

  
  if (cart.length === 0) {
    showNotice('Корзина пуста', 'error');
    return;
  }
  
  if (!userId) {
    showNotice('Сначала войдите в систему', 'error');
    window.location.href = 'login.html';
    return;
  }

  if (!branchId) {
    showNotice('Сначала выберите ресторан', 'error');
    window.location.href = 'branches.html';
    return;
  }

  const previousPrices = cart.map(item => item.price);
  if (!await refreshCart()) return;
  cart = getCart();
  if (cart.some(item => !availableDishIds.includes(item.dishId))) {
    showNotice('В корзине есть недоступные блюда', 'error');
    return;
  }
  if (cart.some((item, index) => Number(item.price) !== Number(previousPrices[index]))) {
    showNotice('Цены изменились. Проверьте новую сумму и оформите заказ ещё раз.', 'info');
    return;
  }
  if (branchId !== getSelectedBranch() || cart.length === 0) return;

  const orderData = {
    userId: Number(userId),
    branchId: Number(branchId),
    items: cart.map(item => ({
      dishId: item.dishId,
      quantity: item.quantity,
      price: item.price
    }))
  };

  try {
    isSubmittingOrder = true;
    renderCart();
    const res = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
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
  } finally {
    isSubmittingOrder = false;
    renderCart();
  }
}

async function initCartPage() {
  if (!localStorage.getItem('userId')) {
    window.location.href = 'login.html';
    return;
  }
  
  await loadSelectedBranch();
  await refreshCart();
}

initCartPage();
