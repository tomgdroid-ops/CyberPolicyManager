import { Pool } from "pg";

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_MDRrigq17LGu@ep-calm-night-ai4qscfu-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require",
  ssl: { rejectUnauthorized: false }
});

async function check() {
  // Check admin user memberships
  const userResult = await pool.query(`
    SELECT u.id, u.email, u.name, u.is_super_admin
    FROM users u
    WHERE u.email = 'admin@policyvault.local'
  `);
  console.log("Admin user:", userResult.rows[0]);

  if (userResult.rows[0]) {
    const userId = userResult.rows[0].id;

    // Check memberships
    const memberships = await pool.query(`
      SELECT om.*, o.name as org_name, o.slug
      FROM organization_members om
      JOIN organizations o ON om.organization_id = o.id
      WHERE om.user_id = $1
    `, [userId]);

    console.log("\nAdmin's organization memberships:", memberships.rows);
  }

  // Check all active orgs
  const orgsResult = await pool.query("SELECT id, name, slug FROM organizations WHERE is_active = true");
  console.log("\nAll active orgs:", orgsResult.rows);

  await pool.end();
}

check();
