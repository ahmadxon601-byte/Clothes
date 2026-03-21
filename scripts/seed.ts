/**
 * Seed script — creates the initial admin user.
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
  const email = "admin@clothes.uz";
  const plainPassword = "Admin@123456"; // ← change after first login

  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [
    email,
  ]);

  if (existing.rows.length > 0) {
    console.log("✅ Admin already exists — skipping.");
    return;
  }

  const hash = await bcrypt.hash(plainPassword, 10);
  await pool.query(
    "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)",
    ["Admin", email, hash, "admin"]
  );

  console.log("✅ Admin user created:");
  console.log("   Email   :", email);
  console.log("   Password:", plainPassword);
  console.log("   ⚠️  Change the password after first login!");
}

main()
  .catch(console.error)
  .finally(() => pool.end());
