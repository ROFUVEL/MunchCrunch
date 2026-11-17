const DatabaseAdapter = require('../adapters/DatabaseAdapter');
const app = require('../server');

jest.mock('../adapters/DatabaseAdapter');

let server;
let baseUrl;

beforeAll(async () => {
  await new Promise(resolve => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
});

afterAll(async () => {
  await new Promise(resolve => server.close(resolve));
});

beforeEach(() => {
  jest.resetAllMocks();
  DatabaseAdapter.getUserById.mockResolvedValue({ id: 1 });
  DatabaseAdapter.getBranchById.mockResolvedValue({ id: 1 });
});

test('Отсутствующий ресторан возвращает 404, существующий с пустым меню — 200', async () => {
  DatabaseAdapter.getBranchById.mockResolvedValueOnce(null);
  const missing = await fetch(baseUrl + '/menu?branchId=999');
  expect(missing.status).toBe(404);
  DatabaseAdapter.getMenuByBranch.mockResolvedValue([]);
  const empty = await fetch(baseUrl + '/menu?branchId=1');
  expect(empty.status).toBe(200);
  expect(await empty.json()).toEqual([]);
});

test('История отсутствующего пользователя возвращает 404', async () => {
  DatabaseAdapter.getUserById.mockResolvedValue(null);
  const response = await fetch(baseUrl + '/orders/999');
  expect(response.status).toBe(404);
  expect(DatabaseAdapter.getUserOrders).not.toHaveBeenCalled();
});

test.each(['getUserById', 'getBranchById'])(
  'Оформление возвращает 404 при отсутствии объекта: %s', async method => {
    DatabaseAdapter[method].mockResolvedValue(null);
    const response = await fetch(baseUrl + '/orders', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 1, branchId: 1, items: [{ dishId: 1, quantity: 1 }] })
    });
    expect(response.status).toBe(404);
    expect(DatabaseAdapter.createFullOrder).not.toHaveBeenCalled();
  }
);

test('Неизвестный маршрут API возвращает JSON с ошибкой 404', async () => {
  const response = await fetch(baseUrl + '/unknown');
  expect(response.status).toBe(404);
  expect(await response.json()).toEqual({ error: 'Маршрут не найден' });
});

test('Созданный заказ можно отменить', async () => {
  DatabaseAdapter.getOrderById.mockResolvedValue({ id: 10, user_id: 1, status: 'created' });
  DatabaseAdapter.cancelCreatedOrder.mockResolvedValue({ id: 10, user_id: 1, status: 'cancelled' });
  const response = await fetch(baseUrl + '/users/1/orders/10/cancel', { method: 'POST' });
  expect(response.status).toBe(200);
  expect((await response.json()).status).toBe('cancelled');
  expect(DatabaseAdapter.cancelCreatedOrder).toHaveBeenCalledWith(10, 1);
});

test.each(['cooking', 'ready', 'issued', 'cancelled'])(
  'Заказ в статусе %s нельзя отменить', async status => {
    DatabaseAdapter.getOrderById.mockResolvedValue({ id: 10, user_id: 1, status });
    const response = await fetch(baseUrl + '/users/1/orders/10/cancel', { method: 'POST' });
    expect(response.status).toBe(409);
    expect(DatabaseAdapter.cancelCreatedOrder).not.toHaveBeenCalled();
  }
);

test.each([
  ['0', null, 400], ['10', null, 404],
  ['10', { id: 10, user_id: 2, status: 'created' }, 403]
])('Отмена заказа %s проверяет данные и владельца', async (id, order, status) => {
  DatabaseAdapter.getOrderById.mockResolvedValue(order);
  const response = await fetch(baseUrl + `/users/1/orders/${id}/cancel`, { method: 'POST' });
  expect(response.status).toBe(status);
  expect(await response.json()).toEqual({ error: expect.any(String) });
  expect(DatabaseAdapter.cancelCreatedOrder).not.toHaveBeenCalled();
});

