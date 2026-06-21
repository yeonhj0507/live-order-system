const { Router } = require('express');
const pool = require('../db');

const router = Router();

router.get('/', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM v_session_revenue ORDER BY session_date DESC');
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM v_session_revenue WHERE session_id = ?', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: '세션을 찾을 수 없습니다' });
  res.json(rows[0]);
});

router.post('/', async (req, res) => {
  const { session_date, session_title } = req.body;
  if (!session_date || !session_title) {
    return res.status(400).json({ error: 'session_date, session_title 필수' });
  }
  const [result] = await pool.query(
    'INSERT INTO live_session (session_date, session_title) VALUES (?, ?)',
    [session_date, session_title]
  );
  res.status(201).json({ session_id: result.insertId });
});

router.patch('/:id/status', async (req, res) => {
  const { session_status } = req.body;
  if (!['SCHEDULED', 'LIVE', 'ENDED'].includes(session_status)) {
    return res.status(400).json({ error: '유효하지 않은 상태' });
  }
  await pool.query('UPDATE live_session SET session_status = ? WHERE session_id = ?',
    [session_status, req.params.id]);
  res.json({ ok: true });
});

router.get('/:id/orders', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM v_order_status WHERE session_id = ? ORDER BY ordered_at DESC',
    [req.params.id]
  );
  res.json(rows);
});

router.get('/:id/stats', async (req, res) => {
  const [rows] = await pool.query(`
    SELECT
      COUNT(*)                                              AS total_bids,
      COALESCE(SUM(order_price), 0)                         AS total_revenue,
      SUM(CASE WHEN paid_at IS NOT NULL THEN 1 ELSE 0 END) AS paid_count,
      SUM(CASE WHEN paid_at IS NULL THEN 1 ELSE 0 END)     AS unpaid_count
    FROM \`order\` WHERE session_id = ?
  `, [req.params.id]);
  res.json(rows[0]);
});

module.exports = router;
