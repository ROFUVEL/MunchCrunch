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

      const price = Number(dish.price);
      if (!Number.isFinite(price)) {
        throw new Error(`Некорректная цена блюда: ${dishId}`);
      }

      totalPrice += price * quantity;
    }

    const order = await DatabaseAdapter.createOrder(
      userId,
      branchId,
      totalPrice
    );

    for (const item of items) {
      const dish = dishById.get(item.dishId);
      const price = Number(dish.price);

      await DatabaseAdapter.addOrderItem(
        order.id,
        item.dishId,
        item.quantity,
        price
      );
    }

    return order;
  }

  async getUserOrders(userId) {
    return await DatabaseAdapter.getUserOrders(userId);
  }
}

module.exports = new OrderFacade();
