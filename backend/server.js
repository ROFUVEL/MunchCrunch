const express = require('express');
const cors = require('cors');

const DatabaseAdapter = require('./adapters/DatabaseAdapter');
const OrderFacade = require('./facades/OrderFacade');
const MenuFacade = require('./facades/MenuFacade');
const StaffFacade = require('./facades/StaffFacade');
const AuthFacade = require('./facades/AuthFacade');
const BranchFacade = require('./facades/BranchFacade');
const DishFacade = require('./facades/DishFacade');

const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/login', async (req, res) => {

  try {

    const { phone, isStaff } = req.body;

    const user = await AuthFacade.login(
      phone,
      isStaff
    );

    res.json(user);

  } catch (e) {

    res.status(403).json({
      error: e.message
    });
  }
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'Сервер работает' });
});

app.get('/api/test-user', async (req, res) => {
  try {
    const user = await AuthFacade.login("111111111", false);
    res.json(user);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { userId, branchId, items } = req.body;

    const order = await OrderFacade.createOrder(
      userId,
      branchId,
      items
    );

    res.json(order);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/orders/:userId', async (req, res) => {
  try {
    const orders = await OrderFacade.getUserOrders(req.params.userId);
    res.json(orders);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/menu', async (req, res) => {
  try {
    const dishes = await MenuFacade.getMenu();
    res.json(dishes);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/staff/orders/:userId', async (req, res) => {
  try {
    const orders = await StaffFacade.getMyOrders(req.params.userId);
    res.json(orders);
  } catch (e) {
    res.status(403).json({ error: e.message });
  }
});

app.post('/api/staff/order-status', async (req, res) => {
  try {
    const { userId, orderId, status } = req.body;

    const order = await StaffFacade.updateOrderStatus(
      userId,
      orderId,
      status
    );

    res.json(order);
  } catch (e) {
    res.status(403).json({ error: e.message });
  }
});

app.get('/api/branches', async (req, res) => {
  try {
    res.json(await BranchFacade.getBranches());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


app.post('/api/dishes', async (req, res) => {
  try {
    const { userId, ...dish } = req.body || {};
    res.json(await DishFacade.createDish(userId, dish));
  } catch (e) {
    const status = e.message === 'Нет доступа' ? 403 : 500;
    res.status(status).json({ error: e.message });
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

// Скрыть/показать блюдо
app.patch('/api/dishes/:dishId/availability', async (req, res) => {
  try {
    const { dishId } = req.params;
    const { isAvailable } = req.body;
    const dish = await DatabaseAdapter.updateDishAvailability(dishId, isAvailable);
    res.json(dish);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Получить все категории (для формы добавления)
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await DatabaseAdapter.getCategories();
    res.json(categories);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Получить все блюда для сотрудника (включая скрытые)
// Получить все блюда для сотрудника (включая скрытые)
app.get('/api/menu/all', async (req, res) => {
  try {
    const dishes = await DatabaseAdapter.getAllDishes();
    res.json(dishes);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});

