const express = require('express');
const cors = require('cors');
const { sendApiError } = require('./errors');
const { isValidPhone, isPositiveInteger, parseId, isValidOrderItems } = require('./validation');

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
    sendApiError(e, res);
  }
});

// Шаг 2: Подтверждение кода
app.post('/api/verify', async (req, res) => {
  try {
    const { phone, code } = req.body || {};

    if (!isValidPhone(phone)) {
      return res.status(400).json({ error: 'Введите корректный номер телефона' });
    }
    
    if (typeof code !== 'string' || !/^\d{4}$/.test(code)) {
      return res.status(400).json({ error: 'Код должен содержать 4 цифры' });
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
    sendApiError(e, res);
  }
});

app.get('/api/users/:userId', async (req, res) => {
  try {
    const userId = parseId(req.params.userId);
    if (!isPositiveInteger(userId)) {
      return res.status(400).json({ error: 'Некорректный ID пользователя' });
    }
    const user = await DatabaseAdapter.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    res.json(user);
  } catch (e) {
    sendApiError(e, res);
  }
});


app.get('/api/categories', async (req, res) => {
  try {
    const categories = await DatabaseAdapter.getCategories();
    res.json(categories);
  } catch (e) {
    sendApiError(e, res);
  }
});


app.get('/api/branches', async (req, res) => {
  try {
    res.json(await DatabaseAdapter.getBranches());
  } catch (e) {
    sendApiError(e, res);
  }
});

// Меню для клиента (только доступные блюда в выбранной точке)
app.get('/api/menu', async (req, res) => {
  try {
    const branchId = parseId(req.query.branchId);
    if (!isPositiveInteger(branchId)) {
      return res.status(400).json({ error: 'Некорректный ID ресторана' });
    }
    if (!await DatabaseAdapter.getBranchById(branchId)) {
      return res.status(404).json({ error: 'Ресторан не найден' });
    }
    const dishes = await DatabaseAdapter.getMenuByBranch(branchId);
    res.json(dishes);
  } catch (e) {
    sendApiError(e, res);
  }
});


// Создание заказа (клиент)
app.post('/api/orders', async (req, res) => {
  try {
    const { userId, branchId, items } = req.body || {};
    if (!isPositiveInteger(userId)) {
      return res.status(400).json({ error: 'Некорректный ID пользователя' });
    }
    
    if (!isPositiveInteger(branchId)) {
      return res.status(400).json({ error: 'Некорректный ID ресторана' });
    }
    
    if (!isValidOrderItems(items)) {
      return res.status(400).json({ error: 'Корзина пуста или содержит некорректные позиции' });
    }
    
    const order = await OrderFacade.createOrder(userId, branchId, items);
    res.status(201).json(order);
  } catch (e) {
    sendApiError(e, res);
  }
});

// Заказы пользователя (клиент)
app.get('/api/users/:userId/orders', async (req, res) => {
  try {
    const userId = parseId(req.params.userId);
    if (!isPositiveInteger(userId)) {
      return res.status(400).json({ error: 'Некорректный ID пользователя' });
    }
    if (!await DatabaseAdapter.getUserById(userId)) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    const orders = await DatabaseAdapter.getUserOrders(userId);
    res.json(orders);
  } catch (e) {
    sendApiError(e, res);
  }
});


app.get('/api/users/:userId/orders/:orderId', async (req, res) => {
  try {
    const userId = parseId(req.params.userId);
    const orderId = parseId(req.params.orderId);
    res.json(await OrderFacade.getUserOrder(orderId, userId));
  } catch (e) {
    sendApiError(e, res);
  }
});

app.get('/api/users/:userId/orders/:orderId/items', async (req, res) => {
  try {
    const userId = parseId(req.params.userId);
    const orderId = parseId(req.params.orderId);
    res.json(await OrderFacade.getUserOrderItems(orderId, userId));
  } catch (e) {
    sendApiError(e, res);
  }
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'Сервер работает', time: new Date().toISOString() });
});

app.post('/api/users/:userId/orders/:orderId/cancel', async (req, res) => {
  try {
    const userId = parseId(req.params.userId);
    const orderId = parseId(req.params.orderId);
    res.json(await OrderFacade.cancelOrder(orderId, userId));
  } catch (e) {
    sendApiError(e, res);
  }
});

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});

const PORT = 3000;
app.use((error, req, res, next) => {
  sendApiError(error, res);
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
    console.log(`Test: http://localhost:${PORT}/api/test`);
  });
}

module.exports = app;
