const OrderFacade = require('../facades/OrderFacade');
const DatabaseAdapter = require('../adapters/DatabaseAdapter');

jest.mock('../adapters/DatabaseAdapter');

describe('OrderFacade', () => {

  test('Создание заказа', async () => {

    DatabaseAdapter.getDishesByIds.mockResolvedValue([
      {
        id: 1,
        price: 500
      }
    ]);

    DatabaseAdapter.createOrder.mockResolvedValue({
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
  });

});