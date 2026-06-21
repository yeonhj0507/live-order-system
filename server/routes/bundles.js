const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

const router = Router();

// 배송 묶음 목록
router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT b.*,
           c.customer_nickname,
           (SELECT COUNT(*) FROM "order" WHERE bundle_id = b.bundle_id) AS order_count,
           (SELECT COALESCE(SUM(order_price),0) FROM "order" WHERE bundle_id = b.bundle_id) AS total_price
    FROM delivery_bundle b
    JOIN customer c ON b.customer_id = c.customer_id
    ORDER BY b.bundle_id DESC
  `).all();
  res.json(rows);
});

// 배송지 입력 (delivery_token으로 조회 후 배송지 정보 입력)
router.get('/token/:token', (req, res) => {
  const bundle = db.prepare(`
    SELECT b.*, c.customer_nickname
    FROM delivery_bundle b
    JOIN customer c ON b.customer_id = c.customer_id
    WHERE b.delivery_token = ?
  `).get(req.params.token);
  if (!bundle) return res.status(404).json({ error: '배송 묶음을 찾을 수 없습니다' });

  const orders = db.prepare(
    'SELECT order_id, order_price, order_token, ordered_at FROM "order" WHERE bundle_id = ?'
  ).all(bundle.bundle_id);

  res.json({ ...bundle, orders });
});

// 배송지 정보 저장
router.put('/token/:token/address', (req, res) => {
  const { delivery_recipient, delivery_phone, delivery_address } = req.body;
  if (!delivery_recipient || !delivery_phone || !delivery_address) {
    return res.status(400).json({ error: '수령인, 연락처, 주소 필수' });
  }
  const result = db.prepare(`
    UPDATE delivery_bundle
    SET delivery_recipient = ?, delivery_phone = ?, delivery_address = ?
    WHERE delivery_token = ?
  `).run(delivery_recipient, delivery_phone, delivery_address, req.params.token);

  if (result.changes === 0) return res.status(404).json({ error: '배송 묶음을 찾을 수 없습니다' });
  res.json({ ok: true });
});

// 번들 병합 (제안서 BUNDLE LOGIC)
router.post('/merge', (req, res) => {
  const { customer_id, session_id } = req.body;
  if (!customer_id) return res.status(400).json({ error: 'customer_id 필수' });

  const tx = db.transaction(() => {
    // 병합 대상: 현재 세션 미입금 + 이전 세션 입금완료 & delivery_token 미발급 & SINGLE
    const orders = db.prepare(`
      SELECT o.order_id, o.bundle_id
      FROM "order" o
      JOIN delivery_bundle b ON o.bundle_id = b.bundle_id
      WHERE o.customer_id = ?
        AND (
          o.session_id = ?
          OR (o.session_id != ? AND o.paid_at IS NOT NULL AND b.delivery_token IS NULL AND b.bundle_status = 'SINGLE')
        )
    `).all(customer_id, session_id, session_id);

    if (orders.length < 2) {
      return { merged: false, message: '병합할 주문이 2건 미만입니다' };
    }

    // 새 MERGED 번들 생성
    const newBundle = db.prepare(
      "INSERT INTO delivery_bundle (customer_id, bundle_status) VALUES (?, 'MERGED')"
    ).run(customer_id);
    const newBundleId = newBundle.lastInsertRowid;

    // 주문들의 bundle_id 업데이트
    const updateStmt = db.prepare('UPDATE "order" SET bundle_id = ? WHERE order_id = ?');
    const oldBundleIds = new Set();
    for (const o of orders) {
      oldBundleIds.add(o.bundle_id);
      updateStmt.run(newBundleId, o.order_id);
    }

    // 비어있는 이전 번들 삭제
    const deleteStmt = db.prepare(
      'DELETE FROM delivery_bundle WHERE bundle_id = ? AND (SELECT COUNT(*) FROM "order" WHERE bundle_id = ?) = 0'
    );
    for (const bid of oldBundleIds) {
      deleteStmt.run(bid, bid);
    }

    return { merged: true, new_bundle_id: newBundleId, order_count: orders.length };
  });

  try {
    const result = tx();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
