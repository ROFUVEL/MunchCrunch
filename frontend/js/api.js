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

async function authFetch(url, options = {}) {
  const token = getAuthToken();
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
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
  
  if (res.status === 401) {
    
    localStorage.clear();
    window.location.href = 'login.html';
    throw new Error('Сессия истекла');
  }
  
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
  const token = getAuthToken();
  const userId = getUserId();
  
  if (!token || !userId) {
    throw new Error('Не авторизован');
  }
  
  const res = await authFetch('/orders', {
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
  const token = getAuthToken();
  const userId = getUserId();
  
  if (!token || !userId) {
    throw new Error('Не авторизован');
  }
  
  const res = await authFetch(`/orders/${userId}`);
  
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
  const token = getAuthToken();
  const userId = getUserId();
  
  if (!token || !userId) {
    throw new Error('Не авторизован');
  }
  
  const res = await authFetch(`/users/${userId}`);
  
  if (!res.ok) {
    throw new Error('Ошибка загрузки профиля');
  }
  
  return res.json();
}


async function logout() {
  const token = getAuthToken();
  
  if (token) {
    try {
      await authFetch('/logout', { method: 'POST' });
    } catch (e) {
      console.error('Ошибка при выходе:', e);
    }
  }
  
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = 'login.html';
}
