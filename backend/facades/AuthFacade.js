const DatabaseAdapter = require('../adapters/DatabaseAdapter');

class AuthFacade {

  async login(phone, isStaff) {

    let user = await DatabaseAdapter.getUserByPhone(phone);


    if (isStaff) {

      if (!user || user.role !== 'staff') {
        throw new Error('Сотрудник не найден');
      }

      return user;
    }

    if (!user) {
      user = await DatabaseAdapter.createClient(phone);
    }

    return user;
  }
}

module.exports = new AuthFacade();