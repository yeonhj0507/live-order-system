const { Router } = require('express');
const db = require('../db');

const router = Router();

router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT c.*,
           COUNT(o.order_id) AS order_count,
           COALESCE(SUM(o.order_price), 0) AS total_spent
    FROM customer c
    LEFT JOIN "order" o ON c.customer_id = o.customer_id
    GROUP BY c.customer_id
    ORDER BY total_spent DESC
  `).all();
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const customer = db.prepare('SELECT * FROM customer WHERE customer_id = ?').get(req.params.id);
  if (!customer) return res.status(404).json({ error: '고객을 찾을 수 없습니다' });
  const orders = db.prepare('SELECT * FROM v_order_status WHERE customer_id = ? ORDER BY ordered_at DESC').all(req.params.id);
  res.json({ ...customer, orders });
});

module.exports = router;
