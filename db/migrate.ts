import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_MDRrigq17LGu@ep-calm-night-ai4qscfu-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function migrate() {
  const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  const client = await pool.connect();

  try {
    // Create migrations tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // Get already applied migrations
    const { rows: applied } = await client.query("SELECT name FROM _migrations ORDER BY id");
    const appliedSet = new Set(applied.map((r: { name: string }) => r.name));

    // Read migration files
    const migrationsDir = path.join(__dirname, "migrations");
    const files = fs.readdirSync(migrationsDir)
      .filter((f: string) => f.endsWith(".sql"))
      .sort();

    let count = 0;
    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`  Skipping (already applied): ${file}`);
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
      console.log(`  Applying: ${file}`);

      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO _migrations (name) VALUES ($1)", [file]);
        await client.query("COMMIT");
        count++;
      } catch (err) {
        await client.query("ROLLBACK");
        console.error(`  FAILED: ${file}`);
        throw err;
      }
    }

    if (count === 0) {
      console.log("  No new migrations to apply.");
    } else {
      console.log(`  Applied ${count} migration(s).`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

console.log("Running migrations...");
migrate()
  .then(() => {
    console.log("Migrations complete.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
