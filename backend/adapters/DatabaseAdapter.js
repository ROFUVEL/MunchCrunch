const pool = require('../db');

class DatabaseAdapter {

  async getUserByPhone(phone) {
    const res = await pool.query(
      `SELECT * FROM users WHERE phone = $1`,
      [phone]
    );
    return res.rows[0];
  }

  async createClient(phone) {
    const res = await pool.query(
      `INSERT INTO users (phone, role) VALUES ($1, 'client') RETURNING *`,
      [phone]
    );
    return res.rows[0];
  }

  async getUserById(id) {
    const res = await pool.query(
      `SELECT * FROM users WHERE id = $1`,
      [id]
    );
    return res.rows[0];
  }

  async getCategories() {
    const res = await pool.query(
      `SELECT * FROM categories ORDER BY name`
    );
    return res.rows;
  }
  async getBranches() {
    const res = await pool.query(
      `SELECT * FROM branches ORDER BY id`
    );
    return res.rows;
  }

  async getMenuByBranch(branchId) {
    const res = await pool.query(
      `
      SELECT 
        d.id, 
        d.name, 
        d.description, 
        COALESCE(bd.price_override, d.price) as price,
        d.image_url, 
        d.category_id, 
        c.name as category_name,
        bd.is_available
      FROM dishes d
      LEFT JOIN categories c ON d.category_id = c.id
      INNER JOIN branch_dishes bd ON d.id = bd.dish_id
      WHERE bd.branch_id = $1 AND bd.is_available = true
      ORDER BY d.id
      `,
      [branchId]
    );
    return res.rows;
  }

  async getDishById(id) {
    const res = await pool.query(
      `SELECT * FROM dishes WHERE id = $1`,
      [id]
    );
    return res.rows[0];
  }

  async getDishesByIds(ids) {
    const uniqueIds = Array.from(new Set(ids)).filter(Boolean);
    if (uniqueIds.length === 0) return [];
    const res = await pool.query(
      `SELECT * FROM dishes WHERE id = ANY($1::int[])`,
      [uniqueIds]
    );
    return res.rows;
  }

  async getDishAvailabilityInBranch(dishId, branchId) {
    const res = await pool.query(
      `SELECT is_available FROM branch_dishes WHERE dish_id = $1 AND branch_id = $2`,
      [dishId, branchId]
    );
    return res.rows[0] ? res.rows[0].is_available : null;
  }

  async createFullOrder(userId, branchId, items) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      const orderRes = await client.query(
        `INSERT INTO orders (user_id, branch_id, total_price, status)
         VALUES ($1, $2, $3, 'created')
         RETURNING *`,
        [userId, branchId, totalPrice]
      );
      
      const orderId = orderRes.rows[0].id;
      
      for (const item of items) {
        await client.query(
          `INSERT INTO order_items (order_id, dish_id, quantity, price)
           VALUES ($1, $2, $3, $4)`,
          [orderId, item.dishId, item.quantity, item.price]
        );
      }
      
      await client.query('COMMIT');
      return orderRes.rows[0];
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async getUserOrders(userId) {
    const res = await pool.query(
      `SELECT id, user_id, branch_id, status, total_price, created_at, updated_at
       FROM orders
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    return res.rows;
  }

  async getOrderById(orderId) {
    const res = await pool.query(
      `SELECT id, user_id, branch_id, status, total_price, created_at, updated_at
       FROM orders
       WHERE id = $1`,
      [orderId]
    );
    return res.rows[0];
  }

  async getOrderItems(orderId) {
    const res = await pool.query(
      `SELECT order_items.*, dishes.name
       FROM order_items
       JOIN dishes ON order_items.dish_id = dishes.id
       WHERE order_items.order_id = $1`,
      [orderId]
    );
    return res.rows;
  }

  async updateOrderStatus(orderId, status) {
    const res = await pool.query(
      `UPDATE orders
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, orderId]
    );
    return res.rows[0];
  }

  async cancelCreatedOrder(orderId, userId) {
    const res = await pool.query(
      `UPDATE orders SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2 AND status = 'created'
       RETURNING *`,
      [orderId, userId]
    );
    return res.rows[0];
  }

  async saveAuthCode(phone, code) {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);
    
    await pool.query(
      `DELETE FROM auth_codes WHERE phone = $1 AND is_used = false`,
      [phone]
    );
    
    const res = await pool.query(
      `INSERT INTO auth_codes (phone, code, expires_at)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [phone, code, expiresAt]
    );
    return res.rows[0];
  }

  async verifyAuthCode(phone, code) {
    const res = await pool.query(
      `SELECT * FROM auth_codes
       WHERE phone = $1 AND code = $2 AND is_used = false AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [phone, code]
    );
    
    if (res.rows.length === 0) return false;
    
    await pool.query(
      `UPDATE auth_codes SET is_used = true WHERE id = $1`,
      [res.rows[0].id]
    );
    
    return true;
  }

}

module.exports = new DatabaseAdapter();
