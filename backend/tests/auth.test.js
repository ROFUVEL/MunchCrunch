const AuthFacade = require('../facades/AuthFacade');
const DatabaseAdapter = require('../adapters/DatabaseAdapter');

jest.mock('../adapters/DatabaseAdapter');

describe('AuthFacade', () => {

  test('Вход существующего клиента', async () => {

    DatabaseAdapter.getUserByPhone.mockResolvedValue({
      id: 1,
      phone: '999',
      role: 'client'
    });

    const user =
      await AuthFacade.login('999', false);

    expect(user.role).toBe('client');
  });

  test('Создание нового клиента', async () => {

    DatabaseAdapter.getUserByPhone.mockResolvedValue(null);

    DatabaseAdapter.createClient.mockResolvedValue({
      id: 2,
      phone: '111',
      role: 'client'
    });

    const user =
      await AuthFacade.login('111', false);

    expect(user.phone).toBe('111');
  });

  test('Ошибка входа сотрудника', async () => {

    DatabaseAdapter.getUserByPhone.mockResolvedValue(null);

    await expect(
      AuthFacade.login('555', true)
    ).rejects.toThrow('Сотрудник не найден');
  });

});