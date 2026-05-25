const API_URL = getApiUrl();
let allDishes = []; // Локальный кэш для всех блюд

async function loadMenu() {
  try {
    const res = await fetch(`${API_URL}/menu`);
    if (!res.ok) {
      showNotice('Не удалось загрузить меню', 'error');
      return;
    }
    allDishes = await res.json();

    // 1. Строим ленту кнопок на основе категорий
    renderCategoryButtons(allDishes);

    // 2. Отображаем блюда
    renderDishes(allDishes);
    
  } catch (e) {
    showNotice('Ошибка сети при загрузке меню', 'error');
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
    btn.onclick = (e) => filterCategory(catName, e);
    categoriesDiv.appendChild(btn);
  });
}

// ОСНОВНАЯ МАГИЯ: Отрисовка блюд с проверкой корзины
// Перерисованная функция отрисовки блюд с выводом стоимости за позицию
function renderDishes(dishes) {
  const menuDiv = document.getElementById('menu');
  if (!menuDiv) return;
  
  menuDiv.innerHTML = '';

  if (!Array.isArray(dishes) || dishes.length === 0) {
    menuDiv.innerHTML = '<p class="muted">Нет доступных блюд</p>';
    return;
  }

  // Считываем текущую корзину
  const cart = JSON.parse(localStorage.getItem('cart')) || [];

  dishes.forEach(dish => {
    const el = document.createElement('div');
    el.className = 'card';

    el.innerHTML = `
      <h3>${dish.name}</h3>
      <p class="muted">${dish.description || 'Описание отсутствует'}</p>
      <p><strong>${dish.price} ₽</strong></p>
    `;

    // Ищем товар в корзине
    const cartItem = cart.find(item => item.dishId === dish.id);

    // Контейнер для кнопок управления
    const actionDiv = document.createElement('div');
    actionDiv.className = 'actions'; 
    actionDiv.style.alignItems = 'center';

    if (cartItem) {
      // Считаем сумму ТОЛЬКО для этого блюда
      const itemTotalPrice = dish.price * cartItem.quantity;

      // Кнопка минус
      const minusBtn = document.createElement('button');
      minusBtn.innerText = '-';
      minusBtn.className = 'secondary';
      minusBtn.onclick = () => updateQuantity(dish, -1);

      // Текст количества
      const countSpan = document.createElement('span');
      countSpan.innerText = ` ${cartItem.quantity} шт. `;
      countSpan.style.fontWeight = 'bold';
      countSpan.style.margin = '0 10px';

      // Кнопка плюс
      const plusBtn = document.createElement('button');
      plusBtn.innerText = '+';
      plusBtn.onclick = () => updateQuantity(dish, 1);

      // Поле с суммой конкретного блюда (появляется только когда товар в корзине)
      const priceSpan = document.createElement('span');
      priceSpan.innerText = ` (${itemTotalPrice} ₽)`;
      priceSpan.className = 'muted'; // Твои серые аккуратные стили текста
      priceSpan.style.marginLeft = '12px';
      priceSpan.style.fontWeight = '500';

      actionDiv.appendChild(minusBtn);
      actionDiv.appendChild(countSpan);
      actionDiv.appendChild(plusBtn);
      actionDiv.appendChild(priceSpan); // Добавили сумму справа от плюса
    } else {
      // Если блюдо не выбрано — показываем только обычную кнопку, поля суммы нет
      const addBtn = document.createElement('button');
      addBtn.innerText = 'Добавить в корзину';
      addBtn.onclick = () => updateQuantity(dish, 1);
      actionDiv.appendChild(addBtn);
    }

    el.appendChild(actionDiv);
    menuDiv.appendChild(el);
  });
}

// Универсальная функция для изменения количества прямо из меню
function updateQuantity(dish, delta) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  const existing = cart.find(item => item.dishId === dish.id);

  if (existing) {
    existing.quantity += delta;
    // Если количество упало до 0 или меньше — удаляем блюдо из корзины
    if (existing.quantity <= 0) {
      cart = cart.filter(item => item.dishId !== dish.id);
    }
  } else if (delta > 0) {
    // Если блюда не было и нажали плюс — добавляем первую штуку
    cart.push({
      dishId: dish.id,
      name: dish.name,
      price: dish.price,
      quantity: 1
    });
  }

  // Сохраняем обновленную корзину
  localStorage.setItem('cart', JSON.stringify(cart));

  // Показываем уведомление (только при добавлении)
  if (delta > 0 && !existing) {
    showNotice('Добавлено в корзину', 'success');
  }

  // КРИТИЧНО: Перерисовываем меню, чтобы кнопки мгновенно обновились на экране!
  // Определяем, какая категория сейчас активна, чтобы не сбрасывать фильтр пользователя
  const activeBtn = document.querySelector('.category-btn.active');
  const activeCategory = activeBtn ? activeBtn.innerText : 'Все';
  
  if (activeCategory === 'Все') {
    renderDishes(allDishes);
  } else {
    const filtered = allDishes.filter(d => d.category_name === activeCategory);
    renderDishes(filtered);
  }
}

function filterCategory(categoryName, event) {
  const buttons = document.querySelectorAll('.category-btn');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  if (event && event.target) {
    event.target.classList.add('active');
  }

  if (categoryName === 'Все') {
    renderDishes(allDishes);
  } else {
    const filtered = allDishes.filter(dish => dish.category_name === categoryName);
    renderDishes(filtered);
  }
}

function initMenuPage() {
  const role = localStorage.getItem('role');
  if (role === 'staff') {
    window.location.href = 'staff.html';
    return;
  }
  loadMenu();
}

initMenuPage();
