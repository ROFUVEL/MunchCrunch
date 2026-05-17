const DatabaseAdapter = require('../adapters/DatabaseAdapter');

class StaffFacade {

  async getMyOrders(userId) {

    const user = await DatabaseAdapter.getUserById(userId);

    if (!user || user.role !== 'staff') {
      throw new Error('Нет доступа');
    }

    return await DatabaseAdapter.getOrdersByBranch(
      user.branch_id
    );
  }

  async updateOrderStatus(userId, orderId, status) {

    const user = await DatabaseAdapter.getUserById(userId);

    if (!user || user.role !== 'staff') {
      throw new Error('Нет доступа');
    }

    return await DatabaseAdapter.updateOrderStatus(
      orderId,
      status
    );
  }
}

module.exports = new StaffFacade();