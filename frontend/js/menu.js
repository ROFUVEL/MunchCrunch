const API_URL = getApiUrl();

async function loadMenu() {
  try {
    const res = await fetch(`${API_URL}/menu`);
    if (!res.ok) {
      showNotice('Не удалось загрузить меню', 'error');
      return;
    }
    const dishes = await res.json();

    const menuDiv = document.getElementById('menu');
    menuDiv.innerHTML = '';

    if (!Array.isArray(dishes) || dishes.length === 0) {
      menuDiv.innerHTML = '<p class="muted">Нет доступных блюд</p>';
      return;
    }

    dishes.forEach(dish => {
      const el = document.createElement('div');
      el.className = 'card';

      el.innerHTML = `
      <h3>${dish.name}</h3>
      <p>${dish.description}</p>
      <p>${dish.price} ₽</p>
    `;

      const btn = document.createElement('button');
      btn.innerText = 'Добавить в корзину';

      btn.onclick = () => addToCart(dish);

      el.appendChild(btn);
      menuDiv.appendChild(el);
    });
  } catch (e) {
    showNotice('Ошибка сети при загрузке меню', 'error');
  }
}

function addToCart(dish) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];

  const existing = cart.find(item => item.dishId === dish.id);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      dishId: dish.id,
      name: dish.name,
      price: dish.price,
      quantity: 1
    });
  }

  localStorage.setItem('cart', JSON.stringify(cart));

  showNotice('Добавлено в корзину', 'success');
}

function initMenuPage() {
  const role = localStorage.getItem('role');
  if (role === 'staff') {
    window.location.href = 'staff.html';
    return;
  }

  const goCart = document.getElementById('go-cart');
  if (goCart) {
    goCart.addEventListener('click', () => {
      window.location.href = 'cart.html';
    });
  }

  const goBranches = document.getElementById('go-branches');
  if (goBranches) {
    goBranches.addEventListener('click', () => {
      window.location.href = 'branches.html';
    });
  }

  loadMenu();
}

initMenuPage();
