/**
 * Run: node scripts/change-db-password.js
 * Changes the MySQL root password and updates .env
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const fs    = require('fs');
const path  = require('path');

const NEW_PASSWORD = 'GLC@Secure2026!';
const ENV_FILE     = path.join(__dirname, '../.env');

async function run() {
  console.log('Connecting to MySQL...');
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    port:     process.env.DB_PORT     || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  console.log('Connected. Changing root password...');
  await conn.execute(
    `ALTER USER 'root'@'localhost' IDENTIFIED BY ?; FLUSH PRIVILEGES;`,
    [NEW_PASSWORD]
  ).catch(async () => {
    // Try older MySQL syntax
    await conn.execute(`SET PASSWORD FOR 'root'@'localhost' = PASSWORD(?)`, [NEW_PASSWORD]);
    await conn.execute(`FLUSH PRIVILEGES`);
  });

  await conn.end();
  console.log('✓ MySQL password changed successfully.\n');

  // Update .env file
  let env = fs.readFileSync(ENV_FILE, 'utf8');
  env = env.replace(/DB_PASSWORD=.*/m, `DB_PASSWORD=${NEW_PASSWORD}`);
  fs.writeFileSync(ENV_FILE, env);
  console.log('✓ .env updated with new password.\n');

  console.log('New credentials:');
  console.log(`  DB_PASSWORD=${NEW_PASSWORD}`);
  console.log('\nRestart your backend server for changes to take effect.');
}

run().catch(err => {
  console.error('Failed:', err.message);
  process.exit(1);
});
