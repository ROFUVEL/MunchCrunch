const API_URL = getApiUrl();
async function createDish() {
  const role = localStorage.getItem('role');
  const userId = localStorage.getItem('userId');

  if (role !== 'staff' || !userId) {
    showNotice('Нет доступа', 'error');
    window.location.href = 'menu.html';
    return;
  }

  const name = document.getElementById('name').value;
  const description = document.getElementById('description').value;
  const price = document.getElementById('price').value;
  const category_id = document.getElementById('category').value;

  if (!name || !price) {
    showNotice('Заполните название и цену', 'error');
    return;
  }

  const dish = {
    userId,
    name,
    description,
    price,
    category_id
  };

  try {
    const res = await fetch(`${API_URL}/dishes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dish)
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      showNotice(data.error || 'Не удалось добавить блюдо', 'error');
      return;
    }

    showNotice('Блюдо добавлено', 'success');
    clearFields();
  } catch (e) {
    showNotice('Ошибка сети при добавлении блюда', 'error');
  }
}

function clearFields() {
  const fields = ['name', 'description', 'price', 'category'];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}

function initAddDishPage() {
  const role = localStorage.getItem('role');
  const userId = localStorage.getItem('userId');
  if (role !== 'staff' || !userId) {
    window.location.href = 'menu.html';
    return;
  }

  const createBtn = document.getElementById('create-dish');
  if (createBtn) createBtn.addEventListener('click', createDish);

  const clearBtn = document.getElementById('clear-dish');
  if (clearBtn) clearBtn.addEventListener('click', clearFields);
}

initAddDishPage();
