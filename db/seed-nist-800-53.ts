import { Pool } from "pg";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_MDRrigq17LGu@ep-calm-night-ai4qscfu-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function query(text: string, params?: unknown[]) {
  return pool.query(text, params);
}

async function seedNIST80053() {
  console.log("Seeding NIST 800-53 framework...");

  const frameworkResult = await query(
    `INSERT INTO frameworks (code, name, version, release_date, issuing_body, description, industry_applicability, total_controls, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (code) DO UPDATE SET name = $2, version = $3, updated_at = now()
     RETURNING id`,
    [
      "NIST-800-53",
      "NIST SP 800-53 - Security and Privacy Controls for Information Systems",
      "Rev 5",
      "2020-09-23",
      "National Institute of Standards and Technology (NIST)",
      "NIST SP 800-53 provides a comprehensive catalog of security and privacy controls for federal information systems and organizations. It is the foundation for FedRAMP, FISMA, and many other compliance frameworks.",
      ["Government", "Federal Contractors", "Healthcare", "Finance", "Critical Infrastructure"],
      323,
      true,
    ]
  );
  const frameworkId = frameworkResult.rows[0].id;

  const categories = [
    { code: "AC", name: "Access Control", description: "Policies and controls for limiting system access to authorized users and managing user privileges." },
    { code: "AT", name: "Awareness and Training", description: "Security awareness training and role-specific training requirements." },
    { code: "AU", name: "Audit and Accountability", description: "Audit record creation, protection, and analysis requirements." },
    { code: "CA", name: "Assessment, Authorization and Monitoring", description: "Security assessment, authorization, and continuous monitoring." },
    { code: "CM", name: "Configuration Management", description: "System configuration and change management controls." },
    { code: "CP", name: "Contingency Planning", description: "Continuity of operations and disaster recovery planning." },
    { code: "IA", name: "Identification and Authentication", description: "Identity management and authentication controls." },
    { code: "IR", name: "Incident Response", description: "Incident handling and response capabilities." },
    { code: "MA", name: "Maintenance", description: "System maintenance controls and procedures." },
    { code: "MP", name: "Media Protection", description: "Controls for protecting system media." },
    { code: "PE", name: "Physical and Environmental Protection", description: "Physical access and environmental protection controls." },
    { code: "PL", name: "Planning", description: "Security planning documentation requirements." },
    { code: "PM", name: "Program Management", description: "Organization-wide information security program management." },
    { code: "PS", name: "Personnel Security", description: "Personnel screening, termination, and transfer controls." },
    { code: "PT", name: "PII Processing and Transparency", description: "Privacy controls for personally identifiable information." },
    { code: "RA", name: "Risk Assessment", description: "Risk assessment and vulnerability management." },
    { code: "SA", name: "System and Services Acquisition", description: "Security in the system development lifecycle." },
    { code: "SC", name: "System and Communications Protection", description: "Communications and system protection controls." },
    { code: "SI", name: "System and Information Integrity", description: "System monitoring, malware protection, and integrity controls." },
    { code: "SR", name: "Supply Chain Risk Management", description: "Supply chain security controls." },
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

  // NIST 800-53 Rev 5 Controls - Key controls from each family
  const controls = [
    // Access Control (AC) Family
    { category: "AC", code: "AC-1", title: "Policy and Procedures", description: "Develop, document, and disseminate access control policy and procedures." },
    { category: "AC", code: "AC-2", title: "Account Management", description: "Manage system accounts, including establishing, activating, modifying, reviewing, disabling, and removing accounts." },
    { category: "AC", code: "AC-3", title: "Access Enforcement", description: "Enforce approved authorizations for logical access to information and system resources." },
    { category: "AC", code: "AC-4", title: "Information Flow Enforcement", description: "Enforce approved authorizations for controlling the flow of information within the system and between systems." },
    { category: "AC", code: "AC-5", title: "Separation of Duties", description: "Separate duties of individuals to prevent malevolent activity." },
    { category: "AC", code: "AC-6", title: "Least Privilege", description: "Employ the principle of least privilege, allowing only authorized accesses necessary to accomplish assigned tasks." },
    { category: "AC", code: "AC-7", title: "Unsuccessful Logon Attempts", description: "Enforce a limit on consecutive invalid logon attempts and take action when this limit is exceeded." },
    { category: "AC", code: "AC-8", title: "System Use Notification", description: "Display approved system use notification message or banner before granting access." },
    { category: "AC", code: "AC-10", title: "Concurrent Session Control", description: "Limit the number of concurrent sessions for each system account." },
    { category: "AC", code: "AC-11", title: "Device Lock", description: "Prevent access to the system by initiating a device lock after a period of inactivity." },
    { category: "AC", code: "AC-12", title: "Session Termination", description: "Automatically terminate a user session after defined conditions." },
    { category: "AC", code: "AC-14", title: "Permitted Actions Without Identification or Authentication", description: "Identify user actions that can be performed on the system without identification or authentication." },
    { category: "AC", code: "AC-17", title: "Remote Access", description: "Establish and document usage restrictions and implementation guidance for remote access." },
    { category: "AC", code: "AC-18", title: "Wireless Access", description: "Establish usage restrictions and implementation guidance for wireless access." },
    { category: "AC", code: "AC-19", title: "Access Control for Mobile Devices", description: "Establish usage restrictions and implementation guidance for mobile devices." },
    { category: "AC", code: "AC-20", title: "Use of External Systems", description: "Establish terms and conditions for use of external systems." },
    { category: "AC", code: "AC-21", title: "Information Sharing", description: "Facilitate information sharing while protecting shared information." },
    { category: "AC", code: "AC-22", title: "Publicly Accessible Content", description: "Designate individuals authorized to post information onto publicly accessible systems." },

    // Awareness and Training (AT) Family
    { category: "AT", code: "AT-1", title: "Policy and Procedures", description: "Develop, document, and disseminate awareness and training policy and procedures." },
    { category: "AT", code: "AT-2", title: "Literacy Training and Awareness", description: "Provide security and privacy literacy training to system users." },
    { category: "AT", code: "AT-3", title: "Role-Based Training", description: "Provide role-based security and privacy training to personnel." },
    { category: "AT", code: "AT-4", title: "Training Records", description: "Document and monitor individual training activities." },

    // Audit and Accountability (AU) Family
    { category: "AU", code: "AU-1", title: "Policy and Procedures", description: "Develop, document, and disseminate audit and accountability policy and procedures." },
    { category: "AU", code: "AU-2", title: "Event Logging", description: "Identify the types of events that the system is capable of logging." },
    { category: "AU", code: "AU-3", title: "Content of Audit Records", description: "Ensure that audit records contain sufficient information to establish what type of event occurred." },
    { category: "AU", code: "AU-4", title: "Audit Log Storage Capacity", description: "Allocate audit log storage capacity to ensure audit logs are not exceeded." },
    { category: "AU", code: "AU-5", title: "Response to Audit Logging Process Failures", description: "Alert personnel in the event of an audit logging process failure." },
    { category: "AU", code: "AU-6", title: "Audit Record Review, Analysis, and Reporting", description: "Review and analyze audit records for indications of inappropriate or unusual activity." },
    { category: "AU", code: "AU-7", title: "Audit Record Reduction and Report Generation", description: "Provide and implement audit record reduction and report generation capability." },
    { category: "AU", code: "AU-8", title: "Time Stamps", description: "Use internal system clocks to generate time stamps for audit records." },
    { category: "AU", code: "AU-9", title: "Protection of Audit Information", description: "Protect audit information and audit logging tools from unauthorized access." },
    { category: "AU", code: "AU-10", title: "Non-repudiation", description: "Provide irrefutable evidence that a user performed certain actions." },
    { category: "AU", code: "AU-11", title: "Audit Record Retention", description: "Retain audit records for a defined time period." },
    { category: "AU", code: "AU-12", title: "Audit Record Generation", description: "Provide audit record generation capability for events that are auditable." },

    // Assessment, Authorization and Monitoring (CA) Family
    { category: "CA", code: "CA-1", title: "Policy and Procedures", description: "Develop, document, and disseminate assessment, authorization, and monitoring policy and procedures." },
    { category: "CA", code: "CA-2", title: "Control Assessments", description: "Assess the controls in the system to determine effectiveness." },
    { category: "CA", code: "CA-3", title: "Information Exchange", description: "Approve and manage the exchange of information between systems." },
    { category: "CA", code: "CA-5", title: "Plan of Action and Milestones", description: "Develop a plan of action and milestones to document planned remedial actions." },
    { category: "CA", code: "CA-6", title: "Authorization", description: "Authorize the system for processing before operation." },
    { category: "CA", code: "CA-7", title: "Continuous Monitoring", description: "Develop and implement a continuous monitoring strategy." },
    { category: "CA", code: "CA-8", title: "Penetration Testing", description: "Conduct penetration testing on systems." },
    { category: "CA", code: "CA-9", title: "Internal System Connections", description: "Authorize internal connections to the system." },

    // Configuration Management (CM) Family
    { category: "CM", code: "CM-1", title: "Policy and Procedures", description: "Develop, document, and disseminate configuration management policy and procedures." },
    { category: "CM", code: "CM-2", title: "Baseline Configuration", description: "Develop, document, and maintain a current baseline configuration of the system." },
    { category: "CM", code: "CM-3", title: "Configuration Change Control", description: "Determine and document the types of changes to the system that are configuration-controlled." },
    { category: "CM", code: "CM-4", title: "Impact Analyses", description: "Analyze changes to the system to determine potential security and privacy impacts." },
    { category: "CM", code: "CM-5", title: "Access Restrictions for Change", description: "Define, document, approve, and enforce physical and logical access restrictions." },
    { category: "CM", code: "CM-6", title: "Configuration Settings", description: "Establish and document configuration settings using security configuration checklists." },
    { category: "CM", code: "CM-7", title: "Least Functionality", description: "Configure the system to provide only essential capabilities." },
    { category: "CM", code: "CM-8", title: "System Component Inventory", description: "Develop and document an inventory of system components." },
    { category: "CM", code: "CM-9", title: "Configuration Management Plan", description: "Develop, document, and implement a configuration management plan." },
    { category: "CM", code: "CM-10", title: "Software Usage Restrictions", description: "Use software and associated documentation in accordance with contract agreements and copyright laws." },
    { category: "CM", code: "CM-11", title: "User-installed Software", description: "Establish policies governing the installation of software by users." },
    { category: "CM", code: "CM-12", title: "Information Location", description: "Identify and document the location of information and system components." },

    // Contingency Planning (CP) Family
    { category: "CP", code: "CP-1", title: "Policy and Procedures", description: "Develop, document, and disseminate contingency planning policy and procedures." },
    { category: "CP", code: "CP-2", title: "Contingency Plan", description: "Develop a contingency plan that addresses roles, responsibilities, and recovery." },
    { category: "CP", code: "CP-3", title: "Contingency Training", description: "Provide contingency training to system users." },
    { category: "CP", code: "CP-4", title: "Contingency Plan Testing", description: "Test the contingency plan to determine effectiveness." },
    { category: "CP", code: "CP-6", title: "Alternate Storage Site", description: "Establish an alternate storage site for system backups." },
    { category: "CP", code: "CP-7", title: "Alternate Processing Site", description: "Establish an alternate processing site for the system." },
    { category: "CP", code: "CP-8", title: "Telecommunications Services", description: "Establish alternate telecommunications services." },
    { category: "CP", code: "CP-9", title: "System Backup", description: "Conduct backups of user-level, system-level, and security-related information." },
    { category: "CP", code: "CP-10", title: "System Recovery and Reconstitution", description: "Provide for the recovery and reconstitution of the system." },

    // Identification and Authentication (IA) Family
    { category: "IA", code: "IA-1", title: "Policy and Procedures", description: "Develop, document, and disseminate identification and authentication policy and procedures." },
    { category: "IA", code: "IA-2", title: "Identification and Authentication (Organizational Users)", description: "Uniquely identify and authenticate organizational users." },
    { category: "IA", code: "IA-3", title: "Device Identification and Authentication", description: "Uniquely identify and authenticate devices before establishing connections." },
    { category: "IA", code: "IA-4", title: "Identifier Management", description: "Manage system identifiers by receiving authorization and assigning unique identifiers." },
    { category: "IA", code: "IA-5", title: "Authenticator Management", description: "Manage system authenticators by verifying identity and initial authenticator content." },
    { category: "IA", code: "IA-6", title: "Authentication Feedback", description: "Obscure feedback of authentication information during authentication." },
    { category: "IA", code: "IA-7", title: "Cryptographic Module Authentication", description: "Implement mechanisms for authentication to a cryptographic module." },
    { category: "IA", code: "IA-8", title: "Identification and Authentication (Non-Organizational Users)", description: "Uniquely identify and authenticate non-organizational users." },
    { category: "IA", code: "IA-9", title: "Service Identification and Authentication", description: "Uniquely identify and authenticate services and applications." },
    { category: "IA", code: "IA-10", title: "Adaptive Authentication", description: "Require adaptive authentication based on contextual factors." },
    { category: "IA", code: "IA-11", title: "Re-authentication", description: "Require users to re-authenticate under certain circumstances." },
    { category: "IA", code: "IA-12", title: "Identity Proofing", description: "Identity proof users that require accounts for logical access." },

    // Incident Response (IR) Family
    { category: "IR", code: "IR-1", title: "Policy and Procedures", description: "Develop, document, and disseminate incident response policy and procedures." },
    { category: "IR", code: "IR-2", title: "Incident Response Training", description: "Provide incident response training to system users." },
    { category: "IR", code: "IR-3", title: "Incident Response Testing", description: "Test the incident response capability." },
    { category: "IR", code: "IR-4", title: "Incident Handling", description: "Implement an incident handling capability that includes preparation, detection, analysis, containment, eradication, and recovery." },
    { category: "IR", code: "IR-5", title: "Incident Monitoring", description: "Track and document incidents." },
    { category: "IR", code: "IR-6", title: "Incident Reporting", description: "Require personnel to report suspected incidents to the incident response capability." },
    { category: "IR", code: "IR-7", title: "Incident Response Assistance", description: "Provide an incident response support resource." },
    { category: "IR", code: "IR-8", title: "Incident Response Plan", description: "Develop an incident response plan." },

    // Maintenance (MA) Family
    { category: "MA", code: "MA-1", title: "Policy and Procedures", description: "Develop, document, and disseminate maintenance policy and procedures." },
    { category: "MA", code: "MA-2", title: "Controlled Maintenance", description: "Schedule, document, and review records of maintenance and repairs." },
    { category: "MA", code: "MA-3", title: "Maintenance Tools", description: "Approve, control, and monitor maintenance tools." },
    { category: "MA", code: "MA-4", title: "Nonlocal Maintenance", description: "Authorize, monitor, and control nonlocal maintenance and diagnostic activities." },
    { category: "MA", code: "MA-5", title: "Maintenance Personnel", description: "Establish a process for maintenance personnel authorization." },
    { category: "MA", code: "MA-6", title: "Timely Maintenance", description: "Obtain maintenance support within a defined time period." },

    // Media Protection (MP) Family
    { category: "MP", code: "MP-1", title: "Policy and Procedures", description: "Develop, document, and disseminate media protection policy and procedures." },
    { category: "MP", code: "MP-2", title: "Media Access", description: "Restrict access to types of digital and non-digital media." },
    { category: "MP", code: "MP-3", title: "Media Marking", description: "Mark system media indicating the distribution limitations, handling caveats, and applicable security markings." },
    { category: "MP", code: "MP-4", title: "Media Storage", description: "Physically control and securely store digital and non-digital media." },
    { category: "MP", code: "MP-5", title: "Media Transport", description: "Protect and control digital and non-digital media during transport." },
    { category: "MP", code: "MP-6", title: "Media Sanitization", description: "Sanitize system media prior to disposal, release, or reuse." },
    { category: "MP", code: "MP-7", title: "Media Use", description: "Restrict the use of types of system media." },
    { category: "MP", code: "MP-8", title: "Media Downgrading", description: "Establish a media downgrading process." },

    // Physical and Environmental Protection (PE) Family
    { category: "PE", code: "PE-1", title: "Policy and Procedures", description: "Develop, document, and disseminate physical and environmental protection policy and procedures." },
    { category: "PE", code: "PE-2", title: "Physical Access Authorizations", description: "Develop, approve, and maintain a list of individuals with authorized access to the facility." },
    { category: "PE", code: "PE-3", title: "Physical Access Control", description: "Enforce physical access authorizations at entry and exit points to the facility." },
    { category: "PE", code: "PE-4", title: "Access Control for Transmission", description: "Control physical access to system transmission lines within organizational facilities." },
    { category: "PE", code: "PE-5", title: "Access Control for Output Devices", description: "Control physical access to output devices to prevent unauthorized individuals from viewing information." },
    { category: "PE", code: "PE-6", title: "Monitoring Physical Access", description: "Monitor physical access to the facility where the system resides to detect physical access incidents." },
    { category: "PE", code: "PE-8", title: "Visitor Access Records", description: "Maintain visitor access records to the facility where the system resides." },
    { category: "PE", code: "PE-9", title: "Power Equipment and Cabling", description: "Protect power equipment and power cabling for the system." },
    { category: "PE", code: "PE-10", title: "Emergency Shutoff", description: "Provide the capability of shutting off power to the system." },
    { category: "PE", code: "PE-11", title: "Emergency Power", description: "Provide an uninterruptible power supply to facilitate orderly shutdown." },
    { category: "PE", code: "PE-12", title: "Emergency Lighting", description: "Employ and maintain automatic emergency lighting." },
    { category: "PE", code: "PE-13", title: "Fire Protection", description: "Employ and maintain fire detection and suppression systems." },
    { category: "PE", code: "PE-14", title: "Environmental Controls", description: "Maintain and monitor environmental controls." },
    { category: "PE", code: "PE-15", title: "Water Damage Protection", description: "Protect the system from damage resulting from water leakage." },
    { category: "PE", code: "PE-16", title: "Delivery and Removal", description: "Authorize and control system components entering and exiting the facility." },
    { category: "PE", code: "PE-17", title: "Alternate Work Site", description: "Employ controls at alternate work sites." },
    { category: "PE", code: "PE-18", title: "Location of System Components", description: "Position system components within the facility to minimize potential damage." },

    // Planning (PL) Family
    { category: "PL", code: "PL-1", title: "Policy and Procedures", description: "Develop, document, and disseminate planning policy and procedures." },
    { category: "PL", code: "PL-2", title: "System Security and Privacy Plans", description: "Develop security and privacy plans for the system." },
    { category: "PL", code: "PL-4", title: "Rules of Behavior", description: "Establish rules describing responsibilities and expected behavior for system users." },
    { category: "PL", code: "PL-8", title: "Security and Privacy Architectures", description: "Develop security and privacy architectures for the system." },
    { category: "PL", code: "PL-9", title: "Central Management", description: "Centrally manage security controls and related processes." },
    { category: "PL", code: "PL-10", title: "Baseline Selection", description: "Select a control baseline for the system." },
    { category: "PL", code: "PL-11", title: "Baseline Tailoring", description: "Tailor the selected control baseline by applying specified tailoring actions." },

    // Program Management (PM) Family
    { category: "PM", code: "PM-1", title: "Information Security Program Plan", description: "Develop and disseminate an organization-wide information security program plan." },
    { category: "PM", code: "PM-2", title: "Information Security Program Leadership Role", description: "Appoint a senior agency information security officer." },
    { category: "PM", code: "PM-3", title: "Information Security and Privacy Resources", description: "Include resources needed to implement the security and privacy programs." },
    { category: "PM", code: "PM-4", title: "Plan of Action and Milestones Process", description: "Implement a process to ensure plans of action and milestones are developed and maintained." },
    { category: "PM", code: "PM-5", title: "System Inventory", description: "Develop and maintain an inventory of organizational systems." },
    { category: "PM", code: "PM-6", title: "Measures of Performance", description: "Develop, monitor, and report on the results of information security measures of performance." },
    { category: "PM", code: "PM-7", title: "Enterprise Architecture", description: "Develop an enterprise architecture with consideration for information security and privacy." },
    { category: "PM", code: "PM-8", title: "Critical Infrastructure Plan", description: "Address information security and privacy in the critical infrastructure plan." },
    { category: "PM", code: "PM-9", title: "Risk Management Strategy", description: "Develop a comprehensive strategy to manage risk to organizational operations." },
    { category: "PM", code: "PM-10", title: "Authorization Process", description: "Manage the security and privacy state of organizational systems through authorization processes." },
    { category: "PM", code: "PM-11", title: "Mission and Business Process Definition", description: "Define organizational mission and business processes." },
    { category: "PM", code: "PM-12", title: "Insider Threat Program", description: "Implement an insider threat program that includes a cross-discipline insider threat team." },
    { category: "PM", code: "PM-13", title: "Security and Privacy Workforce", description: "Establish a security and privacy workforce development and improvement program." },
    { category: "PM", code: "PM-14", title: "Testing, Training, and Monitoring", description: "Implement a process for ensuring that organizational plans are exercised and tested." },
    { category: "PM", code: "PM-15", title: "Security and Privacy Groups and Associations", description: "Establish and participate in security and privacy groups." },
    { category: "PM", code: "PM-16", title: "Threat Awareness Program", description: "Implement a threat awareness program that includes a cross-organization capability." },

    // Personnel Security (PS) Family
    { category: "PS", code: "PS-1", title: "Policy and Procedures", description: "Develop, document, and disseminate personnel security policy and procedures." },
    { category: "PS", code: "PS-2", title: "Position Risk Designation", description: "Assign a risk designation to all organizational positions." },
    { category: "PS", code: "PS-3", title: "Personnel Screening", description: "Screen individuals prior to authorizing access to the system." },
    { category: "PS", code: "PS-4", title: "Personnel Termination", description: "Upon termination of individual employment, disable system access and retrieve credentials." },
    { category: "PS", code: "PS-5", title: "Personnel Transfer", description: "Review and confirm ongoing operational need for current access upon personnel transfer." },
    { category: "PS", code: "PS-6", title: "Access Agreements", description: "Develop and document access agreements for organizational systems." },
    { category: "PS", code: "PS-7", title: "External Personnel Security", description: "Establish security requirements for external personnel." },
    { category: "PS", code: "PS-8", title: "Personnel Sanctions", description: "Employ a formal sanctions process for individuals failing to comply with security policies." },
    { category: "PS", code: "PS-9", title: "Position Descriptions", description: "Incorporate security and privacy requirements into organizational position descriptions." },

    // PII Processing and Transparency (PT) Family
    { category: "PT", code: "PT-1", title: "Policy and Procedures", description: "Develop, document, and disseminate PII processing and transparency policy and procedures." },
    { category: "PT", code: "PT-2", title: "Authority to Process PII", description: "Determine and document the legal authority that permits the collection, use, maintenance, and sharing of PII." },
    { category: "PT", code: "PT-3", title: "PII Processing Purposes", description: "Identify and document the purposes for which PII is processed." },
    { category: "PT", code: "PT-4", title: "Consent", description: "Implement mechanisms to obtain consent from individuals for the collection and processing of PII." },
    { category: "PT", code: "PT-5", title: "Privacy Notice", description: "Provide notice to individuals about the processing of PII." },
    { category: "PT", code: "PT-6", title: "System of Records Notice", description: "Publish system of records notices in the Federal Register for systems containing PII." },
    { category: "PT", code: "PT-7", title: "Specific Categories of PII", description: "Apply processing conditions for specific categories of PII." },
    { category: "PT", code: "PT-8", title: "Computer Matching Requirements", description: "Implement computer matching requirements when processing PII for matching programs." },

    // Risk Assessment (RA) Family
    { category: "RA", code: "RA-1", title: "Policy and Procedures", description: "Develop, document, and disseminate risk assessment policy and procedures." },
    { category: "RA", code: "RA-2", title: "Security Categorization", description: "Categorize the system and information processed, stored, or transmitted." },
    { category: "RA", code: "RA-3", title: "Risk Assessment", description: "Conduct a risk assessment to identify threats and vulnerabilities." },
    { category: "RA", code: "RA-5", title: "Vulnerability Monitoring and Scanning", description: "Monitor and scan for vulnerabilities in the system." },
    { category: "RA", code: "RA-6", title: "Technical Surveillance Countermeasures Survey", description: "Employ a technical surveillance countermeasures survey at selected locations." },
    { category: "RA", code: "RA-7", title: "Risk Response", description: "Respond to findings from risk assessments." },
    { category: "RA", code: "RA-8", title: "Privacy Impact Assessments", description: "Conduct privacy impact assessments for systems processing PII." },
    { category: "RA", code: "RA-9", title: "Criticality Analysis", description: "Identify critical system components and functions." },
    { category: "RA", code: "RA-10", title: "Threat Hunting", description: "Conduct threat hunting to search for indicators of compromise." },

    // System and Services Acquisition (SA) Family
    { category: "SA", code: "SA-1", title: "Policy and Procedures", description: "Develop, document, and disseminate system and services acquisition policy and procedures." },
    { category: "SA", code: "SA-2", title: "Allocation of Resources", description: "Determine information security and privacy requirements and allocate resources." },
    { category: "SA", code: "SA-3", title: "System Development Life Cycle", description: "Manage the system using a system development life cycle methodology." },
    { category: "SA", code: "SA-4", title: "Acquisition Process", description: "Include security and privacy functional requirements in system acquisition contracts." },
    { category: "SA", code: "SA-5", title: "System Documentation", description: "Obtain and protect system documentation." },
    { category: "SA", code: "SA-8", title: "Security and Privacy Engineering Principles", description: "Apply security and privacy engineering principles in system specification, design, development, implementation, and modification." },
    { category: "SA", code: "SA-9", title: "External System Services", description: "Require external system service providers to comply with security requirements." },
    { category: "SA", code: "SA-10", title: "Developer Configuration Management", description: "Require developers to perform configuration management during system development." },
    { category: "SA", code: "SA-11", title: "Developer Testing and Evaluation", description: "Require developers to create and implement a security and privacy test and evaluation plan." },
    { category: "SA", code: "SA-15", title: "Development Process, Standards, and Tools", description: "Require developers to follow a documented development process." },
    { category: "SA", code: "SA-16", title: "Developer-Provided Training", description: "Require developers to provide training on the correct use of implemented security and privacy functions." },
    { category: "SA", code: "SA-17", title: "Developer Security and Privacy Architecture and Design", description: "Require developers to produce a design specification and architecture consistent with the security and privacy architecture." },
    { category: "SA", code: "SA-21", title: "Developer Screening", description: "Require that developers are subjected to personnel screening." },
    { category: "SA", code: "SA-22", title: "Unsupported System Components", description: "Replace system components when support is no longer available." },

    // System and Communications Protection (SC) Family
    { category: "SC", code: "SC-1", title: "Policy and Procedures", description: "Develop, document, and disseminate system and communications protection policy and procedures." },
    { category: "SC", code: "SC-2", title: "Separation of System and User Functionality", description: "Separate user functionality from system management functionality." },
    { category: "SC", code: "SC-3", title: "Security Function Isolation", description: "Isolate security functions from nonsecurity functions." },
    { category: "SC", code: "SC-4", title: "Information in Shared System Resources", description: "Prevent unauthorized and unintended information transfer via shared system resources." },
    { category: "SC", code: "SC-5", title: "Denial-of-Service Protection", description: "Protect against or limit the effects of denial-of-service attacks." },
    { category: "SC", code: "SC-7", title: "Boundary Protection", description: "Monitor and control communications at the external boundary and key internal boundaries." },
    { category: "SC", code: "SC-8", title: "Transmission Confidentiality and Integrity", description: "Protect the confidentiality and integrity of transmitted information." },
    { category: "SC", code: "SC-10", title: "Network Disconnect", description: "Terminate the network connection associated with a communications session at the end of the session." },
    { category: "SC", code: "SC-12", title: "Cryptographic Key Establishment and Management", description: "Establish and manage cryptographic keys." },
    { category: "SC", code: "SC-13", title: "Cryptographic Protection", description: "Implement cryptographic mechanisms to prevent unauthorized disclosure and modification of information." },
    { category: "SC", code: "SC-15", title: "Collaborative Computing Devices and Applications", description: "Prohibit remote activation of collaborative computing devices and provide indication of devices in use." },
    { category: "SC", code: "SC-17", title: "Public Key Infrastructure Certificates", description: "Issue public key certificates under an appropriate certificate policy." },
    { category: "SC", code: "SC-18", title: "Mobile Code", description: "Define acceptable and unacceptable mobile code and mobile code technologies." },
    { category: "SC", code: "SC-19", title: "Voice over Internet Protocol", description: "Establish usage restrictions and implementation guidance for VoIP technologies." },
    { category: "SC", code: "SC-20", title: "Secure Name/Address Resolution Service", description: "Provide additional data origin and data integrity artifacts for authoritative name resolution data." },
    { category: "SC", code: "SC-21", title: "Secure Name/Address Resolution Service (Recursive or Caching Resolver)", description: "Request and perform data origin and data integrity verification on the name/address resolution responses." },
    { category: "SC", code: "SC-22", title: "Architecture and Provisioning for Name/Address Resolution Service", description: "Ensure the systems that collectively provide name/address resolution service are fault-tolerant." },
    { category: "SC", code: "SC-23", title: "Session Authenticity", description: "Protect the authenticity of communications sessions." },
    { category: "SC", code: "SC-28", title: "Protection of Information at Rest", description: "Protect the confidentiality and integrity of information at rest." },
    { category: "SC", code: "SC-39", title: "Process Isolation", description: "Maintain a separate execution domain for each executing system process." },

    // System and Information Integrity (SI) Family
    { category: "SI", code: "SI-1", title: "Policy and Procedures", description: "Develop, document, and disseminate system and information integrity policy and procedures." },
    { category: "SI", code: "SI-2", title: "Flaw Remediation", description: "Identify, report, and correct system flaws." },
    { category: "SI", code: "SI-3", title: "Malicious Code Protection", description: "Implement malicious code protection mechanisms." },
    { category: "SI", code: "SI-4", title: "System Monitoring", description: "Monitor the system to detect attacks and indicators of potential attacks." },
    { category: "SI", code: "SI-5", title: "Security Alerts, Advisories, and Directives", description: "Receive system security alerts, advisories, and directives from external organizations." },
    { category: "SI", code: "SI-6", title: "Security and Privacy Function Verification", description: "Verify the correct operation of security and privacy functions." },
    { category: "SI", code: "SI-7", title: "Software, Firmware, and Information Integrity", description: "Employ integrity verification tools to detect unauthorized changes to software, firmware, and information." },
    { category: "SI", code: "SI-8", title: "Spam Protection", description: "Employ spam protection mechanisms." },
    { category: "SI", code: "SI-10", title: "Information Input Validation", description: "Check the validity of information inputs." },
    { category: "SI", code: "SI-11", title: "Error Handling", description: "Generate error messages that provide information necessary for corrective actions without revealing exploitable information." },
    { category: "SI", code: "SI-12", title: "Information Management and Retention", description: "Manage and retain information within the system and information output from the system in accordance with applicable laws." },
    { category: "SI", code: "SI-16", title: "Memory Protection", description: "Implement safeguards to protect the system memory from unauthorized code execution." },

    // Supply Chain Risk Management (SR) Family
    { category: "SR", code: "SR-1", title: "Policy and Procedures", description: "Develop, document, and disseminate supply chain risk management policy and procedures." },
    { category: "SR", code: "SR-2", title: "Supply Chain Risk Management Plan", description: "Develop a plan for managing supply chain risks associated with the development, acquisition, maintenance, and disposal of systems." },
    { category: "SR", code: "SR-3", title: "Supply Chain Controls and Processes", description: "Establish a process to identify and address weaknesses or deficiencies in the supply chain elements and processes." },
    { category: "SR", code: "SR-4", title: "Provenance", description: "Document, monitor, and maintain valid provenance of systems and system components." },
    { category: "SR", code: "SR-5", title: "Acquisition Strategies, Tools, and Methods", description: "Employ acquisition strategies, contract tools, and procurement methods to protect against, identify, and mitigate supply chain risks." },
    { category: "SR", code: "SR-6", title: "Supplier Assessments and Reviews", description: "Assess and review the supply chain-related risks associated with suppliers." },
    { category: "SR", code: "SR-7", title: "Supply Chain Operations Security", description: "Employ operations security controls on supply chain elements." },
    { category: "SR", code: "SR-8", title: "Notification Agreements", description: "Establish agreements and procedures with entities involved in the supply chain for notification of supply chain compromises." },
    { category: "SR", code: "SR-9", title: "Tamper Resistance and Detection", description: "Implement a tamper protection program for the system." },
    { category: "SR", code: "SR-10", title: "Inspection of Systems or Components", description: "Inspect systems or system components to detect tampering." },
    { category: "SR", code: "SR-11", title: "Component Authenticity", description: "Develop and implement anti-counterfeit policy and procedures." },
    { category: "SR", code: "SR-12", title: "Component Disposal", description: "Dispose of system components using organization-defined techniques and methods." },
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
  console.log(`NIST 800-53 seeded: ${controls.length} controls`);
}

seedNIST80053()
  .then(() => {
    console.log("Done!");
    pool.end();
  })
  .catch((err) => {
    console.error("Error:", err);
    pool.end();
    process.exit(1);
  });
