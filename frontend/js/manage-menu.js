const API_URL = getApiUrl();

let categories = [];
let allDishes = [];
let currentFilter = 'all'; // 'all', 'available', 'unavailable'

async function loadCategories() {
  try {
    const res = await fetch(`${API_URL}/categories`);
    categories = await res.json();
    
    const select = document.getElementById('dish-category');
    if (select) {
      select.innerHTML = '<option value="">Выберите категорию</option>';
      categories.forEach(cat => {
        select.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
      });
    }
  } catch (e) {
    console.error('Ошибка загрузки категорий:', e);
  }
}

async function loadMenu() {
  const role = localStorage.getItem('role');
  const userId = localStorage.getItem('userId');
  
  if (role !== 'staff' || !userId) {
    window.location.href = 'menu.html';
    return;
  }
  
  try {
    const res = await fetch(`${API_URL}/menu/all`);
    allDishes = await res.json();
    renderFilterButtons();
    renderMenu();
  } catch (e) {
    showNotice('Ошибка загрузки меню', 'error');
  }
}

function renderFilterButtons() {
  const container = document.getElementById('filter-bar');
  if (!container) return;
  
  const filters = [
    { id: 'all', name: 'Все блюда' },
    { id: 'available', name: 'Доступные' },
    { id: 'unavailable', name: 'Скрытые' }
  ];
  
  container.innerHTML = '';
  
  filters.forEach(filter => {
    const btn = document.createElement('button');
    btn.className = `filter-btn ${currentFilter === filter.id ? 'active' : ''}`;
    btn.innerText = filter.name;
    btn.onclick = () => {
      currentFilter = filter.id;
      renderFilterButtons();
      renderMenu();
    };
    container.appendChild(btn);
  });
}

function renderMenu() {
  const container = document.getElementById('menu-list');
  if (!container) return;
  
  let filteredDishes = allDishes;
  
  if (currentFilter === 'available') {
    filteredDishes = allDishes.filter(d => d.is_available === true);
  } else if (currentFilter === 'unavailable') {
    filteredDishes = allDishes.filter(d => d.is_available === false);
  }
  
  if (filteredDishes.length === 0) {
    container.innerHTML = '<p class="muted">Нет блюд</p>';
    return;
  }
  
  container.innerHTML = '';
  
  filteredDishes.forEach(dish => {
    const el = document.createElement('div');
    el.className = 'dish-item';
    el.innerHTML = `
      <div class="dish-info">
        <strong>${dish.name}</strong>
        <span class="muted">${dish.category_name || 'Без категории'}</span>
        <p class="muted">${dish.description || 'Нет описания'}</p>
        <div class="price">${dish.price} ₽</div>
        <span class="${dish.is_available ? 'available' : 'unavailable'}">
          ${dish.is_available ? 'Доступно' : 'Скрыто'}
        </span>
      </div>
      <div class="dish-actions">
        <button onclick="toggleAvailability(${dish.id}, ${dish.is_available})" class="toggle-btn">
          ${dish.is_available ? 'Скрыть' : 'Показать'}
        </button>
      </div>
    `;
    container.appendChild(el);
  });
}

async function toggleAvailability(dishId, isAvailable) {
  try {
    const res = await fetch(`${API_URL}/dishes/${dishId}/availability`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAvailable: !isAvailable })
    });
    
    if (!res.ok) throw new Error('Ошибка');
    
    showNotice(`Блюдо ${!isAvailable ? 'показано' : 'скрыто'}`, 'success');
    await loadMenu(); // Перезагружаем все блюда
  } catch (e) {
    showNotice('Ошибка обновления', 'error');
  }
}

function showModal() {
  document.getElementById('add-dish-modal').style.display = 'block';
  document.getElementById('modal-overlay').style.display = 'block';
}

function hideModal() {
  document.getElementById('add-dish-modal').style.display = 'none';
  document.getElementById('modal-overlay').style.display = 'none';
  document.getElementById('dish-name').value = '';
  document.getElementById('dish-description').value = '';
  document.getElementById('dish-price').value = '';
  document.getElementById('dish-category').value = '';
}

async function saveDish() {
  const name = document.getElementById('dish-name').value;
  const description = document.getElementById('dish-description').value;
  const price = document.getElementById('dish-price').value;
  const categoryId = document.getElementById('dish-category').value;
  const userId = localStorage.getItem('userId');
  
  if (!name || !price || !categoryId) {
    showNotice('Заполните название, цену и категорию', 'error');
    return;
  }
  
  try {
    const res = await fetch(`${API_URL}/dishes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        name,
        description,
        price: Number(price),
        category_id: Number(categoryId)
      })
    });
    
    if (!res.ok) throw new Error('Ошибка');
    
    showNotice('Блюдо добавлено', 'success');
    hideModal();
    await loadMenu(); // Перезагружаем список
  } catch (e) {
    showNotice('Ошибка добавления блюда', 'error');
  }
}

function initManageMenu() {
  const role = localStorage.getItem('role');
  const userId = localStorage.getItem('userId');
  
  if (role !== 'staff' || !userId) {
    window.location.href = 'menu.html';
    return;
  }
  
  loadCategories();
  loadMenu();
  
  const addBtn = document.getElementById('add-dish-btn');
  if (addBtn) addBtn.onclick = showModal;
  
  const saveBtn = document.getElementById('save-dish-btn');
  if (saveBtn) saveBtn.onclick = saveDish;
  
  const cancelBtn = document.getElementById('cancel-dish-btn');
  if (cancelBtn) cancelBtn.onclick = hideModal;
  
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.onclick = hideModal;
}

initManageMenu();