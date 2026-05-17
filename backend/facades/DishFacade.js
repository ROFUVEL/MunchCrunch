const DatabaseAdapter = require('../adapters/DatabaseAdapter');

class DishFacade {

  async createDish(userId, dish) {
    const user = await DatabaseAdapter.getUserById(userId);

    if (!user || user.role !== 'staff') {
      throw new Error('Нет доступа');
    }

    return await DatabaseAdapter.createDish(dish);
  }

}

module.exports = new DishFacade();
