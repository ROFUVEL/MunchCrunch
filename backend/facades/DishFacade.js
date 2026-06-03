const DatabaseAdapter = require('../adapters/DatabaseAdapter');

class DishFacade {

  async createDish(userId, dishData) {

    const user = await DatabaseAdapter.getUserById(userId);
    if (!user || user.role !== 'staff') {
      throw new Error('Нет доступа');
    }
    
    if (!dishData.name || !dishData.name.trim()) {
      throw new Error('Название блюда обязательно');
    }

    if (!dishData.price || dishData.price <= 0) {
      throw new Error('Цена должна быть больше 0');
    }

    if (!dishData.category_id) {
      throw new Error('Категория обязательна');
    }

    return await DatabaseAdapter.createDishForAllBranches({
      name: dishData.name.trim(),
      description: dishData.description || '',
      price: parseFloat(dishData.price),
      image_url: dishData.image_url || '',
      category_id: parseInt(dishData.category_id)
    });
  }  

  async toggleAvailability(userId, dishId, isAvailable) {
    
    const user = await DatabaseAdapter.getUserById(userId);
    if (!user || user.role !== 'staff') {
      throw new Error('Нет доступа');
    }

    if (!user.branch_id) {
      throw new Error('Сотрудник не привязан к филиалу');
    }
    
    const dish = await DatabaseAdapter.getDishById(dishId);
    if (!dish) {
      throw new Error('Блюдо не найдено');
    }
    
    return await DatabaseAdapter.updateDishAvailabilityInBranch(
      parseInt(dishId),
      user.branch_id,
      isAvailable === true || isAvailable === 'true'
    );
  }
  
  async getDishById(dishId) {
    return await DatabaseAdapter.getDishById(dishId);
  }

  async getAllDishes() {
    return await DatabaseAdapter.getAllDishes();
  }
  
  async getMenuByBranch(branchId) {
    return await DatabaseAdapter.getMenuByBranch(branchId);
  }
  
  async getAllDishesByBranch(branchId) {
    return await DatabaseAdapter.getAllDishesByBranch(branchId);
  }

  async isDishAvailableInBranch(dishId, branchId) {
    const isAvailable = await DatabaseAdapter.getDishAvailabilityInBranch(dishId, branchId);
    return isAvailable === true;
  }
}

module.exports = new DishFacade();