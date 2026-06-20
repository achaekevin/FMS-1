/**
 * Run with: node scripts/reset-passwords.js
 * Resets passwords for the three default system accounts.
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/sequelize');

const ACCOUNTS = [
  { email: 'admin@ktpag.org',     password: 'admin123',     role: 'administrator' },
  { email: 'pastor@ktpag.org',    password: 'pastor123',    role: 'pastor'        },
  { email: 'treasurer@ktpag.org', password: 'treasurer123', role: 'treasurer'     },
];

async function run() {
  await sequelize.authenticate();
  console.log('Connected to database.\n');

  for (const acc of ACCOUNTS) {
    const hash = await bcrypt.hash(acc.password, 12);
    const [rows] = await sequelize.query(
      `UPDATE users SET password = ? WHERE email = ?`,
      { replacements: [hash, acc.email] }
    );
    const affected = rows.affectedRows ?? 0;
    if (affected > 0) {
      console.log(`✓ ${acc.role.padEnd(15)} ${acc.email}  →  password: ${acc.password}`);
    } else {
      // User doesn't exist — create it
      const [result] = await sequelize.query(
        `INSERT INTO users (name, email, password, role, status, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, 'active', NOW(), NOW())`,
        { replacements: [acc.role.charAt(0).toUpperCase() + acc.role.slice(1), acc.email, hash, acc.role] }
      );
      console.log(`+ Created ${acc.role.padEnd(13)} ${acc.email}  →  password: ${acc.password}`);
    }
  }

  console.log('\nDone. You can now log in with the credentials above.');
  process.exit(0);
}

run().catch(err => { console.error('Error:', err.message); process.exit(1); });