test('Отмена не перезаписывает статус, изменившийся после проверки', async () => {
  DatabaseAdapter.getOrderById.mockResolvedValue({ id: 10, user_id: 1, status: 'created' });
  DatabaseAdapter.cancelCreatedOrder.mockResolvedValue(undefined);
  const response = await fetch(baseUrl + '/users/1/orders/10/cancel', { method: 'POST' });
  expect(response.status).toBe(409);
});

test('Состав заказа содержит сохранённые цены и количество', async () => {
  DatabaseAdapter.getOrderById.mockResolvedValue({ id: 10, user_id: 1 });
  const items = [{ id: 1, order_id: 10, dish_id: 2, name: 'Бургер', quantity: 2, price: '310.00' }];
  DatabaseAdapter.getOrderItems.mockResolvedValue(items);
  const response = await fetch(baseUrl + '/users/1/orders/10/items');
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual(items);
  expect(DatabaseAdapter.getOrderItems).toHaveBeenCalledWith(10);
});

test.each([
  ['/users/0/orders/10/items', null, 400],
  ['/users/1/orders/abc/items', null, 400],
  ['/users/1/orders/10/items', null, 404],
  ['/users/1/orders/10/items', { id: 10, user_id: 2 }, 403]
])('Состав заказа: %s возвращает ошибку %s %s', async (url, order, status) => {
  DatabaseAdapter.getOrderById.mockResolvedValue(order);
  const response = await fetch(baseUrl + url);
  expect(response.status).toBe(status);
  expect(await response.json()).toEqual({ error: expect.any(String) });
  expect(DatabaseAdapter.getOrderItems).not.toHaveBeenCalled();
});

test('Недоступное блюдо возвращает 400 с понятным сообщением', async () => {
  DatabaseAdapter.getMenuByBranch.mockResolvedValue([]);
  const response = await fetch(baseUrl + '/orders', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 1, branchId: 1, items: [{ dishId: 1, quantity: 1 }] })
  });
  expect(response.status).toBe(400);
  expect((await response.json()).error).toContain('недоступно');
  expect(DatabaseAdapter.createFullOrder).not.toHaveBeenCalled();
});

test('Внутренняя ошибка записывается в консоль, но не раскрывается клиенту', async () => {
  const error = new Error('password=secret; SQL SELECT * FROM users');
  DatabaseAdapter.getBranches.mockRejectedValue(error);
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    const response = await fetch(baseUrl + '/branches');
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Ошибка сервера. Попробуйте позже.' });
    expect(log).toHaveBeenCalledWith('API error:', error);
  } finally {
    log.mockRestore();
  }
});

test('Некорректный JSON возвращает 400 в формате JSON', async () => {
  const response = await fetch(baseUrl + '/orders', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{'
  });
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ error: 'Некорректный JSON в запросе' });
});

test('Несуществующая ссылка в заказе возвращает 400 без подробностей БД', async () => {
  DatabaseAdapter.getMenuByBranch.mockResolvedValue([{ id: 1, price: 100 }]);
  DatabaseAdapter.createFullOrder.mockRejectedValue({ code: '23503', detail: 'users constraint' });
  const response = await fetch(baseUrl + '/orders', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 100, branchId: 1, items: [{ dishId: 1, quantity: 1 }] })
  });
  expect(response.status).toBe(400);
  expect((await response.json()).error).not.toContain('constraint');
});

test.each(['0', '-1', '1.5', '1abc', '2147483648', 'true'])(
  'Некорректный ID %s отклоняется до обращения к БД', async (id) => {
    for (const route of [`/users/${id}`, `/orders/${id}`, `/menu?branchId=${id}`]) {
      const response = await fetch(baseUrl + route);
      expect(response.status).toBe(400);
    }
    expect(DatabaseAdapter.getUserById).not.toHaveBeenCalled();
    expect(DatabaseAdapter.getUserOrders).not.toHaveBeenCalled();
    expect(DatabaseAdapter.getMenuByBranch).not.toHaveBeenCalled();
  }
);

