const API_URL = getApiUrl();

async function loadProfile() {
  const userId = localStorage.getItem('userId');
  const role = localStorage.getItem('role');
  
  if (!userId) {
    window.location.href = 'login.html';
    return;
  }
  
  if (role !== 'staff') {
    window.location.href = 'menu.html';
    return;
  }
  
  try {
    const res = await fetch(`${API_URL}/users/${userId}`);
    if (!res.ok) throw new Error('Ошибка загрузки');
    
    const user = await res.json();
    
    let branchInfo = null;
    if (user.branch_id) {
      const branchRes = await fetch(`${API_URL}/branches`);
      const branches = await branchRes.json();
      branchInfo = branches.find(b => b.id === user.branch_id);
    }
    
    renderProfile(user, branchInfo);
  } catch (e) {
    renderProfile({
      phone: localStorage.getItem('userPhone') || 'Не указан',
      role: role,
      branch_id: null
    }, null);
  }
}

function renderProfile(user, branchInfo) {
  const container = document.getElementById('profile');
  if (!container) return;
  
  let branchHtml = '';
  if (branchInfo) {
    branchHtml = `
      <p><strong>Филиал:</strong> ${branchInfo.name}</p>
      <p><strong>Адрес:</strong> ${branchInfo.address}</p>
      <p><strong>Часы работы:</strong> ${branchInfo.working_hours || 'Не указаны'}</p>
    `;
  } else if (user.branch_id) {
    branchHtml = `<p><strong>ID филиала:</strong> ${user.branch_id}</p>`;
  }
  
  container.innerHTML = `
    <div class="card">
      <h3>Информация о сотруднике</h3>
      <p><strong>Телефон:</strong> ${user.phone}</p>
      <p><strong>Роль:</strong> Сотрудник</p>
      ${branchHtml}
      
      <div class="actions" style="margin-top: 20px;">
        <button id="logout-btn" style="background: #8d1e1e;">Выйти</button>
      </div>
    </div>
  `;
  
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }
}

function logout() {
  localStorage.clear();
  showNotice('Вы вышли из системы', 'success');
  window.location.href = 'login.html';
}

loadProfile();