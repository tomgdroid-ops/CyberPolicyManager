import { Pool } from "pg";
import bcrypt from "bcryptjs";

const DATABASE_URL =
  "postgresql://neondb_owner:npg_MDRrigq17LGu@ep-calm-night-ai4qscfu-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Demo Organizations - use exact framework codes from database
const organizations = [
  {
    name: "Apex Healthcare Systems",
    slug: "apex-healthcare",
    industry: "Healthcare",
    description: "Regional healthcare provider with 12 hospitals and 50+ clinics across the Midwest.",
    frameworks: ["HIPAA"], // Healthcare needs HIPAA
  },
  {
    name: "TechDefense Solutions",
    slug: "techdefense",
    industry: "Defense Contracting",
    description: "Cybersecurity and IT services provider for federal defense contractors.",
    frameworks: ["NIST-800-171", "CMMC-L2"], // Defense contractor needs both
  },
  {
    name: "GlobalFinance Corp",
    slug: "globalfinance",
    industry: "Financial Services",
    description: "International financial services and investment management firm.",
    frameworks: ["NIST-CSF-2.0"],
  },
  {
    name: "EuroData Analytics",
    slug: "eurodata",
    industry: "Data Analytics",
    description: "European data analytics company serving clients across EU and UK.",
    frameworks: ["GDPR"],
  },
  {
    name: "SecureCloud Innovations",
    slug: "securecloud",
    industry: "Cloud Services",
    description: "Cloud infrastructure and managed security services provider.",
    frameworks: ["NIST-800-53"],
  },
];

// Demo Users for each organization
const demoUsers = [
  { name: "Sarah Chen", email: "sarah.chen@apexhealth.com", role: "org_admin" },
  { name: "Michael Torres", email: "m.torres@techdefense.com", role: "org_admin" },
  { name: "Jennifer Walsh", email: "j.walsh@globalfinance.com", role: "org_admin" },
  { name: "Hans Mueller", email: "h.mueller@eurodata.eu", role: "org_admin" },
  { name: "David Kim", email: "d.kim@securecloud.io", role: "org_admin" },
];

