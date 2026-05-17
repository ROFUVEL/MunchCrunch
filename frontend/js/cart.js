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

  if (cart.length === 0) {
    showNotice('Корзина пуста', 'error');
    return;
  }

  const userId = localStorage.getItem('userId');
  const branchId = localStorage.getItem('branchId');

  if (!userId || !branchId) {
    showNotice('Нужно выбрать точку и войти', 'error');
    return;
  }

  try {
    const res = await fetch(`${getApiUrl()}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        branchId,
        items: cart
      })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      showNotice(data.error || 'Не удалось оформить заказ', 'error');
      return;
    }

    localStorage.removeItem('cart');
    showNotice('Заказ оформлен', 'success');
    renderCart();
    window.location.href = 'orders.html';
  } catch (e) {
    showNotice('Ошибка сети при оформлении заказа', 'error');
  }
}

function initCartPage() {
  const goBranches = document.getElementById('go-branches');
  if (goBranches) {
    goBranches.addEventListener('click', () => {
      window.location.href = 'branches.html';
    });
  }

  const goMenu = document.getElementById('go-menu');
  if (goMenu) {
    goMenu.addEventListener('click', () => {
      window.location.href = 'menu.html';
    });
  }
}

initCartPage();
renderCart();
