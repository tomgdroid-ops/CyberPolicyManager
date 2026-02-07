import { Pool } from "pg";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_MDRrigq17LGu@ep-calm-night-ai4qscfu-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function query(text: string, params?: unknown[]) {
  return pool.query(text, params);
}

async function seedCMMCL1() {
  console.log("Seeding CMMC Level 1 framework...");

  const frameworkResult = await query(
    `INSERT INTO frameworks (code, name, version, release_date, issuing_body, description, industry_applicability, total_controls, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (code) DO UPDATE SET name = $2, version = $3, updated_at = now()
     RETURNING id`,
    [
      "CMMC-L1",
      "Cybersecurity Maturity Model Certification - Level 1 (Foundational)",
      "2.0",
      "2021-11-04",
      "U.S. Department of Defense (DoD)",
      "CMMC Level 1 focuses on the protection of Federal Contract Information (FCI). It encompasses 17 practices from FAR 52.204-21 that are basic safeguarding requirements for FCI.",
      ["Defense Contractors", "Government Contractors", "Manufacturing"],
      17,
      true,
    ]
  );
  const frameworkId = frameworkResult.rows[0].id;

  const categories = [
    { code: "AC", name: "Access Control", description: "Limit information system access to authorized users." },
    { code: "IA", name: "Identification and Authentication", description: "Identify and authenticate users." },
    { code: "MP", name: "Media Protection", description: "Sanitize or destroy media containing FCI." },
    { code: "PE", name: "Physical Protection", description: "Limit physical access to systems and equipment." },
    { code: "SC", name: "System and Communications Protection", description: "Monitor and control communications at system boundaries." },
    { code: "SI", name: "System and Information Integrity", description: "Identify, report, and correct information and system flaws." },
  ];

  const categoryIds: Record<string, string> = {};
  for (const cat of categories) {
    const result = await query(
      `INSERT INTO framework_categories (framework_id, category_code, category_name, description, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (framework_id, category_code) DO UPDATE SET category_name = $3
       RETURNING id`,
      [frameworkId, cat.code, cat.name, cat.description, categories.indexOf(cat)]
    );
    categoryIds[cat.code] = result.rows[0].id;
  }

  // CMMC Level 1 - 17 practices from FAR 52.204-21
  const controls = [
    // Access Control (AC)
    { category: "AC", code: "AC.L1-3.1.1", title: "Authorized Access Control", description: "Limit information system access to authorized users, processes acting on behalf of authorized users, or devices (including other information systems)." },
    { category: "AC", code: "AC.L1-3.1.2", title: "Transaction and Function Control", description: "Limit information system access to the types of transactions and functions that authorized users are permitted to execute." },
    { category: "AC", code: "AC.L1-3.1.20", title: "External Connections", description: "Verify and control/limit connections to and use of external information systems." },
    { category: "AC", code: "AC.L1-3.1.22", title: "Control Public Information", description: "Control information posted or processed on publicly accessible information systems." },

    // Identification and Authentication (IA)
    { category: "IA", code: "IA.L1-3.5.1", title: "Identification", description: "Identify information system users, processes acting on behalf of users, or devices." },
    { category: "IA", code: "IA.L1-3.5.2", title: "Authentication", description: "Authenticate (or verify) the identities of those users, processes, or devices, as a prerequisite to allowing access to organizational information systems." },

    // Media Protection (MP)
    { category: "MP", code: "MP.L1-3.8.3", title: "Media Disposal", description: "Sanitize or destroy information system media containing Federal Contract Information before disposal or release for reuse." },

    // Physical Protection (PE)
    { category: "PE", code: "PE.L1-3.10.1", title: "Limit Physical Access", description: "Limit physical access to organizational information systems, equipment, and the respective operating environments to authorized individuals." },
    { category: "PE", code: "PE.L1-3.10.3", title: "Escort Visitors", description: "Escort visitors and monitor visitor activity." },
    { category: "PE", code: "PE.L1-3.10.4", title: "Physical Access Logs", description: "Maintain audit logs of physical access." },
    { category: "PE", code: "PE.L1-3.10.5", title: "Manage Physical Access", description: "Control and manage physical access devices." },

    // System and Communications Protection (SC)
    { category: "SC", code: "SC.L1-3.13.1", title: "Boundary Protection", description: "Monitor, control, and protect organizational communications (i.e., information transmitted or received by organizational information systems) at the external boundaries and key internal boundaries of the information systems." },
    { category: "SC", code: "SC.L1-3.13.5", title: "Public-Access System Separation", description: "Implement subnetworks for publicly accessible system components that are physically or logically separated from internal networks." },

    // System and Information Integrity (SI)
    { category: "SI", code: "SI.L1-3.14.1", title: "Flaw Remediation", description: "Identify, report, and correct information and information system flaws in a timely manner." },
    { category: "SI", code: "SI.L1-3.14.2", title: "Malicious Code Protection", description: "Provide protection from malicious code at appropriate locations within organizational information systems." },
    { category: "SI", code: "SI.L1-3.14.4", title: "Update Malicious Code Protection", description: "Update malicious code protection mechanisms when new releases are available." },
    { category: "SI", code: "SI.L1-3.14.5", title: "System and File Scanning", description: "Perform periodic scans of the information system and real-time scans of files from external sources as files are downloaded, opened, or executed." },
  ];

  let sortOrder = 0;
  for (const ctrl of controls) {
    await query(
      `INSERT INTO framework_controls (framework_id, category_id, control_code, control_title, control_description, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (framework_id, control_code) DO UPDATE SET control_title = $4, control_description = $5`,
      [frameworkId, categoryIds[ctrl.category], ctrl.code, ctrl.title, ctrl.description, sortOrder++]
    );
  }

  await query(`UPDATE frameworks SET total_controls = $1 WHERE id = $2`, [controls.length, frameworkId]);
  console.log(`CMMC Level 1 seeded: ${controls.length} controls`);
}

seedCMMCL1()
  .then(() => {
    console.log("Done!");
    pool.end();
  })
  .catch((err) => {
    console.error("Error:", err);
    pool.end();
    process.exit(1);
  });
