const { Router } = require('express');
const pool = require('../db');
const dm = require('../services/dmService');

const router = Router();

router.get('/csv/:sessionId', async (req, res) => {
  const [rows] = await pool.query(`
    SELECT
      b.delivery_recipient,
      b.delivery_address,
      b.delivery_phone,
      o.order_price,
      o.order_token,
      c.customer_id
    FROM delivery_bundle b
    JOIN \`order\` o  ON o.bundle_id   = b.bundle_id
    JOIN customer c ON o.customer_id = c.customer_id
    WHERE o.session_id = ?
    ORDER BY b.bundle_id
  `, [req.params.sessionId]);

  const BOM = '﻿';
  let csv = BOM + 'recipient,address,phone,tracking_no,note\r\n';
  for (const r of rows) {
    const label = `(${r.customer_id}) -- ${r.order_token}`;
    csv += `"${r.delivery_recipient || ''}","${r.delivery_address || ''}","${r.delivery_phone || ''}","","${label}"\r\n`;
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="session_${req.params.sessionId}_delivery.csv"`);
  res.send(csv);
});

router.get('/dm-log', (req, res) => {
  res.json(dm.getLog());
});

module.exports = router;
