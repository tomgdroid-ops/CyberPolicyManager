import { Pool } from "pg";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_MDRrigq17LGu@ep-calm-night-ai4qscfu-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function query(text: string, params?: unknown[]) {
  return pool.query(text, params);
}

async function seedCMMCL2() {
  console.log("Seeding CMMC Level 2 framework...");

  const frameworkResult = await query(
    `INSERT INTO frameworks (code, name, version, release_date, issuing_body, description, industry_applicability, total_controls, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (code) DO UPDATE SET name = $2, version = $3, updated_at = now()
     RETURNING id`,
    [
      "CMMC-L2",
      "Cybersecurity Maturity Model Certification - Level 2 (Advanced)",
      "2.0",
      "2021-11-04",
      "U.S. Department of Defense (DoD)",
      "CMMC Level 2 focuses on the protection of Controlled Unclassified Information (CUI). It encompasses all 110 security requirements from NIST SP 800-171 Rev 2.",
      ["Defense Contractors", "Government Contractors", "Manufacturing", "Aerospace"],
      110,
      true,
    ]
  );
  const frameworkId = frameworkResult.rows[0].id;

  const categories = [
    { code: "AC", name: "Access Control", description: "Limit system access to authorized users, processes, and devices." },
    { code: "AT", name: "Awareness and Training", description: "Ensure personnel are aware of security risks and trained in their duties." },
    { code: "AU", name: "Audit and Accountability", description: "Create, protect, and retain system audit records." },
    { code: "CM", name: "Configuration Management", description: "Establish and maintain baseline configurations." },
    { code: "IA", name: "Identification and Authentication", description: "Identify and authenticate users, processes, and devices." },
    { code: "IR", name: "Incident Response", description: "Establish operational incident handling capabilities." },
    { code: "MA", name: "Maintenance", description: "Perform maintenance on organizational systems." },
    { code: "MP", name: "Media Protection", description: "Protect system media containing CUI." },
    { code: "PE", name: "Physical Protection", description: "Limit physical access to systems and facilities." },
    { code: "PS", name: "Personnel Security", description: "Screen individuals prior to authorizing access." },
    { code: "RA", name: "Risk Assessment", description: "Assess organizational risk." },
    { code: "CA", name: "Security Assessment", description: "Periodically assess security controls." },
    { code: "SC", name: "System and Communications Protection", description: "Monitor, control, and protect communications." },
    { code: "SI", name: "System and Information Integrity", description: "Identify, report, and correct system flaws." },
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

  // CMMC Level 2 = All 110 NIST 800-171 requirements
  const controls = [
    // Access Control (AC) - 22 practices
    { category: "AC", code: "AC.L2-3.1.1", title: "Authorized Access Control", description: "Limit system access to authorized users, processes acting on behalf of authorized users, and devices (including other systems)." },
    { category: "AC", code: "AC.L2-3.1.2", title: "Transaction and Function Control", description: "Limit system access to the types of transactions and functions that authorized users are permitted to execute." },
    { category: "AC", code: "AC.L2-3.1.3", title: "CUI Flow Control", description: "Control the flow of CUI in accordance with approved authorizations." },
    { category: "AC", code: "AC.L2-3.1.4", title: "Separation of Duties", description: "Separate the duties of individuals to reduce the risk of malevolent activity without collusion." },
    { category: "AC", code: "AC.L2-3.1.5", title: "Least Privilege", description: "Employ the principle of least privilege, including for specific security functions and privileged accounts." },
    { category: "AC", code: "AC.L2-3.1.6", title: "Non-Privileged Account Use", description: "Use non-privileged accounts or roles when accessing nonsecurity functions." },
    { category: "AC", code: "AC.L2-3.1.7", title: "Privileged Function Restriction", description: "Prevent non-privileged users from executing privileged functions and capture the execution of such functions in audit logs." },
    { category: "AC", code: "AC.L2-3.1.8", title: "Unsuccessful Logon Attempts", description: "Limit unsuccessful logon attempts." },
    { category: "AC", code: "AC.L2-3.1.9", title: "Privacy and Security Notices", description: "Provide privacy and security notices consistent with applicable CUI rules." },
    { category: "AC", code: "AC.L2-3.1.10", title: "Session Lock", description: "Use session lock with pattern-hiding displays to prevent access and viewing of data after a period of inactivity." },
    { category: "AC", code: "AC.L2-3.1.11", title: "Session Termination", description: "Terminate (automatically) a user session after a defined condition." },
    { category: "AC", code: "AC.L2-3.1.12", title: "Remote Access Control", description: "Monitor and control remote access sessions." },
    { category: "AC", code: "AC.L2-3.1.13", title: "Remote Access Encryption", description: "Employ cryptographic mechanisms to protect the confidentiality of remote access sessions." },
    { category: "AC", code: "AC.L2-3.1.14", title: "Remote Access Routing", description: "Route remote access via managed access control points." },
    { category: "AC", code: "AC.L2-3.1.15", title: "Privileged Remote Access", description: "Authorize remote execution of privileged commands and remote access to security-relevant information." },
    { category: "AC", code: "AC.L2-3.1.16", title: "Wireless Access Authorization", description: "Authorize wireless access prior to allowing such connections." },
    { category: "AC", code: "AC.L2-3.1.17", title: "Wireless Access Protection", description: "Protect wireless access using authentication and encryption." },
    { category: "AC", code: "AC.L2-3.1.18", title: "Mobile Device Connection", description: "Control connection of mobile devices." },
    { category: "AC", code: "AC.L2-3.1.19", title: "Mobile Device Encryption", description: "Encrypt CUI on mobile devices and mobile computing platforms." },
    { category: "AC", code: "AC.L2-3.1.20", title: "External System Connections", description: "Verify and control/limit connections to and use of external systems." },
    { category: "AC", code: "AC.L2-3.1.21", title: "Portable Storage Use", description: "Limit use of portable storage devices on external systems." },
    { category: "AC", code: "AC.L2-3.1.22", title: "Publicly Accessible Content", description: "Control CUI posted or processed on publicly accessible systems." },

    // Awareness and Training (AT) - 3 practices
    { category: "AT", code: "AT.L2-3.2.1", title: "Security Awareness", description: "Ensure that managers, systems administrators, and users of organizational systems are made aware of the security risks associated with their activities and of the applicable policies, standards, and procedures related to the security of those systems." },
    { category: "AT", code: "AT.L2-3.2.2", title: "Role-Based Training", description: "Ensure that personnel are trained to carry out their assigned information security-related duties and responsibilities." },
    { category: "AT", code: "AT.L2-3.2.3", title: "Insider Threat Awareness", description: "Provide security awareness training on recognizing and reporting potential indicators of insider threat." },

    // Audit and Accountability (AU) - 9 practices
    { category: "AU", code: "AU.L2-3.3.1", title: "System Auditing", description: "Create and retain system audit logs and records to the extent needed to enable the monitoring, analysis, investigation, and reporting of unlawful or unauthorized system activity." },
    { category: "AU", code: "AU.L2-3.3.2", title: "User Accountability", description: "Ensure that the actions of individual system users can be uniquely traced to those users so they can be held accountable for their actions." },
    { category: "AU", code: "AU.L2-3.3.3", title: "Audit Event Review", description: "Review and update logged events." },
    { category: "AU", code: "AU.L2-3.3.4", title: "Audit Failure Alerting", description: "Alert in the event of an audit logging process failure." },
    { category: "AU", code: "AU.L2-3.3.5", title: "Audit Correlation", description: "Correlate audit record review, analysis, and reporting processes for investigation and response to indications of unlawful, unauthorized, suspicious, or unusual activity." },
    { category: "AU", code: "AU.L2-3.3.6", title: "Audit Reduction and Reporting", description: "Provide audit record reduction and report generation to support on-demand analysis and reporting." },
    { category: "AU", code: "AU.L2-3.3.7", title: "Authoritative Time Source", description: "Provide a system capability that compares and synchronizes internal system clocks with an authoritative source to generate time stamps for audit records." },
    { category: "AU", code: "AU.L2-3.3.8", title: "Audit Protection", description: "Protect audit information and audit logging tools from unauthorized access, modification, and deletion." },
    { category: "AU", code: "AU.L2-3.3.9", title: "Audit Management", description: "Limit management of audit logging functionality to a subset of privileged users." },

    // Configuration Management (CM) - 9 practices
    { category: "CM", code: "CM.L2-3.4.1", title: "System Baselining", description: "Establish and maintain baseline configurations and inventories of organizational systems (including hardware, software, firmware, and documentation) throughout the respective system development life cycles." },
    { category: "CM", code: "CM.L2-3.4.2", title: "Security Configuration Enforcement", description: "Establish and enforce security configuration settings for information technology products employed in organizational systems." },
    { category: "CM", code: "CM.L2-3.4.3", title: "System Change Management", description: "Track, review, approve or disapprove, and log changes to organizational systems." },
    { category: "CM", code: "CM.L2-3.4.4", title: "Security Impact Analysis", description: "Analyze the security impact of changes prior to implementation." },
    { category: "CM", code: "CM.L2-3.4.5", title: "Access Restrictions for Change", description: "Define, document, approve, and enforce physical and logical access restrictions associated with changes to organizational systems." },
    { category: "CM", code: "CM.L2-3.4.6", title: "Least Functionality", description: "Employ the principle of least functionality by configuring organizational systems to provide only essential capabilities." },
    { category: "CM", code: "CM.L2-3.4.7", title: "Nonessential Functionality", description: "Restrict, disable, or prevent the use of nonessential programs, functions, ports, protocols, and services." },
    { category: "CM", code: "CM.L2-3.4.8", title: "Application Execution Policy", description: "Apply deny-by-exception (blacklisting) policy to prevent the use of unauthorized software or deny-all, permit-by-exception (whitelisting) policy to allow the execution of authorized software." },
    { category: "CM", code: "CM.L2-3.4.9", title: "User-Installed Software", description: "Control and monitor user-installed software." },

    // Identification and Authentication (IA) - 11 practices
    { category: "IA", code: "IA.L2-3.5.1", title: "Identification", description: "Identify system users, processes acting on behalf of users, and devices." },
    { category: "IA", code: "IA.L2-3.5.2", title: "Authentication", description: "Authenticate (or verify) the identities of users, processes, or devices, as a prerequisite to allowing access to organizational systems." },
    { category: "IA", code: "IA.L2-3.5.3", title: "Multifactor Authentication", description: "Use multifactor authentication for local and network access to privileged accounts and for network access to non-privileged accounts." },
    { category: "IA", code: "IA.L2-3.5.4", title: "Replay-Resistant Authentication", description: "Employ replay-resistant authentication mechanisms for network access to privileged and non-privileged accounts." },
    { category: "IA", code: "IA.L2-3.5.5", title: "Identifier Reuse", description: "Prevent reuse of identifiers for a defined period." },
    { category: "IA", code: "IA.L2-3.5.6", title: "Identifier Handling", description: "Disable identifiers after a defined period of inactivity." },
    { category: "IA", code: "IA.L2-3.5.7", title: "Password Complexity", description: "Enforce a minimum password complexity and change of characters when new passwords are created." },
    { category: "IA", code: "IA.L2-3.5.8", title: "Password Reuse", description: "Prohibit password reuse for a specified number of generations." },
    { category: "IA", code: "IA.L2-3.5.9", title: "Temporary Passwords", description: "Allow temporary password use for system logons with an immediate change to a permanent password." },
    { category: "IA", code: "IA.L2-3.5.10", title: "Cryptographically-Protected Passwords", description: "Store and transmit only cryptographically-protected passwords." },
    { category: "IA", code: "IA.L2-3.5.11", title: "Obscure Feedback", description: "Obscure feedback of authentication information." },

    // Incident Response (IR) - 3 practices
    { category: "IR", code: "IR.L2-3.6.1", title: "Incident Handling", description: "Establish an operational incident-handling capability for organizational systems that includes preparation, detection, analysis, containment, recovery, and user response activities." },
    { category: "IR", code: "IR.L2-3.6.2", title: "Incident Reporting", description: "Track, document, and report incidents to designated officials and/or authorities both internal and external to the organization." },
    { category: "IR", code: "IR.L2-3.6.3", title: "Incident Response Testing", description: "Test the organizational incident response capability." },

    // Maintenance (MA) - 6 practices
    { category: "MA", code: "MA.L2-3.7.1", title: "Perform Maintenance", description: "Perform maintenance on organizational systems." },
    { category: "MA", code: "MA.L2-3.7.2", title: "System Maintenance Control", description: "Provide controls on the tools, techniques, mechanisms, and personnel used to conduct system maintenance." },
    { category: "MA", code: "MA.L2-3.7.3", title: "Equipment Sanitization", description: "Ensure equipment removed for off-site maintenance is sanitized of any CUI." },
    { category: "MA", code: "MA.L2-3.7.4", title: "Media Inspection", description: "Check media containing diagnostic and test programs for malicious code before the media are used in organizational systems." },
    { category: "MA", code: "MA.L2-3.7.5", title: "Nonlocal Maintenance", description: "Require multifactor authentication to establish nonlocal maintenance sessions via external network connections and terminate such connections when nonlocal maintenance is complete." },
    { category: "MA", code: "MA.L2-3.7.6", title: "Maintenance Personnel", description: "Supervise the maintenance activities of maintenance personnel without required access authorization." },

    // Media Protection (MP) - 9 practices
    { category: "MP", code: "MP.L2-3.8.1", title: "Media Protection", description: "Protect (i.e., physically control and securely store) system media containing CUI, both paper and digital." },
    { category: "MP", code: "MP.L2-3.8.2", title: "Media Access", description: "Limit access to CUI on system media to authorized users." },
    { category: "MP", code: "MP.L2-3.8.3", title: "Media Sanitization", description: "Sanitize or destroy system media containing CUI before disposal or release for reuse." },
    { category: "MP", code: "MP.L2-3.8.4", title: "Media Marking", description: "Mark media with necessary CUI markings and distribution limitations." },
    { category: "MP", code: "MP.L2-3.8.5", title: "Media Accountability", description: "Control access to media containing CUI and maintain accountability for media during transport outside of controlled areas." },
    { category: "MP", code: "MP.L2-3.8.6", title: "Portable Storage Encryption", description: "Implement cryptographic mechanisms to protect the confidentiality of CUI stored on digital media during transport unless otherwise protected by alternative physical safeguards." },
    { category: "MP", code: "MP.L2-3.8.7", title: "Removable Media", description: "Control the use of removable media on system components." },
    { category: "MP", code: "MP.L2-3.8.8", title: "Shared Media", description: "Prohibit the use of portable storage devices when such devices have no identifiable owner." },
    { category: "MP", code: "MP.L2-3.8.9", title: "Protect Backups", description: "Protect the confidentiality of backup CUI at storage locations." },

    // Physical Protection (PE) - 6 practices
    { category: "PE", code: "PE.L2-3.10.1", title: "Limit Physical Access", description: "Limit physical access to organizational systems, equipment, and the respective operating environments to authorized individuals." },
    { category: "PE", code: "PE.L2-3.10.2", title: "Monitor Facility", description: "Protect and monitor the physical facility and support infrastructure for organizational systems." },
    { category: "PE", code: "PE.L2-3.10.3", title: "Escort Visitors", description: "Escort visitors and monitor visitor activity." },
    { category: "PE", code: "PE.L2-3.10.4", title: "Physical Access Logs", description: "Maintain audit logs of physical access." },
    { category: "PE", code: "PE.L2-3.10.5", title: "Manage Physical Access", description: "Control and manage physical access devices." },
    { category: "PE", code: "PE.L2-3.10.6", title: "Alternative Work Sites", description: "Enforce safeguarding measures for CUI at alternate work sites." },

    // Personnel Security (PS) - 2 practices
    { category: "PS", code: "PS.L2-3.9.1", title: "Screen Individuals", description: "Screen individuals prior to authorizing access to organizational systems containing CUI." },
    { category: "PS", code: "PS.L2-3.9.2", title: "Personnel Actions", description: "Ensure that organizational systems containing CUI are protected during and after personnel actions such as terminations and transfers." },

    // Risk Assessment (RA) - 3 practices
    { category: "RA", code: "RA.L2-3.11.1", title: "Risk Assessments", description: "Periodically assess the risk to organizational operations (including mission, functions, image, or reputation), organizational assets, and individuals, resulting from the operation of organizational systems and the associated processing, storage, or transmission of CUI." },
    { category: "RA", code: "RA.L2-3.11.2", title: "Vulnerability Scan", description: "Scan for vulnerabilities in organizational systems and applications periodically and when new vulnerabilities affecting those systems and applications are identified." },
    { category: "RA", code: "RA.L2-3.11.3", title: "Vulnerability Remediation", description: "Remediate vulnerabilities in accordance with risk assessments." },

    // Security Assessment (CA) - 4 practices
    { category: "CA", code: "CA.L2-3.12.1", title: "Security Control Assessment", description: "Periodically assess the security controls in organizational systems to determine if the controls are effective in their application." },
    { category: "CA", code: "CA.L2-3.12.2", title: "Plan of Action", description: "Develop and implement plans of action designed to correct deficiencies and reduce or eliminate vulnerabilities in organizational systems." },
    { category: "CA", code: "CA.L2-3.12.3", title: "Security Control Monitoring", description: "Monitor security controls on an ongoing basis to ensure the continued effectiveness of the controls." },
    { category: "CA", code: "CA.L2-3.12.4", title: "System Security Plan", description: "Develop, document, and periodically update system security plans that describe system boundaries, system environments of operation, how security requirements are implemented, and the relationships with or connections to other systems." },

    // System and Communications Protection (SC) - 16 practices
    { category: "SC", code: "SC.L2-3.13.1", title: "Boundary Protection", description: "Monitor, control, and protect communications (i.e., information transmitted or received by organizational systems) at the external boundaries and key internal boundaries of organizational systems." },
    { category: "SC", code: "SC.L2-3.13.2", title: "Security Engineering", description: "Employ architectural designs, software development techniques, and systems engineering principles that promote effective information security within organizational systems." },
    { category: "SC", code: "SC.L2-3.13.3", title: "Role Separation", description: "Separate user functionality from system management functionality." },
    { category: "SC", code: "SC.L2-3.13.4", title: "Shared Resource Control", description: "Prevent unauthorized and unintended information transfer via shared system resources." },
    { category: "SC", code: "SC.L2-3.13.5", title: "Public-Access System Separation", description: "Implement subnetworks for publicly accessible system components that are physically or logically separated from internal networks." },
    { category: "SC", code: "SC.L2-3.13.6", title: "Network Communication by Exception", description: "Deny network communications traffic by default and allow network communications traffic by exception (i.e., deny all, permit by exception)." },
    { category: "SC", code: "SC.L2-3.13.7", title: "Split Tunneling", description: "Prevent remote devices from simultaneously establishing non-remote connections with organizational systems and communicating via some other connection to resources in external networks (i.e., split tunneling)." },
    { category: "SC", code: "SC.L2-3.13.8", title: "Data in Transit", description: "Implement cryptographic mechanisms to prevent unauthorized disclosure of CUI during transmission unless otherwise protected by alternative physical safeguards." },
    { category: "SC", code: "SC.L2-3.13.9", title: "Connections Termination", description: "Terminate network connections associated with communications sessions at the end of the sessions or after a defined period of inactivity." },
    { category: "SC", code: "SC.L2-3.13.10", title: "Key Management", description: "Establish and manage cryptographic keys for cryptography employed in organizational systems." },
    { category: "SC", code: "SC.L2-3.13.11", title: "CUI Encryption", description: "Employ FIPS-validated cryptography when used to protect the confidentiality of CUI." },
    { category: "SC", code: "SC.L2-3.13.12", title: "Collaborative Device Control", description: "Prohibit remote activation of collaborative computing devices and provide indication of devices in use to users present at the device." },
    { category: "SC", code: "SC.L2-3.13.13", title: "Mobile Code", description: "Control and monitor the use of mobile code." },
    { category: "SC", code: "SC.L2-3.13.14", title: "Voice over IP", description: "Control and monitor the use of Voice over Internet Protocol (VoIP) technologies." },
    { category: "SC", code: "SC.L2-3.13.15", title: "Communications Authenticity", description: "Protect the authenticity of communications sessions." },
    { category: "SC", code: "SC.L2-3.13.16", title: "Data at Rest", description: "Protect the confidentiality of CUI at rest." },

    // System and Information Integrity (SI) - 7 practices
    { category: "SI", code: "SI.L2-3.14.1", title: "Flaw Remediation", description: "Identify, report, and correct system flaws in a timely manner." },
    { category: "SI", code: "SI.L2-3.14.2", title: "Malicious Code Protection", description: "Provide protection from malicious code at designated locations within organizational systems." },
    { category: "SI", code: "SI.L2-3.14.3", title: "Security Alerts", description: "Monitor system security alerts and advisories and take action in response." },
    { category: "SI", code: "SI.L2-3.14.4", title: "Update Malicious Code Protection", description: "Update malicious code protection mechanisms when new releases are available." },
    { category: "SI", code: "SI.L2-3.14.5", title: "System and File Scanning", description: "Perform periodic scans of organizational systems and real-time scans of files from external sources as files are downloaded, opened, or executed." },
    { category: "SI", code: "SI.L2-3.14.6", title: "Monitor Communications", description: "Monitor organizational systems, including inbound and outbound communications traffic, to detect attacks and indicators of potential attacks." },
    { category: "SI", code: "SI.L2-3.14.7", title: "Identify Unauthorized Use", description: "Identify unauthorized use of organizational systems." },
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
  console.log(`CMMC Level 2 seeded: ${controls.length} controls`);
}

seedCMMCL2()
  .then(() => {
    console.log("Done!");
    pool.end();
  })
  .catch((err) => {
    console.error("Error:", err);
    pool.end();
    process.exit(1);
  });
