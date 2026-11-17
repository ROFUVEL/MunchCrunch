const OrderFacade = require('../facades/OrderFacade');
const DatabaseAdapter = require('../adapters/DatabaseAdapter');

jest.mock('../adapters/DatabaseAdapter');

describe('OrderFacade', () => {

  beforeEach(() => jest.resetAllMocks());

  test('Создание заказа', async () => {

    DatabaseAdapter.getMenuByBranch.mockResolvedValue([
      {
        id: 1,
        price: 500
      }
    ]);

    DatabaseAdapter.createFullOrder.mockResolvedValue({
      id: 1,
      total_price: 1000
    });

    DatabaseAdapter.addOrderItem.mockResolvedValue();

    const order =
      await OrderFacade.createOrder(
        1,
        1,
        [
          {
            dishId: 1,
            quantity: 2
          }
        ]
      );

    expect(order.total_price).toBe(1000);
    expect(DatabaseAdapter.createFullOrder).toHaveBeenCalledWith(
      1, 1, [{ dishId: 1, quantity: 2, price: 500 }]
    );
  });

  test('Недоступное блюдо нельзя заказать', async () => {
    DatabaseAdapter.getMenuByBranch.mockResolvedValue([]);

    await expect(OrderFacade.createOrder(1, 1, [
      { dishId: 1, quantity: 1 }
    ])).rejects.toThrow('недоступно');
    expect(DatabaseAdapter.createFullOrder).not.toHaveBeenCalled();
  });

  test.each(['350.00', '0.00'])(
    'Заказ использует цену ресторана %s и игнорирует цену из браузера',
    async (price) => {
      DatabaseAdapter.getMenuByBranch.mockResolvedValue([{ id: 1, price }]);
      DatabaseAdapter.createFullOrder.mockResolvedValue({ id: 1 });

      await OrderFacade.createOrder(1, 2, [
        { dishId: 1, quantity: 2, price: 999 }
      ]);

      expect(DatabaseAdapter.getMenuByBranch).toHaveBeenCalledWith(2);
      expect(DatabaseAdapter.createFullOrder).toHaveBeenCalledWith(
        1, 2, [{ dishId: 1, quantity: 2, price: Number(price) }]
      );
    }
  );

  test('Отмена чужого заказа запрещена', async () => {
    DatabaseAdapter.getOrderById.mockResolvedValue({
      id: 1, user_id: 2, status: 'created'
    });
    await expect(OrderFacade.cancelOrder(1, 1)).rejects.toThrow('Нет доступа');
    expect(DatabaseAdapter.updateOrderStatus).not.toHaveBeenCalled();
  });

});
