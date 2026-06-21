const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const dm = require('../services/dmService');

const router = Router();

// 주문 생성 (제안서 ORDER CREATION 로직)
router.post('/', (req, res) => {
  const { session_id, customer_id, customer_nickname, order_price } = req.body;
  if (!session_id || !customer_id || !order_price) {
    return res.status(400).json({ error: 'session_id, customer_id, order_price 필수' });
  }

  const tx = db.transaction(() => {
    // 1. customer 없으면 INSERT
    const existing = db.prepare('SELECT customer_id FROM customer WHERE customer_id = ?').get(customer_id);
    if (!existing) {
      db.prepare('INSERT INTO customer (customer_id, customer_nickname) VALUES (?, ?)')
        .run(customer_id, customer_nickname || customer_id);
    }

    // 2. UUID order_token 생성
    const orderToken = uuidv4();

    // 3. delivery_bundle SINGLE 생성
    const bundleResult = db.prepare(
      "INSERT INTO delivery_bundle (customer_id, bundle_status) VALUES (?, 'SINGLE')"
    ).run(customer_id);
    const bundleId = bundleResult.lastInsertRowid;

    // 4. order INSERT (paid_at = NULL)
    const orderResult = db.prepare(`
      INSERT INTO "order" (session_id, customer_id, bundle_id, order_price, order_token)
      VALUES (?, ?, ?, ?, ?)
    `).run(session_id, customer_id, bundleId, order_price, orderToken);

    // 5. Mock DM 발송
    dm.sendPaymentLink(customer_id, orderToken);

    return {
      order_id: orderResult.lastInsertRowid,
      order_token: orderToken,
      bundle_id: bundleId,
    };
  });

  try {
    const result = tx();
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 주문 상세 (토큰으로 조회 - 결제 페이지용)
router.get('/token/:token', (req, res) => {
  const row = db.prepare('SELECT * FROM v_order_status WHERE order_token = ?').get(req.params.token);
  if (!row) return res.status(404).json({ error: '주문을 찾을 수 없습니다' });
  res.json(row);
});

// 결제 처리 (제안서 PAYMENT LOGIC)
router.post('/:id/pay', (req, res) => {
  const orderId = req.params.id;

  const tx = db.transaction(() => {
    // 1. paid_at UPDATE
    db.prepare('UPDATE "order" SET paid_at = datetime(\'now\', \'localtime\') WHERE order_id = ?')
      .run(orderId);

    // 2. 해당 bundle의 미입금 건수 확인
    const order = db.prepare('SELECT * FROM "order" WHERE order_id = ?').get(orderId);
    if (!order) throw new Error('주문을 찾을 수 없습니다');

    const unpaid = db.prepare(
      'SELECT COUNT(*) AS cnt FROM "order" WHERE bundle_id = ? AND paid_at IS NULL'
    ).get(order.bundle_id);

    // 3. 전액 입금 시 delivery_token 생성 + DM 발송
    if (unpaid.cnt === 0) {
      const deliveryToken = uuidv4();
      db.prepare('UPDATE delivery_bundle SET delivery_token = ? WHERE bundle_id = ?')
        .run(deliveryToken, order.bundle_id);
      dm.sendDeliveryLink(order.customer_id, deliveryToken);
      return { paid: true, all_paid: true, delivery_token: deliveryToken };
    }

    return { paid: true, all_paid: false, remaining: unpaid.cnt };
  });

  try {
    const result = tx();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 스크린샷 등록 (라이브 중 캡처 확인 → PENDING→UNPAID 전환)
router.patch('/:id/screenshot', (req, res) => {
  const orderId = req.params.id;
  const screenshotPath = `screenshots/order_${orderId}_${Date.now()}.png`;
  const result = db.prepare('UPDATE "order" SET order_screenshot = ? WHERE order_id = ?')
    .run(screenshotPath, orderId);
  if (result.changes === 0) return res.status(404).json({ error: '주문을 찾을 수 없습니다' });
  res.json({ ok: true, order_screenshot: screenshotPath });
});

// 전체 주문 목록
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM v_order_status ORDER BY ordered_at DESC').all();
  res.json(rows);
});

module.exports = router;