// Policies per organization - realistic policy names
const policySets: Record<string, { code: string; name: string; description: string; department: string }[]> = {
  "apex-healthcare": [
    { code: "AHS-SEC-001", name: "Protected Health Information Security Policy", description: "Defines requirements for protecting PHI in all systems and processes.", department: "Information Security" },
    { code: "AHS-SEC-002", name: "Access Control and Authentication Policy", description: "Establishes access control requirements for healthcare systems.", department: "Information Security" },
    { code: "AHS-PRI-001", name: "Patient Privacy Policy", description: "Outlines patient privacy rights and organizational obligations.", department: "Compliance" },
    { code: "AHS-SEC-003", name: "Encryption and Data Protection Policy", description: "Requirements for encrypting PHI at rest and in transit.", department: "Information Security" },
    { code: "AHS-OPS-001", name: "Business Associate Agreement Policy", description: "Requirements for third-party vendor agreements involving PHI.", department: "Legal" },
    { code: "AHS-SEC-004", name: "Audit Logging and Monitoring Policy", description: "Requirements for logging access to PHI and security monitoring.", department: "Information Security" },
    { code: "AHS-HR-001", name: "Workforce Security Training Policy", description: "Mandatory HIPAA training requirements for all employees.", department: "Human Resources" },
    { code: "AHS-OPS-002", name: "Incident Response and Breach Notification Policy", description: "Procedures for responding to and reporting security incidents.", department: "Compliance" },
  ],
  "techdefense": [
    { code: "TDS-SEC-001", name: "Controlled Unclassified Information Policy", description: "Protection requirements for CUI in accordance with DFARS.", department: "Security Operations" },
    { code: "TDS-SEC-002", name: "System Access Control Policy", description: "Access control requirements for information systems.", department: "Security Operations" },
    { code: "TDS-SEC-003", name: "Media Protection Policy", description: "Requirements for protecting and sanitizing media containing CUI.", department: "Security Operations" },
    { code: "TDS-SEC-004", name: "Personnel Security Policy", description: "Background check and clearance requirements.", department: "Human Resources" },
    { code: "TDS-SEC-005", name: "Physical Security Policy", description: "Physical protection requirements for facilities.", department: "Facilities" },
    { code: "TDS-SEC-006", name: "Incident Response Policy", description: "Procedures for security incident handling and reporting.", department: "Security Operations" },
    { code: "TDS-SEC-007", name: "Risk Assessment Policy", description: "Requirements for conducting periodic risk assessments.", department: "Security Operations" },
    { code: "TDS-SEC-008", name: "Configuration Management Policy", description: "Baseline configurations and change management.", department: "IT Operations" },
    { code: "TDS-SEC-009", name: "Audit and Accountability Policy", description: "Logging, monitoring, and audit requirements.", department: "Security Operations" },
    { code: "TDS-SEC-010", name: "System and Communications Protection Policy", description: "Boundary protection and encryption requirements.", department: "IT Operations" },
  ],
  "globalfinance": [
    { code: "GFC-GOV-001", name: "Cybersecurity Governance Policy", description: "Establishes cybersecurity governance structure and responsibilities.", department: "Executive" },
    { code: "GFC-SEC-001", name: "Information Asset Classification Policy", description: "Classification and handling of information assets.", department: "Information Security" },
    { code: "GFC-SEC-002", name: "Identity and Access Management Policy", description: "Requirements for identity management and access controls.", department: "Information Security" },
    { code: "GFC-SEC-003", name: "Network Security Policy", description: "Network architecture and security requirements.", department: "IT Infrastructure" },
    { code: "GFC-SEC-004", name: "Endpoint Protection Policy", description: "Security requirements for endpoints and workstations.", department: "IT Operations" },
    { code: "GFC-OPS-001", name: "Vulnerability Management Policy", description: "Vulnerability scanning and remediation requirements.", department: "Security Operations" },
    { code: "GFC-OPS-002", name: "Security Awareness Training Policy", description: "Training requirements for all employees.", department: "Human Resources" },
    { code: "GFC-OPS-003", name: "Third Party Risk Management Policy", description: "Vendor security assessment requirements.", department: "Procurement" },
    { code: "GFC-INC-001", name: "Incident Response Policy", description: "Security incident detection and response procedures.", department: "Security Operations" },
    { code: "GFC-REC-001", name: "Business Continuity and Disaster Recovery Policy", description: "BC/DR planning and testing requirements.", department: "IT Operations" },
  ],
  "eurodata": [
    { code: "EDA-PRI-001", name: "Data Protection Policy", description: "Comprehensive data protection policy aligned with GDPR.", department: "Data Protection" },
    { code: "EDA-PRI-002", name: "Privacy Notice Policy", description: "Requirements for privacy notices and consent management.", department: "Legal" },
    { code: "EDA-PRI-003", name: "Data Subject Rights Policy", description: "Procedures for handling data subject access requests.", department: "Data Protection" },
    { code: "EDA-PRI-004", name: "Data Retention and Deletion Policy", description: "Data retention schedules and secure deletion procedures.", department: "Data Protection" },
    { code: "EDA-SEC-001", name: "Data Security Policy", description: "Technical and organizational security measures.", department: "Information Security" },
    { code: "EDA-OPS-001", name: "Data Processing Agreement Policy", description: "Requirements for data processor agreements.", department: "Legal" },
    { code: "EDA-OPS-002", name: "Cross-Border Data Transfer Policy", description: "Requirements for international data transfers.", department: "Legal" },
    { code: "EDA-INC-001", name: "Data Breach Response Policy", description: "72-hour breach notification procedures.", department: "Data Protection" },
  ],
  "securecloud": [
    { code: "SCI-SEC-001", name: "Access Control Policy", description: "Comprehensive access control requirements.", department: "Security Engineering" },
    { code: "SCI-SEC-002", name: "Audit and Accountability Policy", description: "Logging and audit trail requirements.", department: "Security Operations" },
    { code: "SCI-SEC-003", name: "Security Assessment Policy", description: "Continuous monitoring and assessment requirements.", department: "Security Engineering" },
    { code: "SCI-SEC-004", name: "Configuration Management Policy", description: "Secure baseline configurations.", department: "DevOps" },
    { code: "SCI-SEC-005", name: "Contingency Planning Policy", description: "Business continuity and disaster recovery.", department: "Operations" },
    { code: "SCI-SEC-006", name: "Identification and Authentication Policy", description: "Multi-factor authentication requirements.", department: "Security Engineering" },
    { code: "SCI-SEC-007", name: "Incident Response Policy", description: "Security incident handling procedures.", department: "Security Operations" },
    { code: "SCI-SEC-008", name: "System and Information Integrity Policy", description: "Malware protection and integrity monitoring.", department: "Security Engineering" },
    { code: "SCI-SEC-009", name: "Media Protection Policy", description: "Media handling and sanitization.", department: "Operations" },
    { code: "SCI-SEC-010", name: "Personnel Security Policy", description: "Background checks and termination procedures.", department: "Human Resources" },
  ],
};

