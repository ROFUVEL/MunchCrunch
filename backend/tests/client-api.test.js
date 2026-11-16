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

test('Подтверждение входа возвращает клиентскую сессию', async () => {
  DatabaseAdapter.verifyAuthCode.mockResolvedValue(true);
  DatabaseAdapter.getUserByPhone.mockResolvedValue({ id: 1, phone: '79999999999' });
  const response = await fetch(`${baseUrl}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '79999999999', code: '1234' })
  });
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({
    success: true, userId: 1, token: expect.any(String)
  });
  expect(DatabaseAdapter.createSession).toHaveBeenCalledWith(1, expect.any(String));
});

test('Меню выбранного ресторана доступно клиенту', async () => {
  DatabaseAdapter.getMenuByBranch.mockResolvedValue([{ id: 1, name: 'Блюдо' }]);
  const response = await fetch(`${baseUrl}/menu?branchId=2`);
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual([{ id: 1, name: 'Блюдо' }]);
  expect(DatabaseAdapter.getMenuByBranch).toHaveBeenCalledWith(2);
});

test('Клиент видит только свои заказы', async () => {
  DatabaseAdapter.getSession.mockResolvedValue({ user_id: 1 });
  DatabaseAdapter.getUserOrders.mockResolvedValue([{ id: 10, user_id: 1 }]);
  const options = { headers: { Authorization: 'Bearer token' } };
  const own = await fetch(`${baseUrl}/orders/1`, options);
  expect(own.status).toBe(200);
  expect(await own.json()).toEqual([{ id: 10, user_id: 1 }]);
  const other = await fetch(`${baseUrl}/orders/2`, options);
  expect(other.status).toBe(403);
  expect(DatabaseAdapter.getUserOrders).toHaveBeenCalledTimes(1);
});

test.each([
  ['POST', '/dishes'],
  ['PATCH', '/dishes/1/availability'],
  ['GET', '/menu/all'],
  ['PATCH', '/orders/1/status']
])('Управляющий API удалён: %s %s', async (method, url) => {
  const response = await fetch(`${baseUrl}${url}`, {
    method, headers: { Authorization: 'Bearer token' }
  });
  expect(response.status).toBe(404);
});