test.each([
  { userId: '1' }, { branchId: true }, { branchId: 1.5 },
  { items: {} }, { items: [null] },
  { items: [{ dishId: '1', quantity: 1 }] },
  { items: [{ dishId: 1, quantity: 1.5 }] },
  { items: [{ dishId: 1, quantity: '2' }] },
  { items: [{ dishId: 1, quantity: 0 }] }
])('Некорректный заказ %j отклоняется', async (changes) => {
  const response = await fetch(baseUrl + '/orders', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 1, branchId: 1, items: [{ dishId: 1, quantity: 1 }], ...changes })
  });
  expect(response.status).toBe(400);
  expect(DatabaseAdapter.getMenuByBranch).not.toHaveBeenCalled();
  expect(DatabaseAdapter.createFullOrder).not.toHaveBeenCalled();
});

test.each([null, 79999999999, {}, [], 'abcdefghij', '123456789', '123456789012', '+79999999999', '7999999999\n'])(
  'Некорректный телефон %j отклоняется при входе и подтверждении', async (phone) => {
    for (const route of ['/login', '/verify']) {
      const response = await fetch(baseUrl + route, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: '1234' })
      });
      expect(response.status).toBe(400);
    }
    expect(DatabaseAdapter.getUserByPhone).not.toHaveBeenCalled();
    expect(DatabaseAdapter.verifyAuthCode).not.toHaveBeenCalled();
  }
);

test.each(['9999999999', '79999999999'])('Телефон %s принимается при подтверждении', async (phone) => {
  DatabaseAdapter.verifyAuthCode.mockResolvedValue(true);
  DatabaseAdapter.getUserByPhone.mockResolvedValue({ id: 1 });
  const response = await fetch(baseUrl + '/verify', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, code: '1234' })
  });
  expect(response.status).toBe(200);
});

test('Verification returns user ID without a token', async () => {
  DatabaseAdapter.verifyAuthCode.mockResolvedValue(true);
  DatabaseAdapter.getUserByPhone.mockResolvedValue({ id: 1, phone: '79999999999' });
  const response = await fetch(`${baseUrl}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '79999999999', code: '1234' })
  });
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({
    success: true, userId: 1
  });
});

test('Меню выбранного ресторана доступно клиенту', async () => {
  DatabaseAdapter.getMenuByBranch.mockResolvedValue([{ id: 1, name: 'Блюдо' }]);
  const response = await fetch(`${baseUrl}/menu?branchId=2`);
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual([{ id: 1, name: 'Блюдо' }]);
  expect(DatabaseAdapter.getMenuByBranch).toHaveBeenCalledWith(2);
});

test('Orders are available by user ID without a token', async () => {
  DatabaseAdapter.getUserOrders.mockResolvedValue([{ id: 10, user_id: 1 }]);
  const response = await fetch(baseUrl + '/orders/1');
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual([{ id: 10, user_id: 1 }]);
  expect(DatabaseAdapter.getUserOrders).toHaveBeenCalledWith(1);
});

test.each([['GET', '/check-session'], ['POST', '/logout']])('Removed endpoint: %s %s', async (method, url) => {
  const response = await fetch(baseUrl + url, { method });
  expect(response.status).toBe(404);
});

test.each([
  ['POST', '/dishes'],
  ['PATCH', '/dishes/1/availability'],
  ['GET', '/menu/all'],
  ['PATCH', '/orders/1/status']
])('Управляющий API удалён: %s %s', async (method, url) => {
  const response = await fetch(`${baseUrl}${url}`, {
    method
  });
  expect(response.status).toBe(404);
});


test('Order creation uses the user ID from the request body', async () => {
  DatabaseAdapter.getMenuByBranch.mockResolvedValue([{ id: 1, price: 100 }]);
  DatabaseAdapter.createFullOrder.mockResolvedValue({ id: 10, user_id: 2 });
  const response = await fetch(baseUrl + '/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 2, branchId: 1, items: [{ dishId: 1, quantity: 1 }] })
  });
  expect(response.status).toBe(201);
  expect(DatabaseAdapter.createFullOrder).toHaveBeenCalledWith(2, 1, expect.any(Array));
});

test('Order creation rejects a missing user ID', async () => {
  const response = await fetch(baseUrl + '/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ branchId: 1, items: [{ dishId: 1, quantity: 1 }] })
  });
  expect(response.status).toBe(400);
  expect(DatabaseAdapter.createFullOrder).not.toHaveBeenCalled();
});
