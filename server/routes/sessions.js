const { Router } = require('express');
const db = require('../db');

const router = Router();

// 전체 세션 목록 (매출 집계 포함)
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM v_session_revenue ORDER BY session_date DESC').all();
  res.json(rows);
});

// 세션 상세
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM v_session_revenue WHERE session_id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: '세션을 찾을 수 없습니다' });
  res.json(row);
});

// 세션 생성
router.post('/', (req, res) => {
  const { session_date, session_title } = req.body;
  if (!session_date || !session_title) {
    return res.status(400).json({ error: 'session_date, session_title 필수' });
  }
  const result = db.prepare(
    'INSERT INTO live_session (session_date, session_title) VALUES (?, ?)'
  ).run(session_date, session_title);
  res.status(201).json({ session_id: result.lastInsertRowid });
});

// 세션 상태 변경
router.patch('/:id/status', (req, res) => {
  const { session_status } = req.body;
  if (!['SCHEDULED', 'LIVE', 'ENDED'].includes(session_status)) {
    return res.status(400).json({ error: '유효하지 않은 상태' });
  }
  db.prepare('UPDATE live_session SET session_status = ? WHERE session_id = ?')
    .run(session_status, req.params.id);
  res.json({ ok: true });
});

// 세션별 주문 목록
router.get('/:id/orders', (req, res) => {
  const rows = db.prepare(
    'SELECT * FROM v_order_status WHERE session_id = ? ORDER BY ordered_at DESC'
  ).all(req.params.id);
  res.json(rows);
});

// 세션별 집계
router.get('/:id/stats', (req, res) => {
  const row = db.prepare(`
    SELECT
      COUNT(*)                                              AS total_bids,
      COALESCE(SUM(order_price), 0)                         AS total_revenue,
      SUM(CASE WHEN paid_at IS NOT NULL THEN 1 ELSE 0 END) AS paid_count,
      SUM(CASE WHEN paid_at IS NULL THEN 1 ELSE 0 END)     AS unpaid_count
    FROM "order" WHERE session_id = ?
  `).get(req.params.id);
  res.json(row);
});

module.exports = router;
