const DatabaseAdapter = require('../adapters/DatabaseAdapter');

class StaffFacade {
  
  async getMyOrders(userId) {
    
    const user = await DatabaseAdapter.getUserById(userId);
    if (!user || user.role !== 'staff') {
      throw new Error('Нет доступа');
    }

    if (!user.branch_id) {
      throw new Error('Сотрудник не привязан к филиалу');
    }

    
    return await DatabaseAdapter.getOrdersByBranch(user.branch_id);
  }
  
  async updateOrderStatus(userId, orderId, status) {
    
    const user = await DatabaseAdapter.getUserById(userId);
    if (!user || user.role !== 'staff') {
      throw new Error('Нет доступа');
    }

    if (!user.branch_id) {
      throw new Error('Сотрудник не привязан к филиалу');
    }

    
    const order = await DatabaseAdapter.getOrderById(orderId);
    if (!order) {
      throw new Error('Заказ не найден');
    }

    
    if (order.branch_id !== user.branch_id) {
      throw new Error('Нет доступа к этому заказу');
    }

    
    const validStatuses = ['created', 'cooking', 'ready', 'issued', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error('Неверный статус заказа');
    }

    
    return await DatabaseAdapter.updateOrderStatus(orderId, status);
  }
  
  async getStaffInfo(userId) {
    const user = await DatabaseAdapter.getUserById(userId);
    if (!user || user.role !== 'staff') {
      throw new Error('Пользователь не является сотрудником');
    }

    let branchInfo = null;
    if (user.branch_id) {
      const branches = await DatabaseAdapter.getBranches();
      branchInfo = branches.find(b => b.id === user.branch_id);
    }

    return {
      id: user.id,
      phone: user.phone,
      role: user.role,
      branch_id: user.branch_id,
      branch_name: branchInfo ? branchInfo.name : null,
      branch_address: branchInfo ? branchInfo.address : null,
      branch_hours: branchInfo ? branchInfo.working_hours : null,
      created_at: user.created_at
    };
  }
  
  async getBranchStats(userId) {
    const user = await DatabaseAdapter.getUserById(userId);
    if (!user || user.role !== 'staff') {
      throw new Error('Нет доступа');
    }

    if (!user.branch_id) {
      throw new Error('Сотрудник не привязан к филиалу');
    }

    const orders = await DatabaseAdapter.getOrdersByBranch(user.branch_id);
    
    const stats = {
      total: orders.length,
      today: 0,
      week: 0,
      month: 0,
      byStatus: {
        created: 0,
        cooking: 0,
        ready: 0,
        issued: 0,
        cancelled: 0
      },
      totalRevenue: 0
    };

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    for (const order of orders) {
      const orderDate = new Date(order.created_at);
      
      if (stats.byStatus.hasOwnProperty(order.status)) {
        stats.byStatus[order.status]++;
      }
      
      
      if (order.status === 'issued') {
        stats.totalRevenue += parseFloat(order.total_price);
      }
      
      if (orderDate >= todayStart) {
        stats.today++;
      }
      if (orderDate >= weekStart) {
        stats.week++;
      }
      if (orderDate >= monthStart) {
        stats.month++;
      }
    }

    return stats;
  }
  
  async getBranchStaff(userId) {
    const user = await DatabaseAdapter.getUserById(userId);
    if (!user || user.role !== 'staff') {
      throw new Error('Нет доступа');
    }

    if (!user.branch_id) {
      throw new Error('Сотрудник не привязан к филиалу');
    }

    const allUsers = await DatabaseAdapter.getAllUsers();
    return allUsers.filter(u => u.role === 'staff' && u.branch_id === user.branch_id);
  }
  
  async isStaff(userId) {
    const user = await DatabaseAdapter.getUserById(userId);
    return user && user.role === 'staff';
  }
  
  async isInBranch(userId, branchId) {
    const user = await DatabaseAdapter.getUserById(userId);
    return user && user.role === 'staff' && user.branch_id === parseInt(branchId);
  }
}

module.exports = new StaffFacade();