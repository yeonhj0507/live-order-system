require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./db');

const sqlDir = path.join(__dirname, '..', 'database');

async function runFile(file) {
  const sql = fs.readFileSync(path.join(sqlDir, file), 'utf-8');
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  for (const stmt of statements) {
    await pool.query(stmt);
  }
  console.log(`[OK] ${file}`);
}

async function init() {
  console.log('Initializing MySQL database...');
  await runFile('schema.sql');
  await runFile('views.sql');
  await runFile('seed.sql');
  console.log('Done.');
  await pool.end();
}

init().catch(err => { console.error(err); process.exit(1); });
