const DatabaseAdapter = require('../adapters/DatabaseAdapter');

class AuthFacade {

  async login(phone) {
    
    let user = await DatabaseAdapter.getUserByPhone(phone);
    
    if (!user) {
      user = await DatabaseAdapter.createClient(phone);
    }
    
    return user;
  }

  async userExists(phone) {
    const user = await DatabaseAdapter.getUserByPhone(phone);
    return !!user;
  }

  async getUserById(userId) {
    return await DatabaseAdapter.getUserById(userId);
  }

  async getUserByPhone(phone) {
    return await DatabaseAdapter.getUserByPhone(phone);
  }
  
}

module.exports = new AuthFacade();
