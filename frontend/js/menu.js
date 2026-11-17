const API_URL = getApiUrl();

function getSelectedBranch() {
  return localStorage.getItem('branchId');
}

let allDishes = [];

async function loadMenu() {
  const branchId = getSelectedBranch();
  
  if (!branchId) {
    showNotice('Сначала выберите ресторан', 'error');
    window.location.href = 'branches.html';
    return;
  }
  
  try {
    const res = await fetch(`${API_URL}/menu?branchId=${branchId}`);
    
    if (!res.ok) {
      throw new Error('Ошибка загрузки меню');
    }
    
    allDishes = await res.json();
    renderCategoryButtons(allDishes);
    renderDishes(allDishes);
  } catch (e) {
    console.error('Ошибка:', e);
    showNotice('Не удалось загрузить меню', 'error');
  }
}

function renderCategoryButtons(dishes) {
  const categoriesDiv = document.getElementById('categories');
  if (!categoriesDiv) return;

  const categoryNames = dishes.map(dish => dish.category_name).filter(Boolean);
  const uniqueCategories = ['Все', ...new Set(categoryNames)];

  categoriesDiv.innerHTML = '';

  uniqueCategories.forEach((catName, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `category-btn ${index === 0 ? 'active' : ''}`;
    btn.innerText = catName;
    btn.onclick = () => filterCategory(catName);
    categoriesDiv.appendChild(btn);
  });
}

function renderDishes(dishes) {
  const menuDiv = document.getElementById('menu');
  if (!menuDiv) return;
  
  menuDiv.innerHTML = '';

  if (!Array.isArray(dishes) || dishes.length === 0) {
    menuDiv.innerHTML = '<p class="muted">Нет доступных блюд</p>';
    return;
  }

  const cart = JSON.parse(localStorage.getItem('cart')) || [];

  dishes.forEach(dish => {
    const el = document.createElement('div');
    el.className = 'card';

    el.innerHTML = `
      <h3>${escapeHtml(dish.name)}</h3>
      <p class="muted">${escapeHtml(dish.description) || 'Описание отсутствует'}</p>
      <p><strong>${dish.price} ₽</strong></p>
    `;

    const cartItem = cart.find(item => item.dishId === dish.id);
    const actionDiv = document.createElement('div');
    actionDiv.className = 'actions menu-actions';

    if (cartItem) {
      const itemTotalPrice = dish.price * cartItem.quantity;

      const minusBtn = document.createElement('button');
      minusBtn.innerText = '-';
      minusBtn.className = 'secondary';
      minusBtn.onclick = () => updateQuantity(dish, -1);

      const countSpan = document.createElement('span');
      countSpan.innerText = ` ${cartItem.quantity} шт. `;
      countSpan.className = 'dish-quantity';

      const plusBtn = document.createElement('button');
      plusBtn.innerText = '+';
      plusBtn.onclick = () => updateQuantity(dish, 1);

      const priceSpan = document.createElement('span');
      priceSpan.innerText = ` (${itemTotalPrice} ₽)`;
      priceSpan.className = 'muted dish-total';

      actionDiv.appendChild(minusBtn);
      actionDiv.appendChild(countSpan);
      actionDiv.appendChild(plusBtn);
      actionDiv.appendChild(priceSpan);
    } else {
      const addBtn = document.createElement('button');
      addBtn.innerText = 'Добавить в корзину';
      addBtn.onclick = () => updateQuantity(dish, 1);
      actionDiv.appendChild(addBtn);
    }

    el.appendChild(actionDiv);
    menuDiv.appendChild(el);
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function updateQuantity(dish, delta) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  const existing = cart.find(item => item.dishId === dish.id);

  if (existing) {
    existing.quantity += delta;
    if (existing.quantity <= 0) {
      cart = cart.filter(item => item.dishId !== dish.id);
    }
  } else if (delta > 0) {
    cart.push({
      dishId: dish.id,
      name: dish.name,
      price: dish.price,
      quantity: 1
    });
  }

  localStorage.setItem('cart', JSON.stringify(cart));

  if (delta > 0 && !existing) {
    showNotice('Добавлено в корзину', 'success');
  }

  const activeBtn = document.querySelector('.category-btn.active');
  const activeCategory = activeBtn ? activeBtn.innerText : 'Все';
  
  if (activeCategory === 'Все') {
    renderDishes(allDishes);
  } else {
    const filtered = allDishes.filter(d => d.category_name === activeCategory);
    renderDishes(filtered);
  }
}

function filterCategory(categoryName) {
  const buttons = document.querySelectorAll('.category-btn');
  buttons.forEach(btn => {
    btn.classList.remove('active');
    if (btn.innerText === categoryName) {
      btn.classList.add('active');
    }
  });

  if (categoryName === 'Все') {
    renderDishes(allDishes);
  } else {
    const filtered = allDishes.filter(dish => dish.category_name === categoryName);
    renderDishes(filtered);
  }
}

async function initMenuPage() {
  if (!localStorage.getItem('userId')) {
    window.location.href = 'login.html';
    return;
  }
  
  await loadMenu();
}

initMenuPage();