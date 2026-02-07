import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_MDRrigq17LGu@ep-calm-night-ai4qscfu-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require",
  ssl: { rejectUnauthorized: false }
});

async function verify() {
  try {
    const result = await pool.query(
      "SELECT id, email, password_hash, is_active, is_super_admin FROM users WHERE email = $1",
      ["admin@policyvault.local"]
    );

    const user = result.rows[0];
    if (!user) {
      console.log("User not found!");
      return;
    }

    console.log("User ID:", user.id);
    console.log("Email:", user.email);
    console.log("Is Active:", user.is_active);
    console.log("Is Super Admin:", user.is_super_admin);
    console.log("Password hash:", user.password_hash);
    console.log("Hash starts with $2:", user.password_hash?.startsWith("$2"));

    // Test password comparison
    const testPassword = "admin123";
    const isValid = await bcrypt.compare(testPassword, user.password_hash);
    console.log(`\nPassword '${testPassword}' matches:`, isValid);

    // Generate a new hash to compare format
    const newHash = await bcrypt.hash("admin123", 12);
    console.log("\nNew hash for comparison:", newHash);

  } finally {
    await pool.end();
  }
}

verify();
