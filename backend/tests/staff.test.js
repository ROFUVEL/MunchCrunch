const StaffFacade = require('../facades/StaffFacade');
const DatabaseAdapter = require('../adapters/DatabaseAdapter');

jest.mock('../adapters/DatabaseAdapter');

describe('StaffFacade', () => {

  test('Сотрудник изменяет статус заказа', async () => {

    DatabaseAdapter.getUserById.mockResolvedValue({
      id: 1,
      role: 'staff'
    });

    DatabaseAdapter.updateOrderStatus.mockResolvedValue({
      id: 10,
      status: 'ready'
    });

    const order =
      await StaffFacade.updateOrderStatus(
        1,
        10,
        'ready'
      );

    expect(order.status).toBe('ready');
  });

  test('Клиент не может менять статус', async () => {

    DatabaseAdapter.getUserById.mockResolvedValue({
      id: 2,
      role: 'client'
    });

    await expect(
      StaffFacade.updateOrderStatus(
        2,
        1,
        'ready'
      )
    ).rejects.toThrow('Нет доступа');
  });

});