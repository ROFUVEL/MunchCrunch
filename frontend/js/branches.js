const API_URL = getApiUrl();

async function checkSession() {
  const token = localStorage.getItem('sessionToken');
  
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

async function loadBranches() {
  const div = document.getElementById('branches');
  if (!div) return;

  const selectedBranchId = localStorage.getItem('branchId');
  div.innerHTML = '<p class="muted">Загрузка...</p>';

  try {
    const res = await fetch(`${API_URL}/branches`);
    if (!res.ok) {
      div.innerHTML = '';
      showNotice('Не удалось загрузить точки', 'error');
      return;
    }

    const branches = await res.json();
    if (!Array.isArray(branches) || branches.length === 0) {
      div.innerHTML = '<p class="muted">Точек пока нет</p>';
      return;
    }

    div.innerHTML = '';

    branches.forEach(branch => {
      const el = document.createElement('div');
      el.className = 'card';
      
      const isSelected = selectedBranchId && Number(selectedBranchId) === branch.id;
      
      el.innerHTML = `
        <h3>${branch.name}</h3>
        <p>${branch.address}</p>
        <p>${branch.working_hours || 'Часы работы не указаны'}</p>
      `;
      
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'actions';
      
      if (isSelected) {
        const selectedBtn = document.createElement('button');
        selectedBtn.innerText = '✓ Выбрано';
        selectedBtn.disabled = true;
        buttonContainer.appendChild(selectedBtn);
      } else {
        const selectBtn = document.createElement('button');
        selectBtn.innerText = 'Выбрать';
        selectBtn.onclick = () => selectBranch(branch.id);
        buttonContainer.appendChild(selectBtn);
      }
      
      el.appendChild(buttonContainer);
      div.appendChild(el);
    });
    
    if (selectedBranchId) {
      const selectedBranch = branches.find(b => b.id === Number(selectedBranchId));
      if (selectedBranch) {
        showNotice(`Текущая точка: ${selectedBranch.name}`, 'info');
      }
    }
    
  } catch (e) {
    div.innerHTML = '';
    showNotice('Ошибка сети при загрузке точек', 'error');
  }
}

function selectBranch(id) {
  localStorage.setItem('branchId', id);
  showNotice('Точка выбрана', 'success');
  loadBranches(); 
}

function goToCart() {
  const branchId = localStorage.getItem('branchId');
  if (!branchId) {
    showNotice('Сначала выберите точку', 'error');
    return;
  }
  window.location.href = 'cart.html';
}

async function logout() {
  const token = localStorage.getItem('sessionToken');
  
  if (token) {
    try {
      await fetch(`${API_URL}/logout`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (e) {
      console.error('Ошибка при выходе:', e);
    }
  }
  
  localStorage.clear();
  sessionStorage.clear();
  showNotice('Вы вышли из системы', 'success');
  window.location.href = 'login.html';
}

async function initBranchesPage() {
  const sessionValid = await checkSession();
  if (!sessionValid) return;
  
  await loadBranches();
  
  const cartBtn = document.getElementById('go-to-cart');
  if (cartBtn) {
    cartBtn.addEventListener('click', goToCart);
  }
  
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }
}

initBranchesPage();