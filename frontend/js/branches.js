const API_URL = getApiUrl();
async function loadBranches() {
  const div = document.getElementById('branches');
  if (!div) return;

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
      el.innerHTML = `
        <h3>${branch.name}</h3>
        <p>${branch.address}</p>
        <p>${branch.working_hours}</p>
        <button type="button" onclick='selectBranch(${branch.id})'>Выбрать</button>
      `;
      div.appendChild(el);
    });
  } catch (e) {
    div.innerHTML = '';
    showNotice('Ошибка сети при загрузке точек', 'error');
  }
}
function selectBranch(id) {
localStorage.setItem('branchId', id);
showNotice('Точка выбрана', 'success');
window.location.href = 'cart.html';
}
loadBranches();
