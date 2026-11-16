const express = require('express');
const cors = require('cors');

const DatabaseAdapter = require('./adapters/DatabaseAdapter');
const OrderFacade = require('./facades/OrderFacade');

const app = express();

app.use(cors());
app.use(express.json());


function generateSessionToken() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) +
         Date.now().toString(36);
}

// Middleware для проверки сессии
async function checkSession(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Не авторизован' });
  }
  
  const session = await DatabaseAdapter.getSession(token);
  if (!session) {
    return res.status(401).json({ error: 'Сессия истекла или недействительна' });
  }
  
  req.userId = session.user_id;
  next();
}


// Шаг 1: Логин (только проверка телефона)
app.post('/api/login', async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone || phone.length < 10) {
      return res.status(400).json({ error: 'Введите корректный номер телефона' });
    }
    
    // Проверяем или создаем пользователя
    let user = await DatabaseAdapter.getUserByPhone(phone);
    if (!user) {
      user = await DatabaseAdapter.createClient(phone);
    }
    
    // Генерируем код (для курсовой всегда 1234)
    const code = '1234';
    
    // Сохраняем код в БД
    await DatabaseAdapter.saveAuthCode(phone, code);
    
    console.log(`[2FA] Код для ${phone}: ${code}`);
    
    res.json({ 
      success: true,
      message: 'Код подтверждения отправлен',
      phone: phone 
    });
    
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Шаг 2: Подтверждение кода
app.post('/api/verify', async (req, res) => {
  try {
    const { phone, code } = req.body;
    
    if (!phone || !code) {
      return res.status(400).json({ error: 'Телефон и код обязательны' });
    }
    
    // Проверяем код
    const isValid = await DatabaseAdapter.verifyAuthCode(phone, code);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Неверный или просроченный код' });
    }
    
    // Получаем пользователя
    const user = await DatabaseAdapter.getUserByPhone(phone);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    // Генерируем токен сессии
    const token = generateSessionToken();
    
    // Сохраняем сессию
    await DatabaseAdapter.createSession(user.id, token);
    
    res.json({
      success: true,
      userId: user.id,
      token: token
    });
    
  } catch (e) {
    console.error('Verify error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Проверка сессии (для защищенных страниц)
app.get('/api/check-session', checkSession, async (req, res) => {
  res.json({ 
    valid: true, 
    userId: req.userId
  });
});

// Выход
app.post('/api/logout', checkSession, async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    await DatabaseAdapter.deleteSession(token);
    res.json({ message: 'Выход выполнен' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// Получить пользователя (для профиля)
app.get('/api/users/:userId', checkSession, async (req, res) => {
  try {
    if (req.userId != req.params.userId) {
      return res.status(403).json({ error: 'Нет доступа к чужому профилю' });
    }
    const user = await DatabaseAdapter.getUserById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


app.get('/api/categories', async (req, res) => {
  try {
    const categories = await DatabaseAdapter.getCategories();
    res.json(categories);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


app.get('/api/branches', async (req, res) => {
  try {
    res.json(await DatabaseAdapter.getBranches());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Меню для клиента (только доступные блюда в выбранной точке)
app.get('/api/menu', async (req, res) => {
  try {
    const branchId = req.query.branchId;
    if (!branchId) {
      return res.status(400).json({ error: 'Не указан филиал' });
    }
    const dishes = await DatabaseAdapter.getMenuByBranch(parseInt(branchId));
    res.json(dishes);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// Создание заказа (клиент)
app.post('/api/orders', checkSession, async (req, res) => {
  try {
    const { branchId, items } = req.body;
    
    if (!branchId) {
      return res.status(400).json({ error: 'Не указан филиал' });
    }
    
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Корзина пуста' });
    }
    
    const order = await OrderFacade.createOrder(req.userId, branchId, items);
    res.json(order);
  } catch (e) {
    console.error('Order creation error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Заказы пользователя (клиент)
app.get('/api/orders/:userId', checkSession, async (req, res) => {
  try {
    if (req.userId != req.params.userId) {
      return res.status(403).json({ error: 'Нет доступа к чужим заказам' });
    }
    const orders = await DatabaseAdapter.getUserOrders(parseInt(req.params.userId));
    res.json(orders);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


app.get('/api/test', (req, res) => {
  res.json({ message: 'Сервер работает', time: new Date().toISOString() });
});

app.get('/api/test-user', async (req, res) => {
  try {
    const user = await DatabaseAdapter.getUserByPhone("78908908989");
    res.json(user);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

const PORT = 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
    console.log(`Test: http://localhost:${PORT}/api/test`);
  });
}

module.exports = app;
