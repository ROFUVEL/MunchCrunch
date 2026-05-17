const API_URL = getApiUrl();

async function login() {

  const phone =
    document.getElementById('phone').value;

  const isStaff =
    document.getElementById('isStaff').checked;

  try {

    if (!phone) {
      showNotice('Введите номер телефона', 'error');
      return;
    }

    const res = await fetch(
      `${API_URL}/login`,
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({
          phone,
          isStaff
        })
      }
    );

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.error) {
      showNotice(data.error || 'Ошибка входа', 'error');
      return;
    }

    localStorage.setItem(
      'userId',
      data.id
    );

    localStorage.setItem(
      'role',
      data.role
    );


    if (data.role === 'staff') {

      window.location.href =
        'staff.html';

    } else {

      window.location.href =
        'menu.html';
    }

  } catch (e) {

    showNotice('Ошибка сервера', 'error');
  }
}

function initLoginPage() {
  const btn = document.getElementById('login-btn');
  if (btn) btn.addEventListener('click', login);

  const clearBtn = document.getElementById('clear-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      const phoneEl = document.getElementById('phone');
      const staffEl = document.getElementById('isStaff');
      if (phoneEl) phoneEl.value = '';
      if (staffEl) staffEl.checked = false;
    });
  }
}

initLoginPage();
