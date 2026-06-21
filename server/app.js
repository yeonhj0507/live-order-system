const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// DB 초기화 (테이블이 없으면 자동 생성)
const sqlDir = path.join(__dirname, '..', 'database');
const hasTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='live_session'").get();
if (!hasTable) {
  console.log('Initializing database...');
  db.exec(fs.readFileSync(path.join(sqlDir, 'schema.sql'), 'utf-8'));
  db.exec(fs.readFileSync(path.join(sqlDir, 'views.sql'), 'utf-8'));
  db.exec(fs.readFileSync(path.join(sqlDir, 'seed.sql'), 'utf-8'));
  console.log('Database initialized with seed data.');
} else {
  // 뷰는 매번 재생성
  db.exec('DROP VIEW IF EXISTS v_order_status');
  db.exec('DROP VIEW IF EXISTS v_session_revenue');
  db.exec('DROP VIEW IF EXISTS v_unpaid_orders');
  db.exec(fs.readFileSync(path.join(sqlDir, 'views.sql'), 'utf-8'));
}

// API 라우트
app.use('/api/sessions',  require('./routes/sessions'));
app.use('/api/orders',    require('./routes/orders'));
app.use('/api/bundles',   require('./routes/bundles'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/export',    require('./routes/export'));

// SPA fallback (빌드된 클라이언트 서빙)
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
