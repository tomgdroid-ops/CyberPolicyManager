import { Pool } from "pg";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_MDRrigq17LGu@ep-calm-night-ai4qscfu-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function query(text: string, params?: unknown[]) {
  return pool.query(text, params);
}

async function seedHIPAA() {
  console.log("Seeding HIPAA framework...");

  // Insert HIPAA framework
  const frameworkResult = await query(
    `INSERT INTO frameworks (code, name, version, release_date, issuing_body, description, industry_applicability, total_controls, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (code) DO UPDATE SET name = $2, version = $3, updated_at = now()
     RETURNING id`,
    [
      "HIPAA",
      "Health Insurance Portability and Accountability Act",
      "2013",
      "2013-01-25",
      "U.S. Department of Health and Human Services (HHS)",
      "HIPAA establishes national standards to protect individuals' medical records and other personal health information. It applies to health plans, health care clearinghouses, and health care providers that conduct certain health care transactions electronically.",
      ["Healthcare", "Health Insurance", "Medical Devices", "Pharmaceuticals"],
      54,
      true,
    ]
  );
  const frameworkId = frameworkResult.rows[0].id;

  // Categories
  const categories = [
    { code: "ADMIN", name: "Administrative Safeguards", description: "Administrative actions, policies, and procedures to manage the selection, development, implementation, and maintenance of security measures." },
    { code: "PHYSICAL", name: "Physical Safeguards", description: "Physical measures, policies, and procedures to protect electronic information systems and related buildings and equipment." },
    { code: "TECHNICAL", name: "Technical Safeguards", description: "Technology and the policy and procedures for its use that protect electronic protected health information." },
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

  // Controls
  const controls = [
    // Administrative Safeguards (§164.308)
    { category: "ADMIN", code: "164.308(a)(1)(i)", title: "Security Management Process", description: "Implement policies and procedures to prevent, detect, contain, and correct security violations." },
    { category: "ADMIN", code: "164.308(a)(1)(ii)(A)", title: "Risk Analysis", description: "Conduct an accurate and thorough assessment of the potential risks and vulnerabilities to the confidentiality, integrity, and availability of electronic protected health information." },
    { category: "ADMIN", code: "164.308(a)(1)(ii)(B)", title: "Risk Management", description: "Implement security measures sufficient to reduce risks and vulnerabilities to a reasonable and appropriate level." },
    { category: "ADMIN", code: "164.308(a)(1)(ii)(C)", title: "Sanction Policy", description: "Apply appropriate sanctions against workforce members who fail to comply with security policies and procedures." },
    { category: "ADMIN", code: "164.308(a)(1)(ii)(D)", title: "Information System Activity Review", description: "Implement procedures to regularly review records of information system activity, such as audit logs, access reports, and security incident tracking reports." },
    { category: "ADMIN", code: "164.308(a)(2)", title: "Assigned Security Responsibility", description: "Identify the security official who is responsible for the development and implementation of security policies and procedures." },
    { category: "ADMIN", code: "164.308(a)(3)(i)", title: "Workforce Security", description: "Implement policies and procedures to ensure that all members of its workforce have appropriate access to electronic protected health information." },
    { category: "ADMIN", code: "164.308(a)(3)(ii)(A)", title: "Authorization and/or Supervision", description: "Implement procedures for the authorization and/or supervision of workforce members who work with electronic protected health information." },
    { category: "ADMIN", code: "164.308(a)(3)(ii)(B)", title: "Workforce Clearance Procedure", description: "Implement procedures to determine that the access of a workforce member to electronic protected health information is appropriate." },
    { category: "ADMIN", code: "164.308(a)(3)(ii)(C)", title: "Termination Procedures", description: "Implement procedures for terminating access to electronic protected health information when employment ends." },
    { category: "ADMIN", code: "164.308(a)(4)(i)", title: "Information Access Management", description: "Implement policies and procedures for authorizing access to electronic protected health information." },
    { category: "ADMIN", code: "164.308(a)(4)(ii)(B)", title: "Access Authorization", description: "Implement policies and procedures for granting access to electronic protected health information." },
    { category: "ADMIN", code: "164.308(a)(4)(ii)(C)", title: "Access Establishment and Modification", description: "Implement policies and procedures that establish, document, review, and modify a user's right of access to a workstation, transaction, program, or process." },
    { category: "ADMIN", code: "164.308(a)(5)(i)", title: "Security Awareness and Training", description: "Implement a security awareness and training program for all members of the workforce." },
    { category: "ADMIN", code: "164.308(a)(5)(ii)(A)", title: "Security Reminders", description: "Periodic security updates." },
    { category: "ADMIN", code: "164.308(a)(5)(ii)(B)", title: "Protection from Malicious Software", description: "Procedures for guarding against, detecting, and reporting malicious software." },
    { category: "ADMIN", code: "164.308(a)(5)(ii)(C)", title: "Log-in Monitoring", description: "Procedures for monitoring log-in attempts and reporting discrepancies." },
    { category: "ADMIN", code: "164.308(a)(5)(ii)(D)", title: "Password Management", description: "Procedures for creating, changing, and safeguarding passwords." },
    { category: "ADMIN", code: "164.308(a)(6)(i)", title: "Security Incident Procedures", description: "Implement policies and procedures to address security incidents." },
    { category: "ADMIN", code: "164.308(a)(6)(ii)", title: "Response and Reporting", description: "Identify and respond to suspected or known security incidents; mitigate harmful effects; and document incidents and outcomes." },
    { category: "ADMIN", code: "164.308(a)(7)(i)", title: "Contingency Plan", description: "Establish policies and procedures for responding to an emergency or other occurrence that damages systems containing ePHI." },
    { category: "ADMIN", code: "164.308(a)(7)(ii)(A)", title: "Data Backup Plan", description: "Establish and implement procedures to create and maintain retrievable exact copies of electronic protected health information." },
    { category: "ADMIN", code: "164.308(a)(7)(ii)(B)", title: "Disaster Recovery Plan", description: "Establish and implement procedures to restore any loss of data." },
    { category: "ADMIN", code: "164.308(a)(7)(ii)(C)", title: "Emergency Mode Operation Plan", description: "Establish and implement procedures to enable continuation of critical business processes for protection of ePHI while operating in emergency mode." },
    { category: "ADMIN", code: "164.308(a)(7)(ii)(D)", title: "Testing and Revision Procedures", description: "Implement procedures for periodic testing and revision of contingency plans." },
    { category: "ADMIN", code: "164.308(a)(7)(ii)(E)", title: "Applications and Data Criticality Analysis", description: "Assess the relative criticality of specific applications and data in support of other contingency plan components." },
    { category: "ADMIN", code: "164.308(a)(8)", title: "Evaluation", description: "Perform a periodic technical and nontechnical evaluation in response to environmental or operational changes." },
    { category: "ADMIN", code: "164.308(b)(1)", title: "Business Associate Contracts", description: "A covered entity may permit a business associate to create, receive, maintain, or transmit ePHI on the covered entity's behalf only if satisfactory assurances are obtained." },

    // Physical Safeguards (§164.310)
    { category: "PHYSICAL", code: "164.310(a)(1)", title: "Facility Access Controls", description: "Implement policies and procedures to limit physical access to electronic information systems and the facilities in which they are housed." },
    { category: "PHYSICAL", code: "164.310(a)(2)(i)", title: "Contingency Operations", description: "Establish procedures that allow facility access in support of restoration of lost data under the disaster recovery plan and emergency mode operations plan." },
    { category: "PHYSICAL", code: "164.310(a)(2)(ii)", title: "Facility Security Plan", description: "Implement policies and procedures to safeguard the facility and the equipment therein from unauthorized physical access, tampering, and theft." },
    { category: "PHYSICAL", code: "164.310(a)(2)(iii)", title: "Access Control and Validation Procedures", description: "Implement procedures to control and validate a person's access to facilities based on their role or function." },
    { category: "PHYSICAL", code: "164.310(a)(2)(iv)", title: "Maintenance Records", description: "Implement policies and procedures to document repairs and modifications to the physical components of a facility related to security." },
    { category: "PHYSICAL", code: "164.310(b)", title: "Workstation Use", description: "Implement policies and procedures that specify the proper functions to be performed, the manner in which those functions are to be performed, and the physical attributes of the surroundings of a specific workstation or class of workstation." },
    { category: "PHYSICAL", code: "164.310(c)", title: "Workstation Security", description: "Implement physical safeguards for all workstations that access electronic protected health information, to restrict access to authorized users." },
    { category: "PHYSICAL", code: "164.310(d)(1)", title: "Device and Media Controls", description: "Implement policies and procedures that govern the receipt and removal of hardware and electronic media that contain ePHI into and out of a facility." },
    { category: "PHYSICAL", code: "164.310(d)(2)(i)", title: "Disposal", description: "Implement policies and procedures to address the final disposition of electronic protected health information and/or the hardware or electronic media on which it is stored." },
    { category: "PHYSICAL", code: "164.310(d)(2)(ii)", title: "Media Re-use", description: "Implement procedures for removal of electronic protected health information from electronic media before the media are made available for re-use." },
    { category: "PHYSICAL", code: "164.310(d)(2)(iii)", title: "Accountability", description: "Maintain a record of the movements of hardware and electronic media and any person responsible therefore." },
    { category: "PHYSICAL", code: "164.310(d)(2)(iv)", title: "Data Backup and Storage", description: "Create a retrievable, exact copy of electronic protected health information, when needed, before movement of equipment." },

    // Technical Safeguards (§164.312)
    { category: "TECHNICAL", code: "164.312(a)(1)", title: "Access Control", description: "Implement technical policies and procedures for electronic information systems that maintain electronic protected health information to allow access only to authorized persons or software programs." },
    { category: "TECHNICAL", code: "164.312(a)(2)(i)", title: "Unique User Identification", description: "Assign a unique name and/or number for identifying and tracking user identity." },
    { category: "TECHNICAL", code: "164.312(a)(2)(ii)", title: "Emergency Access Procedure", description: "Establish and implement procedures for obtaining necessary electronic protected health information during an emergency." },
    { category: "TECHNICAL", code: "164.312(a)(2)(iii)", title: "Automatic Logoff", description: "Implement electronic procedures that terminate an electronic session after a predetermined time of inactivity." },
    { category: "TECHNICAL", code: "164.312(a)(2)(iv)", title: "Encryption and Decryption", description: "Implement a mechanism to encrypt and decrypt electronic protected health information." },
    { category: "TECHNICAL", code: "164.312(b)", title: "Audit Controls", description: "Implement hardware, software, and/or procedural mechanisms that record and examine activity in information systems that contain or use electronic protected health information." },
    { category: "TECHNICAL", code: "164.312(c)(1)", title: "Integrity", description: "Implement policies and procedures to protect electronic protected health information from improper alteration or destruction." },
    { category: "TECHNICAL", code: "164.312(c)(2)", title: "Mechanism to Authenticate ePHI", description: "Implement electronic mechanisms to corroborate that electronic protected health information has not been altered or destroyed in an unauthorized manner." },
    { category: "TECHNICAL", code: "164.312(d)", title: "Person or Entity Authentication", description: "Implement procedures to verify that a person or entity seeking access to electronic protected health information is the one claimed." },
    { category: "TECHNICAL", code: "164.312(e)(1)", title: "Transmission Security", description: "Implement technical security measures to guard against unauthorized access to electronic protected health information that is being transmitted over an electronic communications network." },
    { category: "TECHNICAL", code: "164.312(e)(2)(i)", title: "Integrity Controls", description: "Implement security measures to ensure that electronically transmitted electronic protected health information is not improperly modified without detection." },
    { category: "TECHNICAL", code: "164.312(e)(2)(ii)", title: "Encryption", description: "Implement a mechanism to encrypt electronic protected health information whenever deemed appropriate." },
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

  // Update control count
  await query(`UPDATE frameworks SET total_controls = $1 WHERE id = $2`, [controls.length, frameworkId]);

  console.log(`HIPAA seeded: ${controls.length} controls`);
}

seedHIPAA()
  .then(() => {
    console.log("Done!");
    pool.end();
  })
  .catch((err) => {
    console.error("Error:", err);
    pool.end();
    process.exit(1);
  });
