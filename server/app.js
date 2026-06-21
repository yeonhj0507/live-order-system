const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(cors());
app.use(express.json());

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

// Vercel에서는 export, 로컬에서는 listen
if (process.env.VERCEL) {
  module.exports = app;
} else {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
