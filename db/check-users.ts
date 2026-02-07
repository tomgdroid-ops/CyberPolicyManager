import { Pool } from "pg";

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_MDRrigq17LGu@ep-calm-night-ai4qscfu-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require",
  ssl: { rejectUnauthorized: false }
});

async function check() {
  try {
    const result = await pool.query("SELECT id, email, name, is_super_admin, is_active FROM users");
    console.log("Users:", JSON.stringify(result.rows, null, 2));

    const orgs = await pool.query("SELECT id, name, slug FROM organizations");
    console.log("Organizations:", JSON.stringify(orgs.rows, null, 2));

    const members = await pool.query("SELECT om.*, u.email FROM organization_members om JOIN users u ON om.user_id = u.id");
    console.log("Members:", JSON.stringify(members.rows, null, 2));
  } finally {
    await pool.end();
  }
}

check();