// Sample policy document content
const samplePolicyContent = `
1. PURPOSE
This policy establishes the requirements and standards for maintaining information security and protecting organizational assets.

2. SCOPE
This policy applies to all employees, contractors, and third parties who access organizational information systems.

3. POLICY STATEMENT
3.1 All users must follow established security protocols.
3.2 Access to systems must be authorized and documented.
3.3 Security incidents must be reported immediately.

4. ROLES AND RESPONSIBILITIES
4.1 Information Security Team - Oversees policy implementation
4.2 Department Managers - Ensure compliance within their teams
4.3 All Users - Follow security policies and report incidents

5. COMPLIANCE
Violations of this policy may result in disciplinary action up to and including termination.

6. REVIEW
This policy will be reviewed annually and updated as necessary.
`;

async function seedDemoData() {
  const client = await pool.connect();

  try {
    console.log("Starting demo data seed...\n");

    // Get framework IDs
    const frameworksResult = await client.query("SELECT id, code, name FROM frameworks");
    const frameworkMap = new Map(frameworksResult.rows.map((f) => [f.code, f.id]));
    const frameworkNameMap = new Map(frameworksResult.rows.map((f) => [f.name, f.id]));

    console.log("Available frameworks:", Array.from(frameworkMap.keys()));

    // Get the admin user ID
    const adminResult = await client.query("SELECT id FROM users WHERE email = 'admin@policyvault.local'");
    const adminId = adminResult.rows[0]?.id;

    if (!adminId) {
      throw new Error("Admin user not found. Run the main seed first.");
    }

    const passwordHash = await bcrypt.hash("demo123", 12);

    for (let i = 0; i < organizations.length; i++) {
      const org = organizations[i];
      const user = demoUsers[i];
      const policies = policySets[org.slug];

      console.log(`\n--- Creating ${org.name} ---`);

      // Create organization
      const orgResult = await client.query(
        `INSERT INTO organizations (name, slug, industry, description)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [org.name, org.slug, org.industry, org.description]
      );
      const orgId = orgResult.rows[0].id;
      console.log(`  Created organization: ${org.name} (${orgId})`);

      // Create user for this organization
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, name, is_super_admin, is_active)
         VALUES ($1, $2, $3, false, true)
         ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [user.email, passwordHash, user.name]
      );
      const userId = userResult.rows[0].id;
      console.log(`  Created user: ${user.name} (${user.email})`);

      // Add user as org_admin
      await client.query(
        `INSERT INTO organization_members (organization_id, user_id, role, is_primary)
         VALUES ($1, $2, 'org_admin', true)
         ON CONFLICT (organization_id, user_id) DO NOTHING`,
        [orgId, userId]
      );

      // Also add the super admin to this org
      await client.query(
        `INSERT INTO organization_members (organization_id, user_id, role, is_primary)
         VALUES ($1, $2, 'org_admin', false)
         ON CONFLICT (organization_id, user_id) DO NOTHING`,
        [orgId, adminId]
      );

      // Create policies
      let draftCount = 0;
      let reviewCount = 0;
      let finalizedCount = 0;

      for (let j = 0; j < policies.length; j++) {
        const policy = policies[j];

        // Vary the status: most finalized, some in review, couple drafts
        let status: string;
        if (j < 2) {
          status = "draft";
          draftCount++;
        } else if (j < 4) {
          status = "review";
          reviewCount++;
        } else {
          status = "finalized";
          finalizedCount++;
        }

        // Add some variety in review dates
        const reviewDate = new Date();
        reviewDate.setMonth(reviewDate.getMonth() + Math.floor(Math.random() * 12) + 1);

        const effectiveDate = new Date();
        effectiveDate.setMonth(effectiveDate.getMonth() - Math.floor(Math.random() * 6));

        // Check if policy already exists
        const existingPolicy = await client.query(
          `SELECT id FROM policies WHERE organization_id = $1 AND policy_code = $2`,
          [orgId, policy.code]
        );

        if (existingPolicy.rows.length > 0) {
          continue; // Skip if already exists
        }

        await client.query(
          `INSERT INTO policies (
            organization_id, policy_code, policy_name, description, scope,
            owner_id, author_id, department, status, classification,
            effective_date, review_date, review_frequency_months,
            document_content_text
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [
            orgId,
            policy.code,
            policy.name,
            policy.description,
            "Enterprise-wide",
            userId,
            userId,
            policy.department,
            status,
            "Internal",
            effectiveDate,
            reviewDate,
            12,
            status === "finalized" ? samplePolicyContent : null,
          ]
        );
      }

      console.log(`  Created ${policies.length} policies (${draftCount} draft, ${reviewCount} review, ${finalizedCount} finalized)`);

      // Get framework IDs for this org
      for (const fwName of org.frameworks) {
        // Try to match by code first, then by name
        let fwId = frameworkMap.get(fwName);
        if (!fwId) {
          // Try to find by partial name match
          for (const [name, id] of frameworkNameMap.entries()) {
            if (name.toLowerCase().includes(fwName.toLowerCase()) || fwName.toLowerCase().includes(name.toLowerCase())) {
              fwId = id;
              break;
            }
          }
        }

        if (fwId) {
          console.log(`  Associated framework: ${fwName}`);

          // Check if analysis already exists
          const existingAnalysis = await client.query(
            `SELECT id FROM analysis_results WHERE organization_id = $1 AND framework_id = $2 LIMIT 1`,
            [orgId, fwId]
          );

          if (existingAnalysis.rows.length > 0) {
            console.log(`  Analysis already exists for this framework`);
            continue;
          }

          // Create an analysis result for finalized policies
          const analysisResult = await client.query(
            `INSERT INTO analysis_results (organization_id, framework_id, triggered_by, status, total_controls, controls_fully_covered, controls_partially_covered, controls_not_covered, overall_score)
             VALUES ($1, $2, $3, 'completed', 100, $4, $5, $6, $7)
             RETURNING id`,
            [
              orgId,
              fwId,
              userId,
              Math.floor(40 + Math.random() * 30), // 40-70 fully covered
              Math.floor(10 + Math.random() * 15), // 10-25 partial
              Math.floor(10 + Math.random() * 20), // 10-30 not covered
              Math.floor(60 + Math.random() * 25), // 60-85% score
            ]
          );

          if (analysisResult.rows[0]) {
            console.log(`  Created analysis result with score`);
          }
        } else {
          console.log(`  Warning: Framework "${fwName}" not found`);
        }
      }
    }

    console.log("\n✅ Demo data seeding complete!");
    console.log("\n📋 Demo Credentials:");
    console.log("   All demo users password: demo123");
    console.log("   Super Admin: admin@policyvault.local / admin123");
    console.log("\n   Organization Admins:");
    demoUsers.forEach((u) => {
      console.log(`   - ${u.email} (${u.name})`);
    });
  } catch (error) {
    console.error("Error seeding demo data:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedDemoData();
