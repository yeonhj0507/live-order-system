const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const dm = require('../services/dmService');

const router = Router();

router.post('/', async (req, res) => {
  const { session_id, customer_id, customer_nickname, order_price } = req.body;
  if (!session_id || !customer_id || !order_price) {
    return res.status(400).json({ error: 'session_id, customer_id, order_price 필수' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [existing] = await conn.query('SELECT customer_id FROM customer WHERE customer_id = ?', [customer_id]);
    if (existing.length === 0) {
      await conn.query('INSERT INTO customer (customer_id, customer_nickname) VALUES (?, ?)',
        [customer_id, customer_nickname || customer_id]);
    }

    const orderToken = uuidv4();

    const [bundleResult] = await conn.query(
      "INSERT INTO delivery_bundle (customer_id, bundle_status) VALUES (?, 'SINGLE')", [customer_id]
    );
    const bundleId = bundleResult.insertId;

    const [orderResult] = await conn.query(
      'INSERT INTO `order` (session_id, customer_id, bundle_id, order_price, order_token) VALUES (?, ?, ?, ?, ?)',
      [session_id, customer_id, bundleId, order_price, orderToken]
    );

    await conn.commit();
    dm.sendPaymentLink(customer_id, orderToken);

    res.status(201).json({
      order_id: orderResult.insertId,
      order_token: orderToken,
      bundle_id: bundleId,
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

router.get('/token/:token', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM v_order_status WHERE order_token = ?', [req.params.token]);
  if (!rows[0]) return res.status(404).json({ error: '주문을 찾을 수 없습니다' });
  res.json(rows[0]);
});

router.post('/:id/pay', async (req, res) => {
  const orderId = req.params.id;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query('UPDATE `order` SET paid_at = NOW() WHERE order_id = ?', [orderId]);

    const [orderRows] = await conn.query('SELECT * FROM `order` WHERE order_id = ?', [orderId]);
    if (!orderRows[0]) throw new Error('주문을 찾을 수 없습니다');
    const order = orderRows[0];

    const [unpaidRows] = await conn.query(
      'SELECT COUNT(*) AS cnt FROM `order` WHERE bundle_id = ? AND paid_at IS NULL', [order.bundle_id]
    );

    let result;
    if (unpaidRows[0].cnt === 0) {
      const deliveryToken = uuidv4();
      await conn.query('UPDATE delivery_bundle SET delivery_token = ? WHERE bundle_id = ?',
        [deliveryToken, order.bundle_id]);
      dm.sendDeliveryLink(order.customer_id, deliveryToken);
      result = { paid: true, all_paid: true, delivery_token: deliveryToken };
    } else {
      result = { paid: true, all_paid: false, remaining: unpaidRows[0].cnt };
    }

    await conn.commit();
    res.json(result);
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

router.patch('/:id/screenshot', async (req, res) => {
  const screenshotPath = `screenshots/order_${req.params.id}_${Date.now()}.png`;
  const [result] = await pool.query(
    'UPDATE `order` SET order_screenshot = ? WHERE order_id = ?', [screenshotPath, req.params.id]
  );
  if (result.affectedRows === 0) return res.status(404).json({ error: '주문을 찾을 수 없습니다' });
  res.json({ ok: true, order_screenshot: screenshotPath });
});

router.get('/', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM v_order_status ORDER BY ordered_at DESC');
  res.json(rows);
});

module.exports = router;
