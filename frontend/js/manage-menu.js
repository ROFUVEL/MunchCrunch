const API_URL = getApiUrl();

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

function getAuthToken() {
  return localStorage.getItem('sessionToken');
}

function getUserId() {
  return localStorage.getItem('userId');
}

function getUserRole() {
  return localStorage.getItem('role');
}

// Проверка сессии
async function checkSession() {
  const token = getAuthToken();
  const role = getUserRole();
  
  if (role !== 'staff' || !token) {
    window.location.href = 'menu.html';
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

// ============================================
// ЗАГРУЗКА ДАННЫХ
// ============================================

let categories = [];
let allDishes = [];
let currentFilter = 'all'; // 'all', 'available', 'unavailable'

// Загрузка категорий
async function loadCategories() {
  try {
    const res = await fetch(`${API_URL}/categories`);
    categories = await res.json();
    
    // Заполняем select в модальном окне
    const select = document.getElementById('dish-category');
    if (select) {
      select.innerHTML = '<option value="">Выберите категорию</option>';
      categories.forEach(cat => {
        select.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
      });
    }
  } catch (e) {
    console.error('Ошибка загрузки категорий:', e);
    showNotice('Не удалось загрузить категории', 'error');
  }
}

// Загрузка всех блюд (включая скрытые)
async function loadMenu() {
  const token = getAuthToken();
  const role = getUserRole();
  
  if (role !== 'staff' || !token) {
    window.location.href = 'menu.html';
    return;
  }
  
  try {
    const res = await fetch(`${API_URL}/menu/all`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!res.ok) throw new Error('Ошибка загрузки');
    
    allDishes = await res.json();
    renderFilterButtons();
    renderMenu();
  } catch (e) {
    console.error('Ошибка загрузки меню:', e);
    showNotice('Ошибка загрузки меню', 'error');
  }
}

// ============================================
// ФИЛЬТРАЦИЯ
// ============================================

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

// ============================================
// ОТРИСОВКА МЕНЮ
// ============================================

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
        <strong>${escapeHtml(dish.name)}</strong>
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

// Защита от XSS
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ============================================
// УПРАВЛЕНИЕ ДОСТУПНОСТЬЮ
// ============================================

async function toggleAvailability(dishId, isAvailable) {
  const token = getAuthToken();
  const userId = getUserId();
  
  if (!token || !userId) {
    showNotice('Сессия истекла', 'error');
    window.location.href = 'login.html';
    return;
  }
  
  try {
    const res = await fetch(`${API_URL}/dishes/${dishId}/availability`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ isAvailable: !isAvailable })
    });
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || 'Ошибка обновления');
    }
    
    showNotice(`Блюдо ${!isAvailable ? 'показано' : 'скрыто'}`, 'success');
    await loadMenu(); // Перезагружаем список
  } catch (e) {
    console.error('Ошибка:', e);
    showNotice(e.message || 'Ошибка обновления', 'error');
  }
}

// ============================================
// МОДАЛЬНОЕ ОКНО ДОБАВЛЕНИЯ БЛЮДА
// ============================================

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
  const token = getAuthToken();
  const userId = getUserId();
  
  if (!token || !userId) {
    showNotice('Сессия истекла', 'error');
    window.location.href = 'login.html';
    return;
  }
  
  const name = document.getElementById('dish-name').value;
  const description = document.getElementById('dish-description').value;
  const price = document.getElementById('dish-price').value;
  const categoryId = document.getElementById('dish-category').value;
  
  // Валидация
  if (!name || !name.trim()) {
    showNotice('Введите название блюда', 'error');
    return;
  }
  
  if (!price || parseFloat(price) <= 0) {
    showNotice('Введите корректную цену', 'error');
    return;
  }
  
  if (!categoryId) {
    showNotice('Выберите категорию', 'error');
    return;
  }
  
  try {
    const res = await fetch(`${API_URL}/dishes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        category_id: parseInt(categoryId),
        image_url: ''
      })
    });
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || 'Ошибка добавления');
    }
    
    showNotice('Блюдо добавлено', 'success');
    hideModal();
    await loadMenu(); // Перезагружаем список
  } catch (e) {
    console.error('Ошибка:', e);
    showNotice(e.message || 'Ошибка добавления блюда', 'error');
  }
}

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================

async function initManageMenu() {
  const sessionValid = await checkSession();
  if (!sessionValid) return;
  
  await loadCategories();
  await loadMenu();
  
  const addBtn = document.getElementById('add-dish-btn');
  if (addBtn) addBtn.onclick = showModal;
  
  const saveBtn = document.getElementById('save-dish-btn');
  if (saveBtn) saveBtn.onclick = saveDish;
  
  const cancelBtn = document.getElementById('cancel-dish-btn');
  if (cancelBtn) cancelBtn.onclick = hideModal;
  
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.onclick = hideModal;
}

// Запуск
initManageMenu();