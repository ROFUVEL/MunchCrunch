const API_URL = getApiUrl();

function getUserId() {
  return localStorage.getItem('userId');
}

function getSelectedBranch() {
  return localStorage.getItem('branchId');
}

async function apiFetch(url, options = {}) {
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...(options.headers || {})
    }
  };
  
  const res = await fetch(`${API_URL}${url}`, mergedOptions);
  
  
  return res;
}

async function getMenu() {
  const branchId = getSelectedBranch();
  
  if (!branchId) {
    throw new Error('Филиал не выбран');
  }
  
  const res = await fetch(`${API_URL}/menu?branchId=${branchId}`);
  
  if (!res.ok) {
    throw new Error('Ошибка загрузки меню');
  }
  
  return res.json();
}

async function getBranches() {
  const res = await fetch(`${API_URL}/branches`);
  
  if (!res.ok) {
    throw new Error('Ошибка загрузки филиалов');
  }
  
  return res.json();
}

async function createOrder(data) {
  const userId = getUserId();
  
  if (!userId) {
    throw new Error('Не авторизован');
  }
  
  const res = await apiFetch('/orders', {
    method: "POST",
    body: JSON.stringify({
      userId: parseInt(userId),
      branchId: data.branchId || getSelectedBranch(),
      items: data.items
    })
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || 'Ошибка создания заказа');
  }
  
  return res.json();
}

async function getUserOrders() {
  const userId = getUserId();
  
  if (!userId) {
    throw new Error('Не авторизован');
  }
  
  const res = await apiFetch(`/users/${userId}/orders`);
  
  if (!res.ok) {
    throw new Error('Ошибка загрузки заказов');
  }
  
  return res.json();
}

async function getCategories() {
  const res = await fetch(`${API_URL}/categories`);
  
  if (!res.ok) {
    throw new Error('Ошибка загрузки категорий');
  }
  
  return res.json();
}

async function getUserProfile() {
  const userId = getUserId();
  
  if (!userId) {
    throw new Error('Не авторизован');
  }
  
  const res = await apiFetch(`/users/${userId}`);
  
  if (!res.ok) {
    throw new Error('Ошибка загрузки профиля');
  }
  
  return res.json();
}


function logout() {
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = 'login.html';
}
