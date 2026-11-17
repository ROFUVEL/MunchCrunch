const express = require('express');
const cors = require('cors');
const { isValidPhone } = require('./validation');

const DatabaseAdapter = require('./adapters/DatabaseAdapter');
const OrderFacade = require('./facades/OrderFacade');

const app = express();

app.use(cors());
app.use(express.json());


app.post('/api/login', async (req, res) => {
  try {
    const { phone } = req.body || {};
    
    if (!isValidPhone(phone)) {
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
    const { phone, code } = req.body || {};

    if (!isValidPhone(phone)) {
      return res.status(400).json({ error: 'Введите корректный номер телефона' });
    }
    
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
    
    res.json({
      success: true,
      userId: user.id
    });
    
  } catch (e) {
    console.error('Verify error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/users/:userId', async (req, res) => {
  try {
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
app.post('/api/orders', async (req, res) => {
  try {
    const { userId, branchId, items } = req.body;
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ error: 'Invalid userId' });
    }
    
    if (!branchId) {
      return res.status(400).json({ error: 'Не указан филиал' });
    }
    
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Корзина пуста' });
    }
    
    const order = await OrderFacade.createOrder(userId, branchId, items);
    res.json(order);
  } catch (e) {
    console.error('Order creation error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Заказы пользователя (клиент)
app.get('/api/orders/:userId', async (req, res) => {
  try {
    const orders = await DatabaseAdapter.getUserOrders(parseInt(req.params.userId));
    res.json(orders);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


app.get('/api/test', (req, res) => {
  res.json({ message: 'Сервер работает', time: new Date().toISOString() });
});

const PORT = 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
    console.log(`Test: http://localhost:${PORT}/api/test`);
  });
}

module.exports = app;
