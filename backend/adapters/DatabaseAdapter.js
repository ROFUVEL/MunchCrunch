const pool = require('../db');

class DatabaseAdapter {

  async getUserByPhone(phone) {

    const res = await pool.query(
      `
      SELECT *
      FROM users
      WHERE phone = $1
      `,
      [phone]
    );

    return res.rows[0];
  }

  async createClient(phone) {

    const res = await pool.query(
      `
      INSERT INTO users
      (phone, role)

      VALUES ($1, 'client')

      RETURNING *
      `,
      [phone]
    );

    return res.rows[0];
  }

  async getUserById(id) {

    const res = await pool.query(
      `
      SELECT *
      FROM users
      WHERE id = $1
      `,
      [id]
    );

    return res.rows[0];
  }

  async getMenu() {

    const res = await pool.query(
      `
      SELECT
        dishes.*,
        categories.name AS category_name

      FROM dishes

      LEFT JOIN categories
        ON dishes.category_id = categories.id

      WHERE dishes.is_available = true

      ORDER BY dishes.id
      `
    );

    return res.rows;
  }

  async createDish(dish) {

    const res = await pool.query(
      `
      INSERT INTO dishes
      (
        name,
        description,
        price,
        image_url,
        category_id,
        is_available
      )

      VALUES
      (
        $1,
        $2,
        $3,
        $4,
        $5,
        true
      )

      RETURNING *
      `,
      [
        dish.name,
        dish.description,
        dish.price,
        dish.image_url,
        dish.category_id
      ]
    );

    return res.rows[0];
  }

  async getDishById(id) {

    const res = await pool.query(
      `
      SELECT *
      FROM dishes
      WHERE id = $1
      `,
      [id]
    );

    return res.rows[0];
  }

  async getDishesByIds(ids) {

    const uniqueIds =
      Array.from(new Set(ids)).filter(Boolean);

    if (uniqueIds.length === 0) {
      return [];
    }

    const res = await pool.query(
      `
      SELECT *
      FROM dishes
      WHERE id = ANY($1::int[])
      `,
      [uniqueIds]
    );

    return res.rows;
  }

  async updateDishAvailability(id, isAvailable) {

    const res = await pool.query(
      `
      UPDATE dishes

      SET is_available = $1

      WHERE id = $2

      RETURNING *
      `,
      [isAvailable, id]
    );

    return res.rows[0];
  }

  async getCategories() {

    const res = await pool.query(
      `
      SELECT *
      FROM categories
      ORDER BY name
      `
    );

    return res.rows;
  }

  async getBranches() {

    const res = await pool.query(
      `
      SELECT *
      FROM branches
      ORDER BY id
      `
    );

    return res.rows;
  }

  async createOrder(userId, branchId, totalPrice) {

    const res = await pool.query(
      `
      INSERT INTO orders
      (
        user_id,
        branch_id,
        total_price,
        status
      )

      VALUES
      (
        $1,
        $2,
        $3,
        'created'
      )

      RETURNING *
      `,
      [userId, branchId, totalPrice]
    );

    return res.rows[0];
  }

  async addOrderItem(
    orderId,
    dishId,
    quantity,
    price
  ) {

    await pool.query(
      `
      INSERT INTO order_items
      (
        order_id,
        dish_id,
        quantity,
        price
      )

      VALUES
      (
        $1,
        $2,
        $3,
        $4
      )
      `,
      [
        orderId,
        dishId,
        quantity,
        price
      ]
    );
  }

  async getUserOrders(userId) {

    const res = await pool.query(
      `
      SELECT *
      FROM orders

      WHERE user_id = $1

      ORDER BY created_at DESC
      `,
      [userId]
    );

    return res.rows;
  }

  async getOrdersByBranch(branchId) {

    const res = await pool.query(
      `
      SELECT *
      FROM orders

      WHERE branch_id = $1

      ORDER BY created_at DESC
      `,
      [branchId]
    );

    return res.rows;
  }

  async getOrderItems(orderId) {

    const res = await pool.query(
      `
      SELECT
        order_items.*,
        dishes.name

      FROM order_items

      JOIN dishes
        ON order_items.dish_id = dishes.id

      WHERE order_items.order_id = $1
      `,
      [orderId]
    );

    return res.rows;
  }

  async updateOrderStatus(orderId, status) {

    const res = await pool.query(
      `
      UPDATE orders

      SET status = $1

      WHERE id = $2

      RETURNING *
      `,
      [status, orderId]
    );

    return res.rows[0];
  }
}

module.exports = new DatabaseAdapter();