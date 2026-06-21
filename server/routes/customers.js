const { Router } = require('express');
const pool = require('../db');

const router = Router();

router.get('/', async (req, res) => {
  const [rows] = await pool.query(`
    SELECT c.*,
           COUNT(o.order_id) AS order_count,
           COALESCE(SUM(o.order_price), 0) AS total_spent
    FROM customer c
    LEFT JOIN \`order\` o ON c.customer_id = o.customer_id
    GROUP BY c.customer_id
    ORDER BY total_spent DESC
  `);
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const [customers] = await pool.query('SELECT * FROM customer WHERE customer_id = ?', [req.params.id]);
  if (!customers[0]) return res.status(404).json({ error: '고객을 찾을 수 없습니다' });
  const [orders] = await pool.query(
    'SELECT * FROM v_order_status WHERE customer_id = ? ORDER BY ordered_at DESC', [req.params.id]
  );
  res.json({ ...customers[0], orders });
});

module.exports = router;
