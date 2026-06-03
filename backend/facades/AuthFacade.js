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
  
  async isStaff(userId) {
    const user = await DatabaseAdapter.getUserById(userId);
    return user && user.role === 'staff';
  }

  async isClient(userId) {
    const user = await DatabaseAdapter.getUserById(userId);
    return user && user.role === 'client';
  }

  async getStaffBranch(userId) {
    const user = await DatabaseAdapter.getUserById(userId);
    if (user && user.role === 'staff') {
      return user.branch_id;
    }
    return null;
  }
}

module.exports = new AuthFacade();