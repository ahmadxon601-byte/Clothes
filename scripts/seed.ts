/**
 * Seed script - creates or updates the initial admin user.
 * Run once: npx tsx scripts/seed.ts
 * Make sure .env.local is present (or env vars are exported).
 */

import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || "pos",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD,
});

async function main() {
  const name = "Admin123";
  const email = "admin@qulaymarket.uz";
  const plainPassword = "Ahmadxon123";
  const hash = await bcrypt.hash(plainPassword, 10);

  const existing = await pool.query(
    "SELECT id FROM users WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1"
  );

  if (existing.rows.length > 0) {
    await pool.query(
      `UPDATE users
       SET name = $1,
           email = $2,
           password_hash = $3,
           role = 'admin',
           updated_at = NOW()
       WHERE id = $4`,
      [name, email, hash, existing.rows[0].id]
    );

    console.log("Admin user updated:");
    console.log("  Login   :", name);
    console.log("  Email   :", email);
    console.log("  Password:", plainPassword);
    return;
  }

  await pool.query(
    "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)",
    [name, email, hash, "admin"]
  );

  console.log("Admin user created:");
  console.log("  Login   :", name);
  console.log("  Email   :", email);
  console.log("  Password:", plainPassword);
}

main()
  .catch(console.error)
  .finally(() => pool.end());
