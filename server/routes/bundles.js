const { Router } = require('express');
const pool = require('../db');

const router = Router();

router.get('/', async (req, res) => {
  const [rows] = await pool.query(`
    SELECT b.*,
           c.customer_nickname,
           (SELECT COUNT(*) FROM \`order\` WHERE bundle_id = b.bundle_id) AS order_count,
           (SELECT COALESCE(SUM(order_price),0) FROM \`order\` WHERE bundle_id = b.bundle_id) AS total_price
    FROM delivery_bundle b
    JOIN customer c ON b.customer_id = c.customer_id
    ORDER BY b.bundle_id DESC
  `);
  res.json(rows);
});

router.get('/token/:token', async (req, res) => {
  const [rows] = await pool.query(`
    SELECT b.*, c.customer_nickname
    FROM delivery_bundle b
    JOIN customer c ON b.customer_id = c.customer_id
    WHERE b.delivery_token = ?
  `, [req.params.token]);
  if (!rows[0]) return res.status(404).json({ error: '배송 묶음을 찾을 수 없습니다' });

  const [orders] = await pool.query(
    'SELECT order_id, order_price, order_token, ordered_at FROM `order` WHERE bundle_id = ?',
    [rows[0].bundle_id]
  );
  res.json({ ...rows[0], orders });
});

router.put('/token/:token/address', async (req, res) => {
  const { delivery_recipient, delivery_phone, delivery_address } = req.body;
  if (!delivery_recipient || !delivery_phone || !delivery_address) {
    return res.status(400).json({ error: '수령인, 연락처, 주소 필수' });
  }
  const [result] = await pool.query(`
    UPDATE delivery_bundle
    SET delivery_recipient = ?, delivery_phone = ?, delivery_address = ?
    WHERE delivery_token = ?
  `, [delivery_recipient, delivery_phone, delivery_address, req.params.token]);

  if (result.affectedRows === 0) return res.status(404).json({ error: '배송 묶음을 찾을 수 없습니다' });
  res.json({ ok: true });
});

router.post('/merge', async (req, res) => {
  const { customer_id, session_id } = req.body;
  if (!customer_id) return res.status(400).json({ error: 'customer_id 필수' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [orders] = await conn.query(`
      SELECT o.order_id, o.bundle_id
      FROM \`order\` o
      JOIN delivery_bundle b ON o.bundle_id = b.bundle_id
      WHERE o.customer_id = ?
        AND (
          o.session_id = ?
          OR (o.session_id != ? AND o.paid_at IS NOT NULL AND b.delivery_token IS NULL AND b.bundle_status = 'SINGLE')
        )
    `, [customer_id, session_id, session_id]);

    if (orders.length < 2) {
      await conn.rollback();
      return res.json({ merged: false, message: '병합할 주문이 2건 미만입니다' });
    }

    const [newBundleResult] = await conn.query(
      "INSERT INTO delivery_bundle (customer_id, bundle_status) VALUES (?, 'MERGED')", [customer_id]
    );
    const newBundleId = newBundleResult.insertId;

    const oldBundleIds = new Set();
    for (const o of orders) {
      oldBundleIds.add(o.bundle_id);
      await conn.query('UPDATE `order` SET bundle_id = ? WHERE order_id = ?', [newBundleId, o.order_id]);
    }

    for (const bid of oldBundleIds) {
      await conn.query(
        'DELETE FROM delivery_bundle WHERE bundle_id = ? AND (SELECT COUNT(*) FROM `order` WHERE bundle_id = ?) = 0',
        [bid, bid]
      );
    }

    await conn.commit();
    res.json({ merged: true, new_bundle_id: newBundleId, order_count: orders.length });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
