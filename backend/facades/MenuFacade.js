const DatabaseAdapter = require('../adapters/DatabaseAdapter');

class MenuFacade {

  async getMenu() {
    return await DatabaseAdapter.getMenu();
  }

}

module.exports = new MenuFacade();