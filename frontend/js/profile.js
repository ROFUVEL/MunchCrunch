const userId = localStorage.getItem('userId');
const role = localStorage.getItem('role');
const div = document.getElementById('profile');
const branchId = localStorage.getItem('branchId');

if (!div) return;

if (!userId) {
  div.innerHTML = `
    <div class="card">
      <p>Вы не авторизованы</p>
      <button type="button" onclick="location.href='login.html'">Войти</button>
    </div>
  `;
} else {
  div.innerHTML = `
    <div class="card">
      <p><strong>ID:</strong> ${userId}</p>
      <p><strong>Роль:</strong> ${role || '—'}</p>
      <p><strong>Точка:</strong> ${branchId || 'не выбрана'}</p>
      <div class="actions">
        <button type="button" onclick="logout()">Выйти</button>
      </div>
    </div>
  `;
}
function logout() {
localStorage.clear();
showNotice('Вы вышли', 'success');
window.location.href = 'login.html';
}
