const DishFacade = require('../facades/DishFacade');
const DatabaseAdapter = require('../adapters/DatabaseAdapter');

jest.mock('../adapters/DatabaseAdapter');

describe('DishFacade', () => {

  test('Добавление блюда сотрудником', async () => {

    DatabaseAdapter.getUserById.mockResolvedValue({
      id: 1,
      role: 'staff'
    });

    DatabaseAdapter.createDish.mockResolvedValue({
      id: 1,
      name: 'Шашлык'
    });

    const dish =
      await DishFacade.createDish(
        1,
        {
          name: 'Шашлык',
          description: 'Свинина',
          price: 500,
          category_id: 1
        }
      );

    expect(dish.name).toBe('Шашлык');
  });

});