const DatabaseAdapter = require('../adapters/DatabaseAdapter');

class OrderFacade {
  
  async createOrder(userId, branchId, items) {
    
    if (!userId || !branchId) {
      throw new Error('Некорректные данные заказа');
    }

    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Корзина пуста');
    }
    
    const dishIds = items.map(i => i && i.dishId).filter(Boolean);
    const dishes = await DatabaseAdapter.getDishesByIds(dishIds);
    const dishById = new Map(dishes.map(d => [d.id, d]));

    let totalPrice = 0;
    const orderItems = [];

    for (const item of items) {
      const dishId = item && item.dishId;
      const quantity = Number(item && item.quantity);

      if (!dishId || !Number.isFinite(quantity) || quantity <= 0) {
        throw new Error('Некорректные позиции заказа');
      }

      const dish = dishById.get(dishId);
      if (!dish) {
        throw new Error(`Блюдо не найдено: ${dishId}`);
      }

      const isAvailable = await DatabaseAdapter.getDishAvailabilityInBranch(dishId, branchId);
      if (!isAvailable) {
        throw new Error(`Блюдо "${dish.name}" недоступно в выбранном ресторане`);
      }

      const price = Number(dish.price);
      if (!Number.isFinite(price)) {
        throw new Error(`Некорректная цена блюда: ${dishId}`);
      }

      const itemTotal = price * quantity;
      totalPrice += itemTotal;

      orderItems.push({
        dishId: dishId,
        quantity: quantity,
        price: price
      });
    }
    
    const order = await DatabaseAdapter.createFullOrder(userId, branchId, orderItems);

    return order;
  }
  
  async getUserOrders(userId) {
    if (!userId) {
      throw new Error('Пользователь не указан');
    }
    return await DatabaseAdapter.getUserOrders(userId);
  }
  
  async getOrderById(orderId) {
    if (!orderId) {
      throw new Error('ID заказа не указан');
    }
    return await DatabaseAdapter.getOrderById(orderId);
  }
  
  async getOrderItems(orderId) {
    if (!orderId) {
      throw new Error('ID заказа не указан');
    }
    return await DatabaseAdapter.getOrderItems(orderId);
  }
  
  async cancelOrder(orderId, userId) {
    
    const order = await DatabaseAdapter.getOrderById(orderId);
    if (!order) {
      throw new Error('Заказ не найден');
    }
    
    if (order.user_id !== userId) {
      throw new Error('Нет доступа к этому заказу');
    }
    
    if (order.status !== 'created') {
      throw new Error('Нельзя отменить заказ в статусе: ' + order.status);
    }

    return await DatabaseAdapter.updateOrderStatus(orderId, 'cancelled');
  }
  
  async getUserOrderStats(userId) {
    const orders = await this.getUserOrders(userId);
    
    const stats = {
      total: orders.length,
      totalSpent: 0,
      created: 0,
      cooking: 0,
      ready: 0,
      issued: 0,
      cancelled: 0
    };

    for (const order of orders) {
      stats.totalSpent += parseFloat(order.total_price);
      switch (order.status) {
        case 'created': stats.created++; break;
        case 'cooking': stats.cooking++; break;
        case 'ready': stats.ready++; break;
        case 'issued': stats.issued++; break;
        case 'cancelled': stats.cancelled++; break;
      }
    }

    return stats;
  }

}

module.exports = new OrderFacade();
