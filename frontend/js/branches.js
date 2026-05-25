const API_URL = getApiUrl();

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
        // Точка выбрана — показываем неактивную кнопку с текстом "Выбрано"
        const selectedBtn = document.createElement('button');
        selectedBtn.innerText = '✓ Выбрано';
        selectedBtn.disabled = true;
        selectedBtn.style.background = '#aaa';
        selectedBtn.style.cursor = 'not-allowed';
        buttonContainer.appendChild(selectedBtn);
      } else {
        // Точка не выбрана — показываем активную кнопку
        const selectBtn = document.createElement('button');
        selectBtn.innerText = 'Выбрать';
        selectBtn.onclick = () => selectBranch(branch.id);
        buttonContainer.appendChild(selectBtn);
      }
      
      el.appendChild(buttonContainer);
      div.appendChild(el);
    });
    
    // Показываем уведомление, если точка уже выбрана
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
  // Перезагружаем страницу, чтобы обновить состояние кнопок
  loadBranches();
}

loadBranches();