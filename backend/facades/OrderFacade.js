const DatabaseAdapter = require('../adapters/DatabaseAdapter');
const { isPositiveInteger, isValidOrderItems } = require('../validation');
const { badRequest, httpError } = require('../errors');

class OrderFacade {
  
  async createOrder(userId, branchId, items) {
    
    if (!isPositiveInteger(userId) || !isPositiveInteger(branchId)) {
      throw badRequest('Некорректные данные заказа');
    }

    if (!Array.isArray(items) || items.length === 0) {
      throw badRequest('Корзина пуста');
    }
    if (!isValidOrderItems(items)) {
      throw badRequest('Некорректные позиции заказа');
    }
    const mergedItems = [];
    for (const item of items) {
      const existing = mergedItems.find(position => position.dishId === item.dishId);
      if (existing) {
        existing.quantity += item.quantity;
        if (!isPositiveInteger(existing.quantity)) {
          throw badRequest('Слишком большое количество блюда');
        }
      } else {
        mergedItems.push({ dishId: item.dishId, quantity: item.quantity });
      }
    }
    if (!await DatabaseAdapter.getUserById(userId)) {
      throw httpError(404, 'Пользователь не найден');
    }
    if (!await DatabaseAdapter.getBranchById(branchId)) {
      throw httpError(404, 'Ресторан не найден');
    }
    
    // Используем те же доступные блюда и цены, которые показываются в меню ресторана.
    const dishes = await DatabaseAdapter.getMenuByBranch(branchId);
    const dishById = new Map(dishes.map(d => [d.id, d]));

    const orderItems = [];

    for (const item of mergedItems) {
      const { dishId, quantity } = item;

      const dish = dishById.get(dishId);
      if (!dish) {
        throw badRequest(`Блюдо недоступно в выбранном ресторане: ${dishId}`);
      }

      const price = Number(dish.price);
      if (!Number.isFinite(price)) {
        throw new Error(`Некорректная цена блюда: ${dishId}`);
      }

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
    const order = await this.getUserOrder(orderId, userId);
    
    if (order.status !== 'created') {
      throw httpError(409, 'Нельзя отменить заказ в статусе: ' + order.status);
    }

    const cancelledOrder = await DatabaseAdapter.cancelCreatedOrder(orderId, userId);
    if (!cancelledOrder) {
      throw httpError(409, 'Статус заказа изменился. Обновите список заказов.');
    }
    return cancelledOrder;
  }

  async getUserOrder(orderId, userId) {
    if (!isPositiveInteger(orderId) || !isPositiveInteger(userId)) {
      throw badRequest('Некорректный ID пользователя или заказа');
    }
    const order = await DatabaseAdapter.getOrderById(orderId);
    if (!order) throw httpError(404, 'Заказ не найден');
    if (order.user_id !== userId) throw httpError(403, 'Нет доступа к этому заказу');
    return order;
  }

  async getUserOrderItems(orderId, userId) {
    await this.getUserOrder(orderId, userId);
    return DatabaseAdapter.getOrderItems(orderId);
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
