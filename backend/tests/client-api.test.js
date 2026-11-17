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

beforeEach(() => jest.resetAllMocks());

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
  expect(response.status).toBe(200);
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
