const db = require('./db');
const fs = require('fs');
const path = require('path');

const sqlDir = path.join(__dirname, '..', 'database');

function run(file) {
  const sql = fs.readFileSync(path.join(sqlDir, file), 'utf-8');
  db.exec(sql);
  console.log(`[OK] ${file}`);
}

console.log('Initializing database...');
run('schema.sql');
run('views.sql');
run('seed.sql');
console.log('Database initialized successfully.');
