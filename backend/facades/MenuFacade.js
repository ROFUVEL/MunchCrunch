const DatabaseAdapter = require('../adapters/DatabaseAdapter');

class MenuFacade {

  async getMenu(branchId) {
    if (!branchId) {
      throw new Error('Филиал не указан');
    }
    return await DatabaseAdapter.getMenuByBranch(parseInt(branchId));
  }
  
  async getDishById(dishId) {
    return await DatabaseAdapter.getDishById(dishId);
  }
  
  async getCategories() {
    return await DatabaseAdapter.getCategories();
  }
  
  async getDishesByCategory(branchId, categoryId) {
    const dishes = await this.getMenu(branchId);
    return dishes.filter(dish => dish.category_id === parseInt(categoryId));
  }
  
  async isDishAvailable(branchId, dishId) {
    const dishes = await this.getMenu(branchId);
    return dishes.some(dish => dish.id === parseInt(dishId));
  }
  
  async searchDishes(branchId, query) {
    const dishes = await this.getMenu(branchId);
    const lowerQuery = query.toLowerCase();
    return dishes.filter(dish => 
      dish.name.toLowerCase().includes(lowerQuery) ||
      (dish.description && dish.description.toLowerCase().includes(lowerQuery))
    );
  }
}

module.exports = new MenuFacade();
