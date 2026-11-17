const fs = require('fs');
const path = require('path');
const vm = require('vm');

const source = fs.readFileSync(
  path.join(__dirname, '../../frontend/js/cart.js'), 'utf8'
);

function createPage() {
  const storage = new Map();
  const page = vm.createContext({
    getApiUrl: () => '/api',
    localStorage: {
      getItem: key => storage.get(key) || null,
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: key => storage.delete(key)
    },
    window: { location: {} },
    fetch: jest.fn(),
    showNotice: jest.fn(),
    console,
    setTimeout: jest.fn()
  });
  vm.runInContext(source, page);
  // Для этих проверок достаточно логики корзины без отрисовки HTML.
  vm.runInContext('renderCart = () => {};', page);
  storage.set('userId', '1');
  storage.set('branchId', '2');
  page.saveCart([
    { dishId: 1, name: 'Бургер', price: 290, quantity: 2 },
    { dishId: 2, name: 'Десерт', price: 200, quantity: 1 }
  ]);
  return page;
}

test('Смена ресторана обновляет цену и сохраняет недоступные блюда и количество', async () => {
  const page = createPage();
  page.fetch.mockResolvedValue({ ok: true, json: async () => [{ id: 1, name: 'Бургер', price: '310.00' }] });

  expect(await page.refreshCart()).toBe(true);
  expect(page.fetch).toHaveBeenCalledWith('/api/menu?branchId=2');
  expect(page.getCart()).toEqual([
    { dishId: 1, name: 'Бургер', price: '310.00', quantity: 2 },
    { dishId: 2, name: 'Десерт', price: 200, quantity: 1 }
  ]);
  await page.checkout();
  expect(page.fetch.mock.calls.every(([url]) => url.startsWith('/api/menu'))).toBe(true);

  // В другом ресторане ранее недоступное блюдо снова можно заказать.
  page.localStorage.setItem('branchId', '3');
  page.fetch.mockResolvedValue({ ok: true, json: async () => [
    { id: 1, name: 'Бургер', price: 300 },
    { id: 2, name: 'Десерт', price: 210 }
  ] });
  await page.refreshCart();
  expect(vm.runInContext('availableDishIds', page)).toEqual([1, 2]);
  expect(page.getCart()[1].price).toBe(210);
});

test('Ошибка проверки меню сохраняет корзину и запрещает отправку заказа', async () => {
  const page = createPage();
  const originalCart = page.getCart();
  page.fetch.mockRejectedValue(new Error('Нет сети'));

  await page.checkout();

  expect(page.getCart()).toEqual(originalCart);
  expect(vm.runInContext('checkedBranchId', page)).toBeNull();
  expect(page.fetch).toHaveBeenCalledTimes(1);
  expect(page.showNotice).toHaveBeenCalledWith(expect.stringContaining('Не удалось проверить'), 'error');
});

test('Изменение цены перед оформлением требует повторного подтверждения суммы', async () => {
  const page = createPage();
  page.saveCart([{ dishId: 1, name: 'Бургер', price: 290, quantity: 2 }]);
  page.fetch.mockResolvedValue({ ok: true, json: async () => [{ id: 1, name: 'Бургер', price: 310 }] });

  await page.checkout();

  expect(page.fetch).toHaveBeenCalledTimes(1);
  expect(page.getCart()[0].price).toBe(310);
  expect(page.showNotice).toHaveBeenCalledWith(expect.stringContaining('Цены изменились'), 'info');
});
