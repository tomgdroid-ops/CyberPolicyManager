import { Pool, PoolClient } from "pg";
import bcrypt from "bcryptjs";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/policyvault";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FunctionDef {
  code: string;
  name: string;
  description: string;
  sort_order: number;
  subcategories: SubcategoryDef[];
}

interface SubcategoryDef {
  code: string;
  name: string;
  description: string;
  sort_order: number;
  controls: ControlDef[];
}

interface ControlDef {
  code: string;
  title: string;
  description: string;
  guidance: string;
  assessment: string[];
  related?: string[];
}

interface BestPracticeDef {
  control_code: string;
  title: string;
  description: string;
  steps: string[];
  evidence: string[];
  pitfalls: string[];
}

// ---------------------------------------------------------------------------
// NIST CSF 2.0 complete data
// ---------------------------------------------------------------------------

const NIST_CSF_FUNCTIONS: FunctionDef[] = [
  // =========================================================================
  // GOVERN (GV)
  // =========================================================================
  {
    code: "GV",
    name: "Govern",
    description:
      "The organization's cybersecurity risk management strategy, expectations, and policy are established, communicated, and monitored.",
    sort_order: 1,
    subcategories: [
      {
        code: "GV.OC",
        name: "Organizational Context",
        description:
          "The circumstances — mission, stakeholder expectations, dependencies, and legal, regulatory, and contractual requirements — surrounding the organization's cybersecurity risk management decisions are understood.",
        sort_order: 1,
        controls: [
          {
            code: "GV.OC-01",
            title: "Organizational Mission Understanding",
            description:
              "The organizational mission is understood and informs cybersecurity risk management.",
            guidance:
              "Document the organizational mission and ensure cybersecurity strategy aligns with it. Regularly review alignment between mission objectives and security investments.",
            assessment: [
              "Review documentation linking cybersecurity strategy to organizational mission",
              "Interview leadership about mission-driven security priorities",
              "Verify mission statement references in cybersecurity policy documents",
            ],
          },
          {
            code: "GV.OC-02",
            title: "Internal and External Stakeholders",
            description:
              "Internal and external stakeholders are determined, and their needs and expectations regarding cybersecurity risk management are understood and considered.",
            guidance:
              "Identify all internal stakeholders (executives, departments, employees) and external stakeholders (regulators, partners, customers). Document their cybersecurity expectations and integrate them into risk management.",
            assessment: [
              "Review stakeholder registry and expectation documentation",
              "Verify stakeholder engagement and communication processes",
              "Assess coverage of regulatory and contractual requirements",
            ],
          },
          {
            code: "GV.OC-03",
            title: "Legal and Regulatory Requirements",
            description:
              "Legal, regulatory, and contractual requirements regarding cybersecurity — including privacy and civil liberties obligations — are understood and managed.",
            guidance:
              "Maintain a compliance register of applicable laws, regulations, and contractual obligations. Assign responsibility for monitoring regulatory changes and ensuring ongoing compliance.",
            assessment: [
              "Review the compliance obligations register for completeness",
              "Verify legal and regulatory monitoring processes",
              "Assess how regulatory requirements are translated into security controls",
            ],
          },
          {
            code: "GV.OC-04",
            title: "Critical Objectives and Dependencies",
            description:
              "Critical objectives, capabilities, and services that external stakeholders depend on or expect are understood and communicated.",
            guidance:
              "Identify critical business services and dependencies. Communicate service level expectations with external stakeholders. Map critical objectives to the systems and assets that support them.",
            assessment: [
              "Review critical services catalog and dependency maps",
              "Verify stakeholder communication of service expectations",
              "Assess business impact analysis documentation",
            ],
          },
          {
            code: "GV.OC-05",
            title: "Outcomes and Priorities for Risk Management",
            description:
              "Outcomes, capabilities, and services that the organization depends on are understood and communicated.",
            guidance:
              "Document risk management priorities based on organizational dependencies. Ensure outcomes are measurable and regularly reported to leadership. Integrate priority outcomes into cybersecurity planning.",
            assessment: [
              "Review risk management outcome documentation",
              "Verify priority communication to relevant stakeholders",
              "Assess alignment between stated priorities and resource allocation",
            ],
          },
        ],
      },
      {
        code: "GV.RM",
        name: "Risk Management Strategy",
        description:
          "The organization's priorities, constraints, risk tolerance and appetite statements, and assumptions are established, communicated, and used to support operational risk decisions.",
        sort_order: 2,
        controls: [
          {
            code: "GV.RM-01",
            title: "Risk Management Objectives",
            description:
              "Risk management objectives are established and agreed to by organizational stakeholders.",
            guidance:
              "Define clear cybersecurity risk management objectives that are endorsed by executive leadership. Ensure objectives are specific, measurable, and aligned with business goals.",
            assessment: [
              "Review documented risk management objectives",
              "Verify executive approval of risk management strategy",
              "Assess alignment with organizational goals",
            ],
          },
          {
            code: "GV.RM-02",
            title: "Risk Appetite and Tolerance",
            description:
              "Risk appetite and risk tolerance statements are established, communicated, and maintained.",
            guidance:
              "Define quantitative and qualitative risk appetite statements. Communicate risk tolerance thresholds to all relevant decision-makers. Review and update periodically.",
            assessment: [
              "Review risk appetite and tolerance documentation",
              "Verify communication to decision-makers",
              "Assess periodic review and update processes",
            ],
          },
          {
            code: "GV.RM-03",
            title: "Enterprise-Wide Risk Management",
            description:
              "Cybersecurity risk management activities and outcomes are included in enterprise risk management processes.",
            guidance:
              "Integrate cybersecurity risk into the enterprise risk management framework. Ensure cybersecurity risk reporting flows into ERM dashboards and board reporting.",
            assessment: [
              "Review integration with enterprise risk management",
              "Verify cybersecurity representation in ERM reporting",
              "Assess cross-functional risk coordination",
            ],
          },
          {
            code: "GV.RM-04",
            title: "Strategic Direction for Risk Response",
            description:
              "Strategic direction that describes appropriate risk response options is established and communicated.",
            guidance:
              "Define risk response strategies (accept, avoid, mitigate, transfer) with clear criteria for each. Communicate response options and decision authority levels.",
            assessment: [
              "Review risk response strategy documentation",
              "Verify communication of response options",
              "Assess decision authority assignment",
            ],
          },
          {
            code: "GV.RM-05",
            title: "Lines of Communication for Risk",
            description:
              "Lines of communication across the organization are established for cybersecurity risks, including risks from suppliers and other third parties.",
            guidance:
              "Establish formal channels for risk communication at all organizational levels. Include third-party and supply chain risk in communication pathways.",
            assessment: [
              "Review risk communication plans and channels",
              "Verify third-party risk communication processes",
              "Assess effectiveness of cross-level risk reporting",
            ],
          },
          {
            code: "GV.RM-06",
            title: "Standardized Method for Risk Calculation",
            description:
              "A standardized method for calculating, documenting, categorizing, and prioritizing cybersecurity risks is established and communicated.",
            guidance:
              "Adopt a consistent risk assessment methodology (e.g., quantitative, qualitative, or hybrid). Ensure risk scoring criteria are documented and applied uniformly.",
            assessment: [
              "Review risk calculation methodology documentation",
              "Verify consistent application of risk scoring",
              "Assess communication of methodology to stakeholders",
            ],
          },
          {
            code: "GV.RM-07",
            title: "Strategic Opportunities from Risk",
            description:
              "Strategic opportunities (i.e., positive risks) are characterized and are included in organizational cybersecurity risk discussions.",
            guidance:
              "Identify and document potential strategic advantages from cybersecurity investments. Include positive risk opportunities in risk register and management discussions.",
            assessment: [
              "Review documentation of strategic security opportunities",
              "Verify inclusion of positive risks in risk discussions",
              "Assess exploitation of security-driven business advantages",
            ],
          },
        ],
      },
      {
        code: "GV.RR",
        name: "Roles, Responsibilities, and Authorities",
        description:
          "Cybersecurity roles, responsibilities, and authorities to foster accountability, performance assessment, and continuous improvement are established and communicated.",
        sort_order: 3,
        controls: [
          {
            code: "GV.RR-01",
            title: "Organizational Leadership Accountability",
            description:
              "Organizational leadership is responsible and accountable for cybersecurity risk and fosters a culture that is risk-aware, ethical, and continually improving.",
            guidance:
              "Assign explicit cybersecurity accountability to executive leadership roles. Foster a security culture through leadership communications and actions.",
            assessment: [
              "Review leadership accountability assignments",
              "Assess evidence of security culture promotion",
              "Verify executive engagement in risk decisions",
            ],
          },
          {
            code: "GV.RR-02",
            title: "Cybersecurity Roles and Responsibilities",
            description:
              "Roles, responsibilities, and authorities related to cybersecurity risk management are established, communicated, understood, and enforced.",
            guidance:
              "Define and document cybersecurity responsibilities in job descriptions and organizational charts. Ensure all personnel understand their security roles.",
            assessment: [
              "Review RACI matrices or responsibility assignments",
              "Verify role communication and acknowledgment",
              "Assess enforcement mechanisms for accountability",
            ],
          },
          {
            code: "GV.RR-03",
            title: "Adequate Resource Provision",
            description:
              "Adequate resources are allocated commensurate with the cybersecurity risk strategy, roles, responsibilities, and policies.",
            guidance:
              "Ensure cybersecurity budgets, staffing, and tools align with risk strategy. Conduct periodic resource adequacy assessments.",
            assessment: [
              "Review cybersecurity budget and staffing levels",
              "Verify alignment with risk strategy requirements",
              "Assess resource adequacy assessment processes",
            ],
          },
          {
            code: "GV.RR-04",
            title: "Cybersecurity in Human Resources Practices",
            description:
              "Cybersecurity is included in human resources practices.",
            guidance:
              "Integrate security requirements into hiring, onboarding, role changes, and termination processes. Conduct background checks for sensitive positions.",
            assessment: [
              "Review HR process documentation for security integration",
              "Verify background check procedures for sensitive roles",
              "Assess security considerations in personnel lifecycle",
            ],
          },
        ],
      },
      {
        code: "GV.PO",
        name: "Policy",
        description:
          "Organizational cybersecurity policy is established, communicated, and enforced.",
        sort_order: 4,
        controls: [
          {
            code: "GV.PO-01",
            title: "Cybersecurity Policy Establishment",
            description:
              "Policy for managing cybersecurity risks is established based on organizational context, cybersecurity strategy, and priorities and is communicated and enforced.",
            guidance:
              "Develop comprehensive cybersecurity policies based on risk assessments and organizational context. Ensure policies are approved by leadership, communicated to all personnel, and enforced consistently.",
            assessment: [
              "Review cybersecurity policy documentation",
              "Verify policy approval and communication processes",
              "Assess policy enforcement mechanisms and compliance monitoring",
            ],
          },
          {
            code: "GV.PO-02",
            title: "Policy Review and Update",
            description:
              "Policy for managing cybersecurity risks is reviewed, updated, communicated, and enforced to reflect changes in requirements, threats, technology, and organizational mission.",
            guidance:
              "Establish a regular policy review cycle (at least annually). Trigger reviews when significant changes occur. Track policy versions and distribution.",
            assessment: [
              "Review policy revision history and review schedule",
              "Verify change-triggered policy update processes",
              "Assess policy version control and distribution records",
            ],
          },
        ],
      },
      {
        code: "GV.OV",
        name: "Oversight",
        description:
          "Results of organization-wide cybersecurity risk management activities and performance are used to inform, improve, and adjust the risk management strategy.",
        sort_order: 5,
        controls: [
          {
            code: "GV.OV-01",
            title: "Risk Management Strategy Review",
            description:
              "Cybersecurity risk management strategy outcomes are reviewed to inform and adjust strategy and direction.",
            guidance:
              "Conduct periodic reviews of risk management strategy effectiveness. Use metrics and outcomes to drive strategic adjustments.",
            assessment: [
              "Review strategy review records and outcomes",
              "Verify metrics-driven strategy adjustments",
              "Assess leadership engagement in strategy reviews",
            ],
          },
          {
            code: "GV.OV-02",
            title: "Risk Management Strategy Adjustment",
            description:
              "The cybersecurity risk management strategy is reviewed and adjusted to ensure coverage of organizational requirements and risks.",
            guidance:
              "Perform gap analyses between current strategy and organizational risk landscape. Adjust strategy to address emerging threats and changing business requirements.",
            assessment: [
              "Review gap analysis documentation",
              "Verify strategy adjustment records",
              "Assess responsiveness to risk landscape changes",
            ],
          },
          {
            code: "GV.OV-03",
            title: "Risk Management Performance Evaluation",
            description:
              "Organizational cybersecurity risk management performance is evaluated and reviewed for adjustments needed.",
            guidance:
              "Establish cybersecurity performance metrics and KPIs. Conduct regular performance evaluations and benchmark against industry standards.",
            assessment: [
              "Review performance metrics and KPI dashboards",
              "Verify evaluation frequency and thoroughness",
              "Assess corrective action processes from evaluations",
            ],
          },
        ],
      },
      {
        code: "GV.SC",
        name: "Cybersecurity Supply Chain Risk Management",
        description:
          "Cyber supply chain risk management processes are identified, established, managed, monitored, and improved by organizational stakeholders.",
        sort_order: 6,
        controls: [
          {
            code: "GV.SC-01",
            title: "Supply Chain Risk Management Program",
            description:
              "A cybersecurity supply chain risk management program, strategy, objectives, policies, and processes are established and agreed to by organizational stakeholders.",
            guidance:
              "Develop a dedicated supply chain risk management program. Define policies, strategies, and processes for managing third-party cybersecurity risk.",
            assessment: [
              "Review supply chain risk management program documentation",
              "Verify stakeholder agreement and program governance",
              "Assess policy completeness for third-party risk",
            ],
          },
          {
            code: "GV.SC-02",
            title: "Supply Chain Security Roles",
            description:
              "Cybersecurity roles and responsibilities for suppliers, customers, and partners are established, communicated, and coordinated internally and externally.",
            guidance:
              "Define and communicate security roles for all supply chain participants. Establish coordination mechanisms with key suppliers and partners.",
            assessment: [
              "Review supply chain responsibility assignments",
              "Verify external communication of security roles",
              "Assess coordination effectiveness with key partners",
            ],
          },
          {
            code: "GV.SC-03",
            title: "Supply Chain Risk Assessment Integration",
            description:
              "Cybersecurity supply chain risk management is integrated into cybersecurity and enterprise risk management, risk assessment, and improvement processes.",
            guidance:
              "Integrate supply chain risk into enterprise risk assessments. Ensure supply chain risk appears in risk registers and management dashboards.",
            assessment: [
              "Review integration of supply chain risk in ERM",
              "Verify supply chain risk in risk registers",
              "Assess supply chain risk treatment planning",
            ],
          },
          {
            code: "GV.SC-04",
            title: "Supplier Due Diligence",
            description:
              "Suppliers are known and prioritized by criticality.",
            guidance:
              "Maintain a comprehensive supplier inventory. Classify suppliers by criticality based on data access, service importance, and potential impact. Conduct due diligence proportional to risk level.",
            assessment: [
              "Review supplier inventory and criticality ratings",
              "Verify due diligence processes and documentation",
              "Assess supplier risk tiering methodology",
            ],
          },
          {
            code: "GV.SC-05",
            title: "Supply Chain Security Requirements",
            description:
              "Requirements to address cybersecurity risks in supply chains are established, prioritized, and integrated into contracts and other types of agreements with suppliers and other relevant third parties.",
            guidance:
              "Include cybersecurity requirements in all supplier contracts. Establish minimum security standards and right-to-audit clauses.",
            assessment: [
              "Review contract templates for security clauses",
              "Verify security requirements in active contracts",
              "Assess contractual compliance monitoring processes",
            ],
          },
          {
            code: "GV.SC-06",
            title: "Supply Chain Security Planning and Due Diligence",
            description:
              "Planning and due diligence are performed to reduce risks before entering into formal supplier or other third-party relationships.",
            guidance:
              "Conduct pre-engagement security assessments for new suppliers. Evaluate supplier security posture before contract execution.",
            assessment: [
              "Review pre-engagement assessment procedures",
              "Verify due diligence completion records",
              "Assess risk acceptance processes for new suppliers",
            ],
          },
          {
            code: "GV.SC-07",
            title: "Supply Chain Risk Understanding",
            description:
              "The risks posed by a supplier, their products and services, and other third parties are understood, recorded, prioritized, assessed, responded to, and monitored over the course of the relationship.",
            guidance:
              "Implement continuous supplier risk monitoring. Maintain risk records for all supplier relationships and update periodically.",
            assessment: [
              "Review ongoing supplier risk assessment records",
              "Verify continuous monitoring mechanisms",
              "Assess risk response actions for supplier risks",
            ],
          },
          {
            code: "GV.SC-08",
            title: "Supply Chain Incident Inclusion",
            description:
              "Relevant suppliers and other third parties are included in incident planning, response, and recovery activities.",
            guidance:
              "Include critical suppliers in incident response plans. Conduct joint exercises and establish communication protocols for incident coordination.",
            assessment: [
              "Review incident plans for supplier inclusion",
              "Verify joint exercise participation records",
              "Assess supplier notification and coordination procedures",
            ],
          },
          {
            code: "GV.SC-09",
            title: "Supply Chain Security Practices Monitoring",
            description:
              "Supply chain security practices are integrated into cybersecurity and enterprise risk management programs, and their performance is monitored throughout the technology product and service life cycle.",
            guidance:
              "Monitor supplier security practices throughout the relationship lifecycle. Integrate supply chain security metrics into overall security program reporting.",
            assessment: [
              "Review lifecycle monitoring processes",
              "Verify integration into risk management programs",
              "Assess supply chain security performance metrics",
            ],
          },
          {
            code: "GV.SC-10",
            title: "Post-Relationship Supply Chain Practices",
            description:
              "Cybersecurity supply chain risk management plans include provisions for activities that occur after the conclusion of a partnership or service agreement.",
            guidance:
              "Define post-relationship security activities including data return/destruction, access revocation, and knowledge transfer. Document off-boarding procedures for suppliers.",
            assessment: [
              "Review supplier off-boarding procedures",
              "Verify data handling requirements for terminated relationships",
              "Assess access revocation processes post-termination",
            ],
          },
        ],
      },
    ],
  },

  // =========================================================================
  // IDENTIFY (ID)
  // =========================================================================
  {
    code: "ID",
    name: "Identify",
    description:
      "The organization's current cybersecurity risks are understood.",
    sort_order: 2,
    subcategories: [
      {
        code: "ID.AM",
        name: "Asset Management",
        description:
          "Assets (e.g., data, hardware, software, systems, facilities, services, people) that enable the organization to achieve business purposes are identified and managed consistent with their relative importance to organizational objectives and the organization's risk strategy.",
        sort_order: 1,
        controls: [
          {
            code: "ID.AM-01",
            title: "Hardware Asset Inventory",
            description:
              "Inventories of hardware managed by the organization are maintained.",
            guidance:
              "Maintain a comprehensive inventory of all hardware assets including endpoints, servers, network equipment, and IoT devices. Use automated discovery tools to keep the inventory current.",
            assessment: [
              "Review hardware asset inventory for completeness",
              "Verify automated discovery tool deployment",
              "Assess inventory update frequency and accuracy",
            ],
          },
          {
            code: "ID.AM-02",
            title: "Software Asset Inventory",
            description:
              "Inventories of software, services, and systems managed by the organization are maintained.",
            guidance:
              "Track all software installations, SaaS subscriptions, cloud services, and custom applications. Include version information and licensing details.",
            assessment: [
              "Review software asset inventory for completeness",
              "Verify license compliance tracking",
              "Assess SaaS and cloud service cataloging",
            ],
          },
          {
            code: "ID.AM-03",
            title: "Network Communication and Data Flow Mapping",
            description:
              "Representations of the organization's authorized network communication and internal and external network data flows are maintained.",
            guidance:
              "Create and maintain network architecture diagrams and data flow maps. Document authorized communication paths, protocols, and data flows between systems.",
            assessment: [
              "Review network architecture and data flow diagrams",
              "Verify diagrams reflect current state",
              "Assess documentation of authorized communication paths",
            ],
          },
          {
            code: "ID.AM-04",
            title: "External Service Provider Inventory",
            description:
              "Inventories of services provided by suppliers are maintained.",
            guidance:
              "Maintain a registry of all external service providers and the services they provide. Include cloud providers, managed service providers, and SaaS vendors.",
            assessment: [
              "Review external service provider inventory",
              "Verify completeness of supplier service catalog",
              "Assess supplier criticality classifications",
            ],
          },
          {
            code: "ID.AM-05",
            title: "Asset Prioritization",
            description:
              "Assets are prioritized based on classification, criticality, resources, and impact on the mission.",
            guidance:
              "Classify and prioritize assets based on business criticality, data sensitivity, and mission impact. Establish a tiered asset classification scheme.",
            assessment: [
              "Review asset classification and prioritization scheme",
              "Verify criticality ratings for key assets",
              "Assess alignment between asset priority and protection levels",
            ],
          },
          {
            code: "ID.AM-07",
            title: "Data Asset Inventory and Classification",
            description:
              "Inventories of data and corresponding metadata for designated data types are maintained.",
            guidance:
              "Catalog data assets with metadata including classification level, owner, location, retention requirements, and regulatory obligations.",
            assessment: [
              "Review data inventory and classification scheme",
              "Verify metadata completeness for critical data",
              "Assess data ownership and stewardship assignments",
            ],
          },
          {
            code: "ID.AM-08",
            title: "Systems and Services in Lifecycle Management",
            description:
              "Systems, hardware, software, services, and data are managed throughout their life cycles.",
            guidance:
              "Implement lifecycle management processes for all assets from acquisition through decommissioning. Track asset status and plan for technology refresh.",
            assessment: [
              "Review lifecycle management procedures",
              "Verify decommissioning and disposal processes",
              "Assess technology refresh planning",
            ],
          },
        ],
      },
      {
        code: "ID.RA",
        name: "Risk Assessment",
        description:
          "The cybersecurity risk to the organization, assets, and individuals is understood by the organization.",
        sort_order: 2,
        controls: [
          {
            code: "ID.RA-01",
            title: "Vulnerability Identification and Documentation",
            description:
              "Vulnerabilities in assets are identified, validated, and recorded.",
            guidance:
              "Conduct regular vulnerability scans and penetration tests. Validate findings and maintain a vulnerability register with severity ratings.",
            assessment: [
              "Review vulnerability scanning program and frequency",
              "Verify vulnerability validation and recording processes",
              "Assess penetration testing scope and schedule",
            ],
          },
          {
            code: "ID.RA-02",
            title: "Threat Intelligence Reception",
            description:
              "Cyber threat intelligence is received from information sharing forums and sources.",
            guidance:
              "Subscribe to threat intelligence feeds and participate in information sharing organizations (ISACs/ISAOs). Integrate threat intelligence into risk assessment processes.",
            assessment: [
              "Review threat intelligence source subscriptions",
              "Verify participation in information sharing communities",
              "Assess threat intelligence integration into operations",
            ],
          },
          {
            code: "ID.RA-03",
            title: "Internal and External Threat Identification",
            description:
              "Internal and external threats to the organization are identified and recorded.",
            guidance:
              "Maintain a threat catalog covering both internal and external threats. Update the catalog based on threat intelligence and organizational changes.",
            assessment: [
              "Review threat catalog completeness",
              "Verify internal threat identification processes",
              "Assess external threat monitoring capabilities",
            ],
          },
          {
            code: "ID.RA-04",
            title: "Potential Impact Estimation",
            description:
              "Potential impacts and likelihoods of threats exploiting vulnerabilities are identified and recorded.",
            guidance:
              "Perform impact and likelihood analysis for identified threat-vulnerability pairs. Use consistent scoring methodology and document results in risk registers.",
            assessment: [
              "Review impact and likelihood analysis methodology",
              "Verify risk scoring consistency",
              "Assess risk register completeness and currency",
            ],
          },
          {
            code: "ID.RA-05",
            title: "Risk Determination from Threats and Vulnerabilities",
            description:
              "Threats, vulnerabilities, likelihoods, and impacts are used to understand inherent risk and inform risk response prioritization.",
            guidance:
              "Synthesize threat, vulnerability, likelihood, and impact data into risk determinations. Prioritize risk responses based on risk levels and organizational risk tolerance.",
            assessment: [
              "Review risk determination methodology",
              "Verify risk response prioritization processes",
              "Assess alignment with risk appetite and tolerance",
            ],
          },
          {
            code: "ID.RA-06",
            title: "Risk Response Selection and Prioritization",
            description:
              "Risk responses are chosen, prioritized, planned, tracked, and communicated.",
            guidance:
              "Select appropriate risk response actions (accept, mitigate, transfer, avoid). Track response implementation and communicate status to stakeholders.",
            assessment: [
              "Review risk response selection documentation",
              "Verify response implementation tracking",
              "Assess stakeholder communication of risk response status",
            ],
          },
          {
            code: "ID.RA-07",
            title: "Risk Response Effectiveness Management",
            description:
              "Changes and exceptions are managed, assessed for risk impact, recorded, and tracked.",
            guidance:
              "Establish change management processes that include cybersecurity risk assessment. Track exceptions to security policies with risk acceptance documentation.",
            assessment: [
              "Review change management procedures for risk integration",
              "Verify exception tracking and risk acceptance processes",
              "Assess effectiveness of risk-based change evaluation",
            ],
          },
          {
            code: "ID.RA-08",
            title: "Vulnerability Disclosure Management",
            description:
              "Processes for receiving, analyzing, and responding to vulnerability disclosures are established.",
            guidance:
              "Implement a vulnerability disclosure program. Establish procedures for receiving reports, triaging vulnerabilities, coordinating with reporters, and remediating issues.",
            assessment: [
              "Review vulnerability disclosure program documentation",
              "Verify disclosure reception and triage processes",
              "Assess response timeliness and coordination procedures",
            ],
          },
          {
            code: "ID.RA-09",
            title: "Hardware and Software Integrity Assessment",
            description:
              "The authenticity and integrity of hardware and software are assessed prior to acquisition and use.",
            guidance:
              "Verify the authenticity and integrity of hardware and software before deployment. Implement supply chain integrity checks and validate software signatures.",
            assessment: [
              "Review pre-acquisition integrity assessment procedures",
              "Verify software signature validation processes",
              "Assess hardware authenticity verification practices",
            ],
          },
          {
            code: "ID.RA-10",
            title: "Critical Supplier Risk Assessment",
            description:
              "Critical suppliers are assessed before, during, and after the relationship.",
            guidance:
              "Conduct thorough risk assessments of critical suppliers at onboarding, periodically during the relationship, and at termination. Assess security posture and compliance.",
            assessment: [
              "Review supplier risk assessment procedures and records",
              "Verify periodic reassessment schedules",
              "Assess off-boarding risk evaluation processes",
            ],
          },
        ],
      },
      {
        code: "ID.IM",
        name: "Improvement",
        description:
          "Improvements to organizational cybersecurity risk management processes, procedures, and activities are identified across all CSF Functions.",
        sort_order: 3,
        controls: [
          {
            code: "ID.IM-01",
            title: "Improvement Identification from Evaluations",
            description:
              "Improvements are identified from evaluations.",
            guidance:
              "Use results from audits, assessments, and evaluations to identify cybersecurity improvement opportunities. Track and prioritize improvements.",
            assessment: [
              "Review evaluation results and improvement recommendations",
              "Verify improvement tracking processes",
              "Assess implementation of identified improvements",
            ],
          },
          {
            code: "ID.IM-02",
            title: "Improvement Identification from Testing",
            description:
              "Improvements are identified from security tests and exercises, including those done in coordination with suppliers and relevant third parties.",
            guidance:
              "Conduct regular security testing including penetration tests, tabletop exercises, and red team assessments. Document lessons learned and improvement actions.",
            assessment: [
              "Review security testing program and results",
              "Verify lessons learned documentation",
              "Assess improvement action implementation from testing",
            ],
          },
          {
            code: "ID.IM-03",
            title: "Improvement Identification from Operational Experience",
            description:
              "Improvements are identified from execution of operational processes.",
            guidance:
              "Capture operational insights and improvement opportunities from day-to-day security operations. Implement feedback loops between operations and strategy.",
            assessment: [
              "Review operational feedback and improvement processes",
              "Verify feedback loop effectiveness",
              "Assess operational improvement implementation",
            ],
          },
          {
            code: "ID.IM-04",
            title: "Incident Response Improvement",
            description:
              "Incident response plans and other cybersecurity plans that affect operations are established, communicated, maintained, and improved.",
            guidance:
              "Maintain and continuously improve incident response plans based on exercises, real incidents, and threat landscape changes. Communicate updates to all relevant parties.",
            assessment: [
              "Review incident response plan revision history",
              "Verify plan communication and distribution",
              "Assess incorporation of lessons learned from incidents",
            ],
          },
        ],
      },
    ],
  },

  // =========================================================================
  // PROTECT (PR)
  // =========================================================================
  {
    code: "PR",
    name: "Protect",
    description:
      "Safeguards to manage the organization's cybersecurity risks are used.",
    sort_order: 3,
    subcategories: [
      {
        code: "PR.AA",
        name: "Identity Management, Authentication, and Access Control",
        description:
          "Access to physical and logical assets is limited to authorized users, services, and hardware and managed commensurate with the assessed risk of unauthorized access.",
        sort_order: 1,
        controls: [
          {
            code: "PR.AA-01",
            title: "Identity and Credential Management",
            description:
              "Identities and credentials for authorized users, services, and hardware are managed by the organization.",
            guidance:
              "Implement centralized identity management. Establish processes for identity lifecycle management including provisioning, modification, and deprovisioning.",
            assessment: [
              "Review identity management system and processes",
              "Verify credential lifecycle management procedures",
              "Assess identity governance and administration controls",
            ],
          },
          {
            code: "PR.AA-02",
            title: "Identity Proofing",
            description:
              "Identities are proofed and bound to credentials based on the context of interactions.",
            guidance:
              "Implement identity proofing appropriate to the risk level of access being granted. Verify identities before issuing credentials.",
            assessment: [
              "Review identity proofing procedures",
              "Verify credential binding processes",
              "Assess context-based identity verification",
            ],
          },
          {
            code: "PR.AA-03",
            title: "User, Service, and Hardware Authentication",
            description:
              "Users, services, and hardware are authenticated.",
            guidance:
              "Implement multi-factor authentication for all users. Ensure service accounts and hardware devices are authenticated using strong methods.",
            assessment: [
              "Review authentication mechanisms for users",
              "Verify service account authentication methods",
              "Assess MFA deployment and coverage",
            ],
          },
          {
            code: "PR.AA-04",
            title: "Identity Assertions",
            description:
              "Identity assertions are protected, conveyed, and verified.",
            guidance:
              "Secure identity tokens and assertions. Implement proper token validation and protect against assertion replay and forgery attacks.",
            assessment: [
              "Review identity assertion mechanisms",
              "Verify token protection and validation",
              "Assess assertion integrity and confidentiality controls",
            ],
          },
          {
            code: "PR.AA-05",
            title: "Access Permissions and Authorization",
            description:
              "Access permissions, entitlements, and authorizations are defined in a policy, managed, enforced, and reviewed, and incorporate the principles of least privilege and separation of duties.",
            guidance:
              "Implement role-based or attribute-based access control. Apply least privilege principles and separation of duties. Conduct periodic access reviews.",
            assessment: [
              "Review access control policy and implementation",
              "Verify least privilege enforcement",
              "Assess periodic access review processes",
            ],
          },
          {
            code: "PR.AA-06",
            title: "Physical Access Management",
            description:
              "Physical access to assets is managed, monitored, and enforced commensurate with risk.",
            guidance:
              "Implement physical access controls proportional to asset criticality. Monitor and log physical access attempts.",
            assessment: [
              "Review physical access control mechanisms",
              "Verify physical access monitoring and logging",
              "Assess physical security proportionality to risk",
            ],
          },
        ],
      },
      {
        code: "PR.AT",
        name: "Awareness and Training",
        description:
          "The organization's personnel are provided with cybersecurity awareness and training so that they can perform their cybersecurity-related tasks.",
        sort_order: 2,
        controls: [
          {
            code: "PR.AT-01",
            title: "Security Awareness and Training",
            description:
              "Personnel are provided with awareness and training so that they possess the knowledge and skills to perform general tasks with cybersecurity risks in mind.",
            guidance:
              "Develop and deliver cybersecurity awareness training for all personnel. Cover phishing, social engineering, data handling, and incident reporting.",
            assessment: [
              "Review awareness training program content and schedule",
              "Verify training completion rates",
              "Assess training effectiveness through testing",
            ],
          },
          {
            code: "PR.AT-02",
            title: "Privileged User Training",
            description:
              "Individuals in specialized roles are provided with awareness and training so that they possess the knowledge and skills to perform relevant tasks with cybersecurity risks in mind.",
            guidance:
              "Provide specialized security training for IT administrators, developers, and other privileged role holders. Include role-specific security best practices.",
            assessment: [
              "Review specialized training programs for privileged roles",
              "Verify role-specific training completion",
              "Assess privileged user security competency",
            ],
          },
        ],
      },
      {
        code: "PR.DS",
        name: "Data Security",
        description:
          "Data are managed consistent with the organization's risk strategy to protect the confidentiality, integrity, and availability of information.",
        sort_order: 3,
        controls: [
          {
            code: "PR.DS-01",
            title: "Data-at-Rest Protection",
            description:
              "The confidentiality, integrity, and availability of data-at-rest are protected.",
            guidance:
              "Implement encryption for sensitive data at rest. Apply integrity controls and ensure availability through backup and redundancy.",
            assessment: [
              "Review data-at-rest encryption implementation",
              "Verify integrity protection mechanisms",
              "Assess backup and recovery procedures for stored data",
            ],
          },
          {
            code: "PR.DS-02",
            title: "Data-in-Transit Protection",
            description:
              "The confidentiality, integrity, and availability of data-in-transit are protected.",
            guidance:
              "Encrypt data in transit using strong protocols (TLS 1.2+). Implement integrity checks and secure communication channels.",
            assessment: [
              "Review data-in-transit encryption standards",
              "Verify TLS configuration and certificate management",
              "Assess secure communication channel implementation",
            ],
          },
          {
            code: "PR.DS-10",
            title: "Data-in-Use Protection",
            description:
              "The confidentiality, integrity, and availability of data-in-use are protected.",
            guidance:
              "Implement controls to protect data during processing. Apply memory protection, secure computing environments, and access controls for data in use.",
            assessment: [
              "Review data-in-use protection mechanisms",
              "Verify memory and processing protections",
              "Assess secure computing environment controls",
            ],
          },
          {
            code: "PR.DS-11",
            title: "Data Backup Management",
            description:
              "Backups of data are created, protected, maintained, and tested.",
            guidance:
              "Implement regular backup schedules. Protect backups with encryption and access controls. Test restoration procedures periodically.",
            assessment: [
              "Review backup schedule and coverage",
              "Verify backup protection and integrity",
              "Assess restoration testing frequency and results",
            ],
          },
        ],
      },
      {
        code: "PR.PS",
        name: "Platform Security",
        description:
          "The hardware, software (e.g., firmware, operating systems, applications), and services of physical and virtual platforms are managed consistent with the organization's risk strategy to protect their confidentiality, integrity, and availability.",
        sort_order: 4,
        controls: [
          {
            code: "PR.PS-01",
            title: "Configuration Management Practices",
            description:
              "Configuration management practices are established and applied.",
            guidance:
              "Implement configuration management processes including baseline configurations, change control, and configuration monitoring.",
            assessment: [
              "Review configuration management procedures",
              "Verify baseline configuration documentation",
              "Assess configuration change control processes",
            ],
          },
          {
            code: "PR.PS-02",
            title: "Software Maintenance and Updates",
            description:
              "Software is maintained, replaced, and removed commensurate with risk.",
            guidance:
              "Implement patch management processes. Remove unsupported software. Prioritize patching based on risk and criticality.",
            assessment: [
              "Review patch management program",
              "Verify patching timeliness and coverage",
              "Assess end-of-life software management",
            ],
          },
          {
            code: "PR.PS-03",
            title: "Hardware Maintenance and Updates",
            description:
              "Hardware is maintained, replaced, and removed commensurate with risk.",
            guidance:
              "Implement hardware maintenance schedules. Replace hardware before end-of-life. Ensure proper disposal of replaced hardware.",
            assessment: [
              "Review hardware maintenance schedules",
              "Verify hardware lifecycle management",
              "Assess secure disposal procedures",
            ],
          },
          {
            code: "PR.PS-04",
            title: "Log Record Generation",
            description:
              "Log records are generated and made available for continuous monitoring.",
            guidance:
              "Configure logging across all critical systems. Centralize log collection and ensure log integrity. Define log retention policies.",
            assessment: [
              "Review logging configuration across systems",
              "Verify centralized log collection and integrity",
              "Assess log retention policy compliance",
            ],
          },
          {
            code: "PR.PS-05",
            title: "Unauthorized Software Prevention",
            description:
              "Installation and execution of unauthorized software are prevented.",
            guidance:
              "Implement application whitelisting or software restriction policies. Monitor for unauthorized software installations.",
            assessment: [
              "Review application control mechanisms",
              "Verify unauthorized software prevention effectiveness",
              "Assess software approval and deployment processes",
            ],
          },
          {
            code: "PR.PS-06",
            title: "Secure Software Development Practices",
            description:
              "Secure software development practices are integrated, and their performance is monitored throughout the software development life cycle.",
            guidance:
              "Implement secure SDLC practices including secure coding standards, code review, SAST/DAST, and security testing throughout development.",
            assessment: [
              "Review secure SDLC documentation and practices",
              "Verify security testing integration in development pipeline",
              "Assess developer security training and code review processes",
            ],
          },
        ],
      },
      {
        code: "PR.IR",
        name: "Technology Infrastructure Resilience",
        description:
          "Security architectures are managed with the organization's risk strategy to protect asset confidentiality, integrity, and availability, and organizational resilience.",
        sort_order: 5,
        controls: [
          {
            code: "PR.IR-01",
            title: "Network Protection and Monitoring",
            description:
              "Networks and environments are protected from unauthorized logical access and usage.",
            guidance:
              "Implement network segmentation, firewalls, intrusion prevention, and access controls. Monitor network traffic for unauthorized access attempts.",
            assessment: [
              "Review network segmentation and firewall configurations",
              "Verify intrusion prevention system deployment",
              "Assess network access control mechanisms",
            ],
          },
          {
            code: "PR.IR-02",
            title: "Technology Assets Environmental Protection",
            description:
              "The organization's technology assets are protected from environmental threats.",
            guidance:
              "Implement environmental controls including temperature management, fire suppression, flood protection, and power conditioning for technology assets.",
            assessment: [
              "Review environmental control implementations",
              "Verify monitoring of environmental conditions",
              "Assess business continuity for environmental events",
            ],
          },
          {
            code: "PR.IR-03",
            title: "Resilience Mechanisms Implementation",
            description:
              "Mechanisms are implemented to achieve resilience requirements in normal and adverse situations.",
            guidance:
              "Design systems for resilience including redundancy, failover, and graceful degradation. Test resilience mechanisms regularly.",
            assessment: [
              "Review resilience architecture documentation",
              "Verify redundancy and failover mechanisms",
              "Assess resilience testing frequency and results",
            ],
          },
          {
            code: "PR.IR-04",
            title: "Adequate Resource Capacity",
            description:
              "Adequate resource capacity to ensure availability is maintained.",
            guidance:
              "Monitor resource utilization and plan capacity. Implement auto-scaling where appropriate and maintain sufficient reserves for peak demand.",
            assessment: [
              "Review capacity planning processes",
              "Verify resource utilization monitoring",
              "Assess capacity headroom and scaling capabilities",
            ],
          },
        ],
      },
    ],
  },

  // =========================================================================
  // DETECT (DE)
  // =========================================================================
  {
    code: "DE",
    name: "Detect",
    description:
      "Possible cybersecurity attacks and compromises are found and analyzed.",
    sort_order: 4,
    subcategories: [
      {
        code: "DE.CM",
        name: "Continuous Monitoring",
        description:
          "Assets are monitored to find anomalies, indicators of compromise, and other potentially adverse events.",
        sort_order: 1,
        controls: [
          {
            code: "DE.CM-01",
            title: "Network Monitoring",
            description:
              "Networks and network services are monitored to find potentially adverse events.",
            guidance:
              "Deploy network monitoring tools including IDS/IPS, netflow analysis, and anomaly detection. Monitor for indicators of compromise and suspicious traffic patterns.",
            assessment: [
              "Review network monitoring tool deployment and coverage",
              "Verify detection rule currency and effectiveness",
              "Assess monitoring of all network segments",
            ],
          },
          {
            code: "DE.CM-02",
            title: "Physical Environment Monitoring",
            description:
              "The physical environment is monitored to find potentially adverse events.",
            guidance:
              "Implement physical security monitoring including surveillance cameras, intrusion detection systems, and environmental sensors.",
            assessment: [
              "Review physical monitoring system deployment",
              "Verify surveillance coverage of critical areas",
              "Assess physical intrusion detection capabilities",
            ],
          },
          {
            code: "DE.CM-03",
            title: "Personnel Activity Monitoring",
            description:
              "Personnel activity and technology usage are monitored to find potentially adverse events.",
            guidance:
              "Monitor user activity for anomalous behavior, policy violations, and potential insider threats. Implement user and entity behavior analytics (UEBA).",
            assessment: [
              "Review user activity monitoring implementations",
              "Verify UEBA or behavioral analytics deployment",
              "Assess insider threat detection capabilities",
            ],
          },
          {
            code: "DE.CM-06",
            title: "External Service Provider Monitoring",
            description:
              "External service provider activities and services are monitored to find potentially adverse events.",
            guidance:
              "Monitor external service provider access and activities. Implement logging and alerting for third-party connections and privileged activities.",
            assessment: [
              "Review external provider monitoring processes",
              "Verify third-party access logging and alerting",
              "Assess monitoring coverage for provider activities",
            ],
          },
          {
            code: "DE.CM-09",
            title: "Computing Hardware and Software Monitoring",
            description:
              "Computing hardware and software, runtime environments, and their data are monitored to find potentially adverse events.",
            guidance:
              "Deploy endpoint detection and response (EDR) tools. Monitor system integrity, runtime environments, and application behavior for anomalies.",
            assessment: [
              "Review EDR and endpoint monitoring deployment",
              "Verify runtime environment monitoring",
              "Assess system integrity monitoring implementations",
            ],
          },
        ],
      },
      {
        code: "DE.AE",
        name: "Adverse Event Analysis",
        description:
          "Anomalies, indicators of compromise, and other potentially adverse events are analyzed to characterize the events and detect cybersecurity incidents.",
        sort_order: 2,
        controls: [
          {
            code: "DE.AE-02",
            title: "Event Analysis for Incident Identification",
            description:
              "Potentially adverse events are analyzed to better understand associated activities.",
            guidance:
              "Implement event correlation and analysis capabilities. Use SIEM tools to correlate events from multiple sources and identify potential incidents.",
            assessment: [
              "Review event analysis and correlation capabilities",
              "Verify SIEM deployment and configuration",
              "Assess analyst skills and analysis procedures",
            ],
          },
          {
            code: "DE.AE-03",
            title: "Event Correlation and Aggregation",
            description:
              "Information is correlated from multiple sources.",
            guidance:
              "Aggregate and correlate security events from diverse sources including network, endpoint, application, and identity systems. Use automated correlation rules.",
            assessment: [
              "Review log source integration and coverage",
              "Verify correlation rule effectiveness",
              "Assess cross-source analysis capabilities",
            ],
          },
          {
            code: "DE.AE-04",
            title: "Impact Estimation of Events",
            description:
              "The estimated impact and scope of adverse events are understood.",
            guidance:
              "Develop processes to rapidly estimate the impact and scope of detected events. Integrate asset criticality and business context into impact assessment.",
            assessment: [
              "Review impact estimation procedures",
              "Verify integration of asset criticality data",
              "Assess timeliness of impact assessments",
            ],
          },
          {
            code: "DE.AE-06",
            title: "Incident Declaration",
            description:
              "Information on adverse events is provided to authorized staff and tools.",
            guidance:
              "Establish clear criteria for incident declaration. Ensure security event information is communicated to appropriate personnel and fed into incident response workflows.",
            assessment: [
              "Review incident declaration criteria and procedures",
              "Verify information sharing with authorized staff",
              "Assess notification timeliness and completeness",
            ],
          },
          {
            code: "DE.AE-07",
            title: "Cyber Threat Intelligence Integration",
            description:
              "Cyber threat intelligence and other contextual information are integrated into the analysis.",
            guidance:
              "Integrate threat intelligence feeds into detection and analysis tools. Use IOCs, TTPs, and threat actor profiles to enhance event analysis.",
            assessment: [
              "Review threat intelligence feed integration",
              "Verify IOC matching and enrichment capabilities",
              "Assess use of threat context in analysis processes",
            ],
          },
          {
            code: "DE.AE-08",
            title: "False Positive Management",
            description:
              "Incidents are declared when adverse events meet the defined incident criteria.",
            guidance:
              "Refine detection rules to minimize false positives. Establish clear thresholds and criteria for escalating events to incidents. Track false positive rates.",
            assessment: [
              "Review false positive rate tracking and management",
              "Verify detection rule tuning processes",
              "Assess incident declaration threshold appropriateness",
            ],
          },
        ],
      },
    ],
  },

  // =========================================================================
  // RESPOND (RS)
  // =========================================================================
  {
    code: "RS",
    name: "Respond",
    description:
      "Actions regarding a detected cybersecurity incident are taken.",
    sort_order: 5,
    subcategories: [
      {
        code: "RS.MA",
        name: "Incident Management",
        description:
          "Responses to detected cybersecurity incidents are managed.",
        sort_order: 1,
        controls: [
          {
            code: "RS.MA-01",
            title: "Incident Response Plan Execution",
            description:
              "The incident response plan is executed in coordination with relevant third parties once an incident is declared.",
            guidance:
              "Execute incident response plans promptly upon incident declaration. Coordinate with internal teams, external partners, and relevant authorities as defined in the plan.",
            assessment: [
              "Review incident response plan execution records",
              "Verify coordination with third parties during incidents",
              "Assess response timeliness and plan adherence",
            ],
          },
          {
            code: "RS.MA-02",
            title: "Incident Triage and Validation",
            description:
              "Incident reports are triaged and validated.",
            guidance:
              "Implement incident triage procedures to validate, classify, and prioritize reported incidents. Assign severity levels based on impact and urgency.",
            assessment: [
              "Review incident triage procedures",
              "Verify incident classification and prioritization",
              "Assess triage timeliness and accuracy",
            ],
          },
          {
            code: "RS.MA-03",
            title: "Incident Categorization and Prioritization",
            description:
              "Incidents are categorized and prioritized.",
            guidance:
              "Categorize incidents by type (malware, phishing, data breach, etc.) and prioritize based on business impact, scope, and urgency.",
            assessment: [
              "Review incident categorization taxonomy",
              "Verify prioritization criteria and consistency",
              "Assess categorization accuracy in past incidents",
            ],
          },
          {
            code: "RS.MA-04",
            title: "Incident Escalation",
            description:
              "Incidents are escalated or elevated as needed.",
            guidance:
              "Define escalation criteria and paths. Ensure incidents are escalated to appropriate management levels based on severity and potential impact.",
            assessment: [
              "Review escalation procedures and criteria",
              "Verify escalation path documentation",
              "Assess escalation timeliness in past incidents",
            ],
          },
          {
            code: "RS.MA-05",
            title: "Criteria for Incident Response Initiation",
            description:
              "The criteria for initiating incident recovery are applied.",
            guidance:
              "Define clear criteria for transitioning from incident response to recovery operations. Document decision points and responsible parties for recovery initiation.",
            assessment: [
              "Review recovery initiation criteria",
              "Verify decision documentation processes",
              "Assess transition effectiveness in past incidents",
            ],
          },
        ],
      },
      {
        code: "RS.AN",
        name: "Incident Analysis",
        description:
          "Investigations are conducted to ensure effective response and support forensics and recovery activities.",
        sort_order: 2,
        controls: [
          {
            code: "RS.AN-03",
            title: "Forensic Investigation",
            description:
              "Analysis is performed to determine what has taken place during an incident and the root cause of the incident.",
            guidance:
              "Conduct forensic analysis to determine incident root cause, attack vector, and extent of compromise. Preserve evidence for potential legal proceedings.",
            assessment: [
              "Review forensic analysis capabilities and procedures",
              "Verify evidence preservation practices",
              "Assess root cause analysis thoroughness",
            ],
          },
          {
            code: "RS.AN-06",
            title: "Actions Performed During Investigation",
            description:
              "Actions performed during an investigation are recorded, and the integrity of the investigation is preserved.",
            guidance:
              "Maintain detailed investigation logs. Ensure chain of custody for digital evidence. Document all analysis activities and findings.",
            assessment: [
              "Review investigation documentation practices",
              "Verify chain of custody procedures",
              "Assess investigation log completeness",
            ],
          },
          {
            code: "RS.AN-07",
            title: "Incident Data Collection and Preservation",
            description:
              "Incident data and metadata are collected, and their integrity and provenance are preserved.",
            guidance:
              "Collect and preserve incident artifacts including logs, memory dumps, disk images, and network captures. Ensure data integrity through hashing and secure storage.",
            assessment: [
              "Review data collection procedures",
              "Verify integrity preservation mechanisms",
              "Assess artifact storage and retention practices",
            ],
          },
          {
            code: "RS.AN-08",
            title: "Incident Scope Estimation",
            description:
              "An incident's magnitude is estimated and validated.",
            guidance:
              "Assess the scope and magnitude of incidents including affected systems, data, users, and business operations. Validate estimates through investigation findings.",
            assessment: [
              "Review scope estimation procedures",
              "Verify magnitude validation processes",
              "Assess accuracy of scope estimates in past incidents",
            ],
          },
        ],
      },
      {
        code: "RS.CO",
        name: "Incident Response Reporting and Communication",
        description:
          "Response activities are coordinated with internal and external stakeholders, as required by laws, regulations, or policies.",
        sort_order: 3,
        controls: [
          {
            code: "RS.CO-02",
            title: "Internal Stakeholder Notification",
            description:
              "Internal and external stakeholders are notified of incidents.",
            guidance:
              "Notify internal stakeholders (management, legal, HR, communications) and external parties (regulators, customers, partners) as required by incident type and severity.",
            assessment: [
              "Review stakeholder notification procedures",
              "Verify notification timeliness requirements",
              "Assess notification completeness in past incidents",
            ],
          },
          {
            code: "RS.CO-03",
            title: "Information Sharing with Stakeholders",
            description:
              "Information is shared with designated internal and external stakeholders.",
            guidance:
              "Share incident information with relevant parties following established protocols. Ensure appropriate classification and handling of shared information.",
            assessment: [
              "Review information sharing procedures and protocols",
              "Verify classification handling during sharing",
              "Assess sharing timeliness and appropriateness",
            ],
          },
        ],
      },
      {
        code: "RS.MI",
        name: "Incident Mitigation",
        description:
          "Activities are performed to prevent expansion of an event and mitigate its effects.",
        sort_order: 4,
        controls: [
          {
            code: "RS.MI-01",
            title: "Incident Containment",
            description:
              "Incidents are contained.",
            guidance:
              "Implement containment strategies to prevent incident spread. Execute short-term containment immediately and long-term containment for sustained response.",
            assessment: [
              "Review containment strategy documentation",
              "Verify containment execution capabilities",
              "Assess containment effectiveness in past incidents",
            ],
          },
          {
            code: "RS.MI-02",
            title: "Incident Eradication",
            description:
              "Incidents are eradicated.",
            guidance:
              "Remove threat actors, malware, and unauthorized access from affected systems. Verify eradication completeness before recovery.",
            assessment: [
              "Review eradication procedures",
              "Verify completeness verification processes",
              "Assess eradication effectiveness in past incidents",
            ],
          },
        ],
      },
    ],
  },

  // =========================================================================
  // RECOVER (RC)
  // =========================================================================
  {
    code: "RC",
    name: "Recover",
    description:
      "Assets and operations affected by a cybersecurity incident are restored.",
    sort_order: 6,
    subcategories: [
      {
        code: "RC.RP",
        name: "Incident Recovery Plan Execution",
        description:
          "Restoration activities are performed to ensure operational availability of systems and services affected by cybersecurity incidents.",
        sort_order: 1,
        controls: [
          {
            code: "RC.RP-01",
            title: "Recovery Plan Execution",
            description:
              "The recovery portion of the incident response plan is executed once initiated from the incident response process.",
            guidance:
              "Execute recovery plans following containment and eradication. Restore systems and services according to priority and validate restoration before returning to production.",
            assessment: [
              "Review recovery plan execution records",
              "Verify recovery priority adherence",
              "Assess restoration validation procedures",
            ],
          },
          {
            code: "RC.RP-02",
            title: "Recovery Point Selection",
            description:
              "Recovery actions are selected, scoped, and prioritized by balancing the needs of internal and external stakeholders as well as the impact of the incident.",
            guidance:
              "Select appropriate recovery points and methods based on incident impact, data integrity, and stakeholder needs. Balance speed of recovery against completeness.",
            assessment: [
              "Review recovery point selection criteria",
              "Verify stakeholder input in recovery decisions",
              "Assess recovery scope determination processes",
            ],
          },
          {
            code: "RC.RP-03",
            title: "Recovery Verification",
            description:
              "The integrity of backups and other restoration assets is verified before using them for restoration.",
            guidance:
              "Verify backup integrity and ensure restoration assets are free from compromise before using them for recovery. Test restored systems before production deployment.",
            assessment: [
              "Review backup integrity verification procedures",
              "Verify pre-restoration validation processes",
              "Assess restored system testing practices",
            ],
          },
          {
            code: "RC.RP-04",
            title: "Critical Functions and Timing",
            description:
              "Critical mission functions and cybersecurity risk management are considered to establish post-incident operational norms.",
            guidance:
              "Prioritize restoration of critical business functions. Establish and communicate post-incident operational procedures and any temporary risk acceptances.",
            assessment: [
              "Review critical function prioritization",
              "Verify post-incident operational norm documentation",
              "Assess temporary risk acceptance management",
            ],
          },
          {
            code: "RC.RP-05",
            title: "Data and System Integrity Verification",
            description:
              "The integrity of restored assets is verified, systems and services are restored, and normal operating status is confirmed.",
            guidance:
              "Verify the integrity of all restored assets. Confirm systems and services operate normally before full restoration. Document verification results.",
            assessment: [
              "Review integrity verification procedures for restored assets",
              "Verify normal operation confirmation processes",
              "Assess documentation of restoration verification",
            ],
          },
          {
            code: "RC.RP-06",
            title: "Recovery Completion Declaration",
            description:
              "The end of incident recovery is declared based on criteria, and incident-related documentation is completed.",
            guidance:
              "Define clear criteria for recovery completion. Ensure all incident documentation is finalized, lessons learned are captured, and formal recovery closure is declared.",
            assessment: [
              "Review recovery completion criteria",
              "Verify documentation finalization processes",
              "Assess lessons learned capture procedures",
            ],
          },
        ],
      },
      {
        code: "RC.CO",
        name: "Incident Recovery Communication",
        description:
          "Restoration activities are coordinated with internal and external parties.",
        sort_order: 2,
        controls: [
          {
            code: "RC.CO-03",
            title: "Recovery Communication with Stakeholders",
            description:
              "Recovery activities and progress are communicated to designated internal and external stakeholders.",
            guidance:
              "Communicate recovery status, timelines, and progress to all relevant stakeholders. Provide regular updates on restoration milestones and any changes to expected recovery timelines.",
            assessment: [
              "Review recovery communication plans and records",
              "Verify stakeholder update frequency and content",
              "Assess communication effectiveness in past recoveries",
            ],
          },
          {
            code: "RC.CO-04",
            title: "Public Communication of Recovery",
            description:
              "Public updates on incident recovery are shared using approved methods and messaging.",
            guidance:
              "Coordinate public communications about incident recovery through approved channels. Ensure messaging is consistent, accurate, and approved by legal and communications teams.",
            assessment: [
              "Review public communication procedures and approvals",
              "Verify messaging consistency and accuracy",
              "Assess public communication timeliness",
            ],
          },
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Best Practices for GOVERN controls
// ---------------------------------------------------------------------------

const GOVERN_BEST_PRACTICES: BestPracticeDef[] = [
  // GV.OC-01
  {
    control_code: "GV.OC-01",
    title: "Align Cybersecurity Strategy with Mission Statement",
    description:
      "Ensure the cybersecurity strategy document explicitly references the organizational mission and maps security objectives to mission goals.",
    steps: [
      "Review the current organizational mission statement",
      "Map each security objective to a specific mission goal",
      "Document the alignment in the cybersecurity strategy",
      "Present alignment to leadership for endorsement",
    ],
    evidence: [
      "Cybersecurity strategy document with mission references",
      "Mission-to-security-objective mapping matrix",
    ],
    pitfalls: [
      "Creating a cybersecurity strategy in isolation without mission context",
      "Failing to update alignment when the mission evolves",
    ],
  },
  {
    control_code: "GV.OC-01",
    title: "Conduct Annual Mission-Security Alignment Reviews",
    description:
      "Perform annual reviews to verify that cybersecurity investments and priorities remain aligned with evolving organizational mission objectives.",
    steps: [
      "Schedule an annual alignment review meeting with key stakeholders",
      "Assess current cybersecurity investments against mission priorities",
      "Identify gaps or misalignments and propose adjustments",
      "Document review findings and action items",
    ],
    evidence: [
      "Annual alignment review meeting minutes",
      "Gap analysis reports with recommended actions",
    ],
    pitfalls: [
      "Treating the review as a formality without actionable outcomes",
      "Not including business leadership in the alignment review",
    ],
  },
  // GV.OC-02
  {
    control_code: "GV.OC-02",
    title: "Establish a Stakeholder Engagement Registry",
    description:
      "Create and maintain a registry of all internal and external stakeholders with their cybersecurity expectations, communication preferences, and engagement frequency.",
    steps: [
      "Identify all internal stakeholders (executives, IT, legal, HR, operations)",
      "Identify external stakeholders (regulators, customers, partners, vendors)",
      "Document each stakeholder's cybersecurity expectations",
      "Define communication frequency and preferred channels",
    ],
    evidence: [
      "Stakeholder engagement registry document",
      "Communication plan aligned to stakeholder needs",
    ],
    pitfalls: [
      "Overlooking non-obvious stakeholders such as insurance providers",
      "Creating a static registry that is never updated",
    ],
  },
  {
    control_code: "GV.OC-02",
    title: "Conduct Stakeholder Expectation Surveys",
    description:
      "Periodically survey key stakeholders to validate and update understanding of their cybersecurity expectations and risk tolerance.",
    steps: [
      "Design a concise stakeholder expectation survey",
      "Distribute surveys to key internal and external stakeholders",
      "Analyze survey results and identify expectation gaps",
      "Update the stakeholder registry and risk management strategy accordingly",
    ],
    evidence: [
      "Completed stakeholder surveys and analysis summaries",
      "Updated stakeholder expectation documentation",
    ],
    pitfalls: [
      "Using overly technical language that stakeholders cannot understand",
      "Failing to act on survey findings",
    ],
  },
  // GV.OC-03
  {
    control_code: "GV.OC-03",
    title: "Maintain a Compliance Obligations Register",
    description:
      "Create a centralized register of all legal, regulatory, and contractual cybersecurity obligations with ownership, compliance status, and review dates.",
    steps: [
      "Inventory all applicable laws, regulations, and contractual requirements",
      "Assign ownership for each obligation to a responsible party",
      "Track compliance status and evidence for each obligation",
      "Schedule periodic reviews for regulatory changes",
    ],
    evidence: [
      "Compliance obligations register with status tracking",
      "Evidence of periodic regulatory change monitoring",
    ],
    pitfalls: [
      "Maintaining separate compliance tracking in multiple departments",
      "Not monitoring for regulatory changes between review cycles",
    ],
  },
  {
    control_code: "GV.OC-03",
    title: "Implement Regulatory Change Monitoring",
    description:
      "Establish a process to continuously monitor for changes in relevant laws, regulations, and standards that affect the organization.",
    steps: [
      "Subscribe to regulatory update feeds and legal advisories",
      "Assign responsibility for monitoring to legal or compliance team",
      "Establish a process for assessing impact of regulatory changes",
      "Update policies and controls when regulations change",
    ],
    evidence: [
      "Subscription records for regulatory monitoring services",
      "Impact assessment records for regulatory changes",
    ],
    pitfalls: [
      "Relying solely on annual reviews to catch regulatory changes",
      "Not assessing the operational impact of new regulations",
    ],
  },
  // GV.OC-04
  {
    control_code: "GV.OC-04",
    title: "Develop a Critical Services Catalog",
    description:
      "Create and maintain a catalog of critical services and business capabilities that external stakeholders depend on.",
    steps: [
      "Identify all services provided to external stakeholders",
      "Classify services by criticality and dependency level",
      "Document service level agreements and expectations",
      "Map services to supporting infrastructure and systems",
    ],
    evidence: [
      "Critical services catalog document",
      "Service-to-infrastructure dependency maps",
    ],
    pitfalls: [
      "Focusing only on IT services and missing business process dependencies",
      "Not validating criticality ratings with external stakeholders",
    ],
  },
  {
    control_code: "GV.OC-04",
    title: "Conduct Business Impact Analysis for Critical Services",
    description:
      "Perform business impact analysis to quantify the consequences of disruption to critical services and inform risk prioritization.",
    steps: [
      "Identify critical business processes and their dependencies",
      "Estimate financial and operational impact of service disruptions",
      "Determine recovery time and recovery point objectives",
      "Prioritize protection and recovery investments based on impact",
    ],
    evidence: [
      "Business impact analysis report",
      "Recovery time and recovery point objective documentation",
    ],
    pitfalls: [
      "Using unrealistic impact estimates without stakeholder validation",
      "Not updating the BIA when services or dependencies change",
    ],
  },
  // GV.OC-05
  {
    control_code: "GV.OC-05",
    title: "Document Organizational Dependencies",
    description:
      "Map and document the outcomes, capabilities, and services that the organization depends on from internal and external sources.",
    steps: [
      "Identify key organizational dependencies (IT services, supply chain, utilities)",
      "Classify dependencies by criticality and substitutability",
      "Document risk exposure from each dependency",
      "Communicate dependency risks to leadership",
    ],
    evidence: [
      "Organizational dependency map",
      "Risk exposure documentation per dependency",
    ],
    pitfalls: [
      "Overlooking non-technical dependencies like physical infrastructure",
      "Not communicating dependency risks to leadership for informed decisions",
    ],
  },
  {
    control_code: "GV.OC-05",
    title: "Establish Dependency Risk Communication Channels",
    description:
      "Create formal communication channels to ensure dependency-related risks are reported and discussed at appropriate organizational levels.",
    steps: [
      "Define reporting structure for dependency-related risks",
      "Establish periodic dependency risk review meetings",
      "Integrate dependency risks into enterprise risk dashboards",
      "Ensure escalation paths for critical dependency failures",
    ],
    evidence: [
      "Dependency risk communication plan",
      "Meeting minutes from dependency risk reviews",
    ],
    pitfalls: [
      "Communicating dependency risks only during annual reviews",
      "Not including dependency risks in real-time risk dashboards",
    ],
  },
  // GV.RM-01
  {
    control_code: "GV.RM-01",
    title: "Formalize Risk Management Objectives with Executive Endorsement",
    description:
      "Document risk management objectives with clear metrics and obtain formal endorsement from executive leadership.",
    steps: [
      "Draft risk management objectives aligned with business strategy",
      "Define measurable success criteria for each objective",
      "Present objectives to executive leadership for review",
      "Obtain formal sign-off and publish objectives",
    ],
    evidence: [
      "Signed risk management objectives document",
      "Executive endorsement records",
    ],
    pitfalls: [
      "Setting vague objectives without measurable criteria",
      "Not obtaining formal executive endorsement",
    ],
  },
  {
    control_code: "GV.RM-01",
    title: "Conduct Quarterly Risk Management Objective Reviews",
    description:
      "Review risk management objectives quarterly to assess progress and relevance in the current threat and business landscape.",
    steps: [
      "Schedule quarterly review meetings with risk stakeholders",
      "Assess progress against defined metrics",
      "Identify objectives that need adjustment based on changing context",
      "Document review findings and update objectives as needed",
    ],
    evidence: [
      "Quarterly review meeting records",
      "Updated objectives documentation",
    ],
    pitfalls: [
      "Treating quarterly reviews as status updates rather than strategic reviews",
      "Not adjusting objectives when business context changes",
    ],
  },
  // GV.RM-02
  {
    control_code: "GV.RM-02",
    title: "Define Quantitative Risk Appetite Statements",
    description:
      "Develop quantitative risk appetite statements that provide clear, measurable boundaries for cybersecurity risk acceptance.",
    steps: [
      "Work with leadership to define acceptable risk levels",
      "Express risk appetite in quantitative terms where possible",
      "Define risk tolerance thresholds for different risk categories",
      "Communicate statements to all risk decision-makers",
    ],
    evidence: [
      "Quantitative risk appetite and tolerance statements",
      "Communication records to decision-makers",
    ],
    pitfalls: [
      "Using only qualitative statements that are open to interpretation",
      "Not differentiating risk appetite by risk category",
    ],
  },
  {
    control_code: "GV.RM-02",
    title: "Establish Risk Appetite Governance Reviews",
    description:
      "Implement periodic governance reviews of risk appetite and tolerance statements to ensure they remain aligned with organizational strategy and threat landscape.",
    steps: [
      "Schedule semi-annual risk appetite review sessions",
      "Review actual risk levels against stated appetite and tolerance",
      "Assess whether risk appetite remains appropriate given changes",
      "Update and re-communicate any changes to risk appetite",
    ],
    evidence: [
      "Risk appetite review meeting minutes",
      "Updated risk appetite statements with version history",
    ],
    pitfalls: [
      "Never revising risk appetite despite changing conditions",
      "Not involving business leadership in appetite reviews",
    ],
  },
  // GV.RM-03
  {
    control_code: "GV.RM-03",
    title: "Integrate Cybersecurity into Enterprise Risk Reporting",
    description:
      "Ensure cybersecurity risk metrics and status are included in enterprise risk management dashboards and board-level reporting.",
    steps: [
      "Identify key cybersecurity risk metrics for enterprise reporting",
      "Integrate cybersecurity metrics into ERM dashboards",
      "Ensure cybersecurity risk appears in board reporting packages",
      "Align cybersecurity risk taxonomy with enterprise risk taxonomy",
    ],
    evidence: [
      "ERM dashboards showing cybersecurity risk metrics",
      "Board reporting packages with cybersecurity section",
    ],
    pitfalls: [
      "Reporting cybersecurity risk separately from enterprise risk",
      "Using technical jargon in executive-level reporting",
    ],
  },
  {
    control_code: "GV.RM-03",
    title: "Establish Cross-Functional Risk Coordination",
    description:
      "Create cross-functional coordination mechanisms to ensure cybersecurity risk is considered in all enterprise risk decisions.",
    steps: [
      "Establish a cross-functional risk committee or working group",
      "Define regular meeting cadence and participants",
      "Create shared risk registers accessible to all risk functions",
      "Define escalation paths for cross-functional risk issues",
    ],
    evidence: [
      "Cross-functional risk committee charter",
      "Meeting minutes and shared risk register",
    ],
    pitfalls: [
      "Siloing cybersecurity risk from operational and financial risk",
      "Not including non-IT stakeholders in risk coordination",
    ],
  },
  // GV.RM-04
  {
    control_code: "GV.RM-04",
    title: "Document Risk Response Decision Framework",
    description:
      "Create a structured decision framework for selecting risk response options including acceptance criteria, mitigation strategies, transfer mechanisms, and avoidance triggers.",
    steps: [
      "Define criteria for each risk response option (accept, mitigate, transfer, avoid)",
      "Establish decision authority levels for each response type",
      "Create decision trees or flowcharts for common risk scenarios",
      "Train decision-makers on the framework",
    ],
    evidence: [
      "Risk response decision framework document",
      "Decision authority matrix",
    ],
    pitfalls: [
      "Not defining clear criteria for risk acceptance decisions",
      "Allowing ad-hoc risk response without documented rationale",
    ],
  },
  {
    control_code: "GV.RM-04",
    title: "Implement Risk Response Tracking and Accountability",
    description:
      "Track all risk response decisions and their implementation status to ensure accountability and follow-through.",
    steps: [
      "Implement risk response tracking in the risk register",
      "Assign owners for each risk response action",
      "Monitor implementation progress on a regular basis",
      "Report on risk response status to governance bodies",
    ],
    evidence: [
      "Risk register with response tracking fields",
      "Risk response implementation status reports",
    ],
    pitfalls: [
      "Recording risk response decisions but not tracking implementation",
      "Not assigning clear ownership for risk response actions",
    ],
  },
  // GV.RM-05
  {
    control_code: "GV.RM-05",
    title: "Establish Multi-Level Risk Communication Channels",
    description:
      "Create formal communication channels at operational, management, and executive levels for cybersecurity risk information flow.",
    steps: [
      "Define risk communication requirements at each organizational level",
      "Establish regular reporting cadences (daily, weekly, monthly, quarterly)",
      "Include third-party and supply chain risk in communication flows",
      "Test communication channels through exercises",
    ],
    evidence: [
      "Risk communication plan document",
      "Evidence of regular risk communications at all levels",
    ],
    pitfalls: [
      "Having only bottom-up risk communication without top-down direction",
      "Excluding third-party risks from communication channels",
    ],
  },
  {
    control_code: "GV.RM-05",
    title: "Implement Risk Communication Effectiveness Metrics",
    description:
      "Measure and improve the effectiveness of risk communication across the organization to ensure messages are received and understood.",
    steps: [
      "Define metrics for communication effectiveness (timeliness, comprehension, action)",
      "Survey risk communication recipients periodically",
      "Assess whether risk communications lead to appropriate actions",
      "Refine communication methods based on feedback",
    ],
    evidence: [
      "Communication effectiveness survey results",
      "Metrics dashboard for risk communication",
    ],
    pitfalls: [
      "Assuming communications are effective without measuring outcomes",
      "Not adapting communication style for different audiences",
    ],
  },
  // GV.RM-06
  {
    control_code: "GV.RM-06",
    title: "Adopt a Standardized Risk Scoring Methodology",
    description:
      "Implement a consistent, documented methodology for scoring and categorizing cybersecurity risks across the organization.",
    steps: [
      "Select or develop a risk scoring methodology (e.g., FAIR, qualitative matrix)",
      "Document scoring criteria, scales, and categorization rules",
      "Train risk assessors on consistent methodology application",
      "Validate scoring consistency through calibration exercises",
    ],
    evidence: [
      "Risk scoring methodology documentation",
      "Training records and calibration exercise results",
    ],
    pitfalls: [
      "Allowing different teams to use different scoring approaches",
      "Not calibrating risk assessors to ensure consistency",
    ],
  },
  {
    control_code: "GV.RM-06",
    title: "Implement Risk Calculation Tool or Platform",
    description:
      "Deploy a centralized tool or platform for standardized risk calculation, documentation, and prioritization.",
    steps: [
      "Evaluate and select a risk management platform or tool",
      "Configure the tool with the organizational risk methodology",
      "Migrate existing risk data to the centralized platform",
      "Train all risk assessors on tool usage",
    ],
    evidence: [
      "Deployed risk management platform with configuration records",
      "Migration and training completion records",
    ],
    pitfalls: [
      "Deploying a tool without first standardizing the methodology",
      "Maintaining risk data in spreadsheets alongside the platform",
    ],
  },
  // GV.RM-07
  {
    control_code: "GV.RM-07",
    title: "Identify Strategic Cybersecurity Opportunities",
    description:
      "Proactively identify and document strategic opportunities where cybersecurity investments can create competitive advantages or business value.",
    steps: [
      "Review cybersecurity capabilities for business differentiators",
      "Identify customer trust and compliance advantages",
      "Document strategic opportunities in risk discussions",
      "Present opportunities to leadership alongside risk briefings",
    ],
    evidence: [
      "Strategic opportunity documentation",
      "Leadership briefing materials including positive risk",
    ],
    pitfalls: [
      "Focusing exclusively on negative risks and threats",
      "Not quantifying the business value of security investments",
    ],
  },
  {
    control_code: "GV.RM-07",
    title: "Integrate Positive Risk into Risk Register",
    description:
      "Extend the risk register to capture positive risks (opportunities) alongside threats, ensuring both are considered in strategic planning.",
    steps: [
      "Add opportunity fields to the risk register schema",
      "Document known cybersecurity-driven opportunities",
      "Include opportunities in periodic risk review discussions",
      "Track exploitation of positive risks as KPIs",
    ],
    evidence: [
      "Risk register with positive risk entries",
      "Opportunity tracking and exploitation metrics",
    ],
    pitfalls: [
      "Treating the risk register as threats-only",
      "Not tracking whether opportunities are actually exploited",
    ],
  },
  // GV.RR-01
  {
    control_code: "GV.RR-01",
    title: "Formalize Executive Cybersecurity Accountability",
    description:
      "Establish and document executive-level accountability for cybersecurity risk with clear responsibilities and reporting expectations.",
    steps: [
      "Assign a senior executive as accountable for cybersecurity risk",
      "Document accountability in executive role descriptions",
      "Establish executive-level cybersecurity reporting cadence",
      "Include cybersecurity in executive performance evaluations",
    ],
    evidence: [
      "Executive accountability documentation",
      "Cybersecurity performance evaluation criteria",
    ],
    pitfalls: [
      "Assigning cybersecurity accountability to IT without executive ownership",
      "Not including cybersecurity in executive performance metrics",
    ],
  },
  {
    control_code: "GV.RR-01",
    title: "Promote Cybersecurity Culture from Leadership",
    description:
      "Implement leadership-driven initiatives to foster a risk-aware, ethical cybersecurity culture throughout the organization.",
    steps: [
      "Executive leadership communicates cybersecurity importance regularly",
      "Establish security champion programs across departments",
      "Recognize and reward security-positive behaviors",
      "Include security culture metrics in organizational assessments",
    ],
    evidence: [
      "Leadership communications on cybersecurity",
      "Security champion program documentation",
    ],
    pitfalls: [
      "Treating security culture as an IT responsibility only",
      "Not demonstrating leadership commitment through visible actions",
    ],
  },
  // GV.RR-02
  {
    control_code: "GV.RR-02",
    title: "Develop RACI Matrix for Cybersecurity Functions",
    description:
      "Create a RACI (Responsible, Accountable, Consulted, Informed) matrix for all cybersecurity risk management functions and activities.",
    steps: [
      "Identify all cybersecurity risk management functions and activities",
      "Map roles and teams to each function using RACI assignments",
      "Validate RACI assignments with all stakeholders",
      "Publish and communicate the RACI matrix organization-wide",
    ],
    evidence: [
      "Completed RACI matrix for cybersecurity functions",
      "Stakeholder acknowledgment records",
    ],
    pitfalls: [
      "Creating a RACI matrix that is too high-level to be actionable",
      "Not updating the matrix when organizational changes occur",
    ],
  },
  {
    control_code: "GV.RR-02",
    title: "Embed Cybersecurity in Job Descriptions",
    description:
      "Include specific cybersecurity responsibilities in job descriptions for all roles that interact with information systems or data.",
    steps: [
      "Identify roles with cybersecurity-relevant responsibilities",
      "Draft cybersecurity responsibility clauses for each role category",
      "Update job descriptions through HR processes",
      "Ensure new hires acknowledge cybersecurity responsibilities",
    ],
    evidence: [
      "Updated job descriptions with security responsibilities",
      "Employee acknowledgment records",
    ],
    pitfalls: [
      "Limiting cybersecurity responsibilities to IT roles only",
      "Using generic security language that provides no clear guidance",
    ],
  },
  // GV.RR-03
  {
    control_code: "GV.RR-03",
    title: "Conduct Cybersecurity Resource Adequacy Assessment",
    description:
      "Periodically assess whether cybersecurity resources (budget, staffing, tools) are adequate relative to the risk strategy and threat landscape.",
    steps: [
      "Inventory current cybersecurity resources (staff, tools, budget)",
      "Compare resources against risk strategy requirements",
      "Benchmark against industry standards and peer organizations",
      "Present gap analysis and resource requests to leadership",
    ],
    evidence: [
      "Resource adequacy assessment report",
      "Benchmarking analysis and gap identification",
    ],
    pitfalls: [
      "Not benchmarking resource levels against industry standards",
      "Accepting resource constraints without documenting risks",
    ],
  },
  {
    control_code: "GV.RR-03",
    title: "Implement Cybersecurity Budget Alignment Process",
    description:
      "Establish a process to align cybersecurity budgets with risk priorities, ensuring resources are directed to the highest-priority risk areas.",
    steps: [
      "Map budget items to specific risk mitigation activities",
      "Prioritize budget allocation based on risk assessment results",
      "Present risk-aligned budget to leadership for approval",
      "Track spending against risk priorities throughout the year",
    ],
    evidence: [
      "Risk-aligned cybersecurity budget documentation",
      "Spending tracking reports against risk priorities",
    ],
    pitfalls: [
      "Allocating budget based on historical spending rather than current risk",
      "Not tracking whether budget expenditures actually reduce risk",
    ],
  },
  // GV.RR-04
  {
    control_code: "GV.RR-04",
    title: "Integrate Security into Personnel Lifecycle",
    description:
      "Embed cybersecurity considerations into every stage of the employee lifecycle: hiring, onboarding, role changes, and offboarding.",
    steps: [
      "Define security screening requirements for hiring (background checks)",
      "Include security orientation in onboarding processes",
      "Implement access review and adjustment for role changes",
      "Ensure timely access revocation and asset recovery at offboarding",
    ],
    evidence: [
      "Personnel lifecycle security procedures",
      "Onboarding and offboarding checklists with security items",
    ],
    pitfalls: [
      "Not performing background checks for roles with sensitive access",
      "Delayed access revocation during offboarding",
    ],
  },
  {
    control_code: "GV.RR-04",
    title: "Establish Security-Aware Performance Criteria",
    description:
      "Include cybersecurity behavior and compliance in employee performance evaluation criteria.",
    steps: [
      "Define measurable cybersecurity performance criteria",
      "Incorporate security criteria into performance review templates",
      "Train managers on evaluating security behaviors",
      "Recognize and reward strong security performance",
    ],
    evidence: [
      "Updated performance review templates",
      "Evidence of security-related performance evaluations",
    ],
    pitfalls: [
      "Making security performance criteria too vague to evaluate",
      "Not consistently applying criteria across the organization",
    ],
  },
  // GV.PO-01
  {
    control_code: "GV.PO-01",
    title: "Develop a Comprehensive Cybersecurity Policy Framework",
    description:
      "Create a hierarchical cybersecurity policy framework with an overarching policy, supporting standards, procedures, and guidelines.",
    steps: [
      "Develop the top-level cybersecurity policy based on risk assessment",
      "Create supporting standards for specific domains (access control, data protection)",
      "Develop procedures for operational implementation",
      "Obtain leadership approval and communicate to all personnel",
    ],
    evidence: [
      "Approved cybersecurity policy framework documents",
      "Distribution and acknowledgment records",
    ],
    pitfalls: [
      "Creating policies without supporting procedures for implementation",
      "Not enforcing policies consistently across the organization",
    ],
  },
  {
    control_code: "GV.PO-01",
    title: "Implement Policy Compliance Monitoring",
    description:
      "Establish mechanisms to monitor and enforce compliance with cybersecurity policies across the organization.",
    steps: [
      "Define compliance monitoring methods for each policy area",
      "Implement automated compliance checking where possible",
      "Establish regular compliance assessment schedules",
      "Define consequences for non-compliance and escalation procedures",
    ],
    evidence: [
      "Compliance monitoring reports",
      "Automated compliance check configurations",
    ],
    pitfalls: [
      "Relying solely on annual audits for compliance monitoring",
      "Not defining clear consequences for policy violations",
    ],
  },
  // GV.PO-02
  {
    control_code: "GV.PO-02",
    title: "Establish a Policy Review Lifecycle",
    description:
      "Implement a structured policy review lifecycle with defined triggers, review frequencies, and approval workflows.",
    steps: [
      "Define the minimum annual review cycle for all policies",
      "Identify event-driven review triggers (regulatory changes, incidents, org changes)",
      "Establish a policy review committee with defined roles",
      "Implement version control and change tracking for all policies",
    ],
    evidence: [
      "Policy review schedule and lifecycle procedures",
      "Version-controlled policy documents with revision history",
    ],
    pitfalls: [
      "Reviewing policies on schedule but not in response to significant changes",
      "Not maintaining version history and change documentation",
    ],
  },
  {
    control_code: "GV.PO-02",
    title: "Implement Policy Change Communication Process",
    description:
      "Establish a formal process for communicating policy changes to all affected parties and obtaining updated acknowledgments.",
    steps: [
      "Define communication requirements for different types of policy changes",
      "Establish communication channels appropriate for each audience",
      "Track acknowledgment of policy changes from affected personnel",
      "Provide training or guidance for significant policy changes",
    ],
    evidence: [
      "Policy change communication records",
      "Updated acknowledgment records post-change",
    ],
    pitfalls: [
      "Updating policies without informing affected personnel",
      "Not verifying that personnel understand significant policy changes",
    ],
  },
  // GV.OV-01
  {
    control_code: "GV.OV-01",
    title: "Implement Strategic Risk Management Reviews",
    description:
      "Conduct periodic strategic reviews of risk management outcomes to identify areas for improvement and adjustment.",
    steps: [
      "Define review cadence (quarterly or semi-annual)",
      "Collect risk management outcome data and metrics",
      "Analyze trends and effectiveness of current strategy",
      "Recommend and implement strategic adjustments",
    ],
    evidence: [
      "Strategic review meeting records and presentations",
      "Risk management outcome trend analysis reports",
    ],
    pitfalls: [
      "Conducting reviews without actionable outcome data",
      "Not following through on recommended adjustments",
    ],
  },
  {
    control_code: "GV.OV-01",
    title: "Establish Risk Management KPIs and Dashboards",
    description:
      "Define and track key performance indicators for risk management strategy effectiveness through management dashboards.",
    steps: [
      "Define KPIs aligned with risk management strategy objectives",
      "Implement dashboards displaying KPI trends and status",
      "Review KPIs regularly with leadership",
      "Adjust KPIs as strategy evolves",
    ],
    evidence: [
      "KPI definitions and measurement methodology",
      "Dashboard screenshots and review records",
    ],
    pitfalls: [
      "Selecting vanity metrics that do not reflect actual risk management effectiveness",
      "Not reviewing KPIs frequently enough to enable timely adjustments",
    ],
  },
  // GV.OV-02
  {
    control_code: "GV.OV-02",
    title: "Perform Risk Strategy Gap Analysis",
    description:
      "Conduct periodic gap analyses between current risk management strategy and organizational risk landscape to ensure comprehensive coverage.",
    steps: [
      "Map current strategy coverage against known risk categories",
      "Identify emerging risks not addressed by current strategy",
      "Assess strategy effectiveness against recent threat intelligence",
      "Propose strategy adjustments to close identified gaps",
    ],
    evidence: [
      "Gap analysis reports",
      "Strategy adjustment proposals and approvals",
    ],
    pitfalls: [
      "Only reviewing strategy coverage without assessing effectiveness",
      "Not incorporating emerging threats into gap analysis",
    ],
  },
  {
    control_code: "GV.OV-02",
    title: "Implement Continuous Strategy Alignment Monitoring",
    description:
      "Establish ongoing monitoring to ensure risk management strategy remains aligned with organizational requirements and evolving risk landscape.",
    steps: [
      "Define alignment indicators and monitoring triggers",
      "Implement automated monitoring for key alignment metrics",
      "Establish threshold-based alerts for misalignment detection",
      "Review alignment status in regular governance meetings",
    ],
    evidence: [
      "Alignment monitoring configuration and reports",
      "Governance meeting minutes with alignment discussions",
    ],
    pitfalls: [
      "Treating strategy alignment as a periodic check rather than continuous monitoring",
      "Not defining clear triggers for strategy realignment",
    ],
  },
  // GV.OV-03
  {
    control_code: "GV.OV-03",
    title: "Establish Performance Metrics Program",
    description:
      "Create a comprehensive cybersecurity performance metrics program with KPIs, benchmarks, and regular reporting.",
    steps: [
      "Define performance metrics across all cybersecurity domains",
      "Establish baselines and benchmarks for each metric",
      "Implement regular metric collection and reporting",
      "Use metrics to drive continuous improvement decisions",
    ],
    evidence: [
      "Performance metrics program documentation",
      "Regular performance metric reports and trend analysis",
    ],
    pitfalls: [
      "Measuring too many metrics without prioritizing the most meaningful ones",
      "Not using metric results to drive actual improvements",
    ],
  },
  {
    control_code: "GV.OV-03",
    title: "Benchmark Against Industry Standards",
    description:
      "Periodically benchmark cybersecurity performance against industry standards, peer organizations, and recognized frameworks.",
    steps: [
      "Identify relevant industry benchmarks and peer organizations",
      "Collect benchmarking data through assessments and surveys",
      "Compare organizational performance against benchmarks",
      "Develop improvement plans for areas below benchmark",
    ],
    evidence: [
      "Benchmarking analysis reports",
      "Improvement plans for below-benchmark areas",
    ],
    pitfalls: [
      "Using benchmarks that are not relevant to the organization's industry or size",
      "Treating benchmarking as a one-time exercise rather than ongoing comparison",
    ],
  },
  // GV.SC-01
  {
    control_code: "GV.SC-01",
    title: "Develop a Supply Chain Risk Management Program",
    description:
      "Create a formal supply chain risk management program with documented policies, procedures, and governance structure.",
    steps: [
      "Define supply chain risk management scope and objectives",
      "Develop policies and procedures for supplier risk assessment",
      "Establish governance structure with stakeholder roles",
      "Obtain executive approval and communicate program to stakeholders",
    ],
    evidence: [
      "Supply chain risk management program charter",
      "Approved policies and procedures documentation",
    ],
    pitfalls: [
      "Developing the program in IT isolation without procurement and legal involvement",
      "Not defining clear scope boundaries for supply chain risk management",
    ],
  },
  {
    control_code: "GV.SC-01",
    title: "Implement Supply Chain Risk Governance Framework",
    description:
      "Establish a governance framework for supply chain risk management with clear roles, decision authorities, and escalation paths.",
    steps: [
      "Define governance roles (CISO, procurement, legal, business owners)",
      "Establish a supply chain risk review committee",
      "Define decision authorities for supplier risk acceptance",
      "Create escalation procedures for critical supply chain risks",
    ],
    evidence: [
      "Supply chain risk governance framework document",
      "Committee charter and meeting records",
    ],
    pitfalls: [
      "Not including procurement and legal in supply chain risk governance",
      "Lacking clear decision authority for supplier risk acceptance",
    ],
  },
  // GV.SC-02
  {
    control_code: "GV.SC-02",
    title: "Define and Communicate Supplier Security Responsibilities",
    description:
      "Clearly define and communicate cybersecurity responsibilities for suppliers, customers, and partners through formal documentation.",
    steps: [
      "Define standard security responsibilities for each supplier category",
      "Create responsibility matrices for key supplier relationships",
      "Communicate responsibilities through contracts and onboarding",
      "Verify supplier understanding and acceptance",
    ],
    evidence: [
      "Supplier security responsibility matrices",
      "Communication and acceptance records",
    ],
    pitfalls: [
      "Using generic security responsibilities regardless of supplier type",
      "Not verifying that suppliers understand and accept their responsibilities",
    ],
  },
  {
    control_code: "GV.SC-02",
    title: "Establish Supply Chain Coordination Mechanisms",
    description:
      "Create coordination mechanisms for ongoing cybersecurity communication and collaboration with key supply chain partners.",
    steps: [
      "Identify critical supply chain partners requiring coordination",
      "Establish regular security review meetings with key suppliers",
      "Create shared communication channels for security information",
      "Define coordination protocols for security incidents",
    ],
    evidence: [
      "Supply chain coordination plan",
      "Records of regular coordination activities",
    ],
    pitfalls: [
      "Limiting coordination to contract renewals rather than ongoing engagement",
      "Not having security-specific communication channels with suppliers",
    ],
  },
  // GV.SC-03 through GV.SC-10 (2 each)
  {
    control_code: "GV.SC-03",
    title: "Embed Supply Chain Risk in Enterprise Risk Registers",
    description:
      "Ensure supply chain cybersecurity risks are systematically captured in enterprise risk registers and included in organizational risk assessments.",
    steps: [
      "Add supply chain risk categories to the enterprise risk register",
      "Conduct supply chain risk assessments for critical suppliers",
      "Integrate findings into organizational risk reporting",
      "Monitor supply chain risk metrics alongside other enterprise risks",
    ],
    evidence: [
      "Enterprise risk register with supply chain entries",
      "Supply chain risk assessment reports",
    ],
    pitfalls: [
      "Tracking supply chain risk separately from enterprise risk",
      "Not including supply chain risk in board-level risk reporting",
    ],
  },
  {
    control_code: "GV.SC-03",
    title: "Align Supply Chain Risk Assessment with ERM Methodology",
    description:
      "Use the same risk assessment methodology for supply chain risks as for other enterprise risks to enable consistent comparison and prioritization.",
    steps: [
      "Apply enterprise risk scoring methodology to supply chain risks",
      "Ensure supply chain risks can be compared with other risk categories",
      "Include supply chain risk in enterprise risk heat maps",
      "Review supply chain risk alongside other enterprise risks in governance meetings",
    ],
    evidence: [
      "Consistent risk scoring for supply chain risks",
      "Enterprise risk heat maps including supply chain",
    ],
    pitfalls: [
      "Using different scoring methods for supply chain risk vs other risks",
      "Not enabling comparison across risk categories",
    ],
  },
  {
    control_code: "GV.SC-04",
    title: "Implement Supplier Criticality Classification",
    description:
      "Classify all suppliers by criticality level based on the nature and sensitivity of services provided, data access, and business dependency.",
    steps: [
      "Define criticality classification criteria and tiers",
      "Assess all suppliers against the classification criteria",
      "Assign security control requirements proportional to tier",
      "Review classifications periodically and when services change",
    ],
    evidence: [
      "Supplier classification criteria and tier definitions",
      "Classified supplier inventory",
    ],
    pitfalls: [
      "Applying the same security requirements to all suppliers regardless of risk",
      "Not reclassifying suppliers when the relationship scope changes",
    ],
  },
  {
    control_code: "GV.SC-04",
    title: "Conduct Comprehensive Supplier Due Diligence",
    description:
      "Perform thorough due diligence assessments for critical suppliers to evaluate their cybersecurity posture and risk to the organization.",
    steps: [
      "Define due diligence assessment criteria and questionnaires",
      "Assess critical suppliers using security questionnaires and evidence review",
      "Review third-party assessment reports (SOC 2, ISO 27001, etc.)",
      "Document due diligence findings and risk acceptance decisions",
    ],
    evidence: [
      "Due diligence assessment records for critical suppliers",
      "Third-party certification and assessment reports",
    ],
    pitfalls: [
      "Relying solely on questionnaire self-assessments without evidence verification",
      "Not reassessing suppliers periodically after initial due diligence",
    ],
  },
  {
    control_code: "GV.SC-05",
    title: "Standardize Cybersecurity Contract Clauses",
    description:
      "Develop and implement standard cybersecurity contract clauses for inclusion in all supplier agreements.",
    steps: [
      "Collaborate with legal to develop standard security contract clauses",
      "Define minimum clauses for all suppliers and enhanced clauses for critical suppliers",
      "Include right-to-audit, breach notification, and data handling requirements",
      "Train procurement on security clause requirements",
    ],
    evidence: [
      "Standard cybersecurity contract clause library",
      "Procurement training records",
    ],
    pitfalls: [
      "Not including right-to-audit clauses in supplier contracts",
      "Using the same clauses for all suppliers without risk-based tailoring",
    ],
  },
  {
    control_code: "GV.SC-05",
    title: "Monitor Supplier Contract Compliance",
    description:
      "Implement ongoing monitoring of supplier compliance with contractual cybersecurity requirements.",
    steps: [
      "Define compliance monitoring methods for each contract requirement",
      "Schedule periodic compliance reviews for critical suppliers",
      "Track and report on supplier compliance status",
      "Implement remediation processes for non-compliance",
    ],
    evidence: [
      "Supplier compliance monitoring reports",
      "Remediation action records for non-compliance",
    ],
    pitfalls: [
      "Only checking compliance at contract renewal time",
      "Not following up on identified compliance gaps",
    ],
  },
  {
    control_code: "GV.SC-06",
    title: "Implement Pre-Engagement Security Assessments",
    description:
      "Conduct security assessments of potential suppliers before entering into formal agreements to identify and evaluate cybersecurity risks.",
    steps: [
      "Define pre-engagement assessment requirements and criteria",
      "Develop assessment questionnaires and evaluation procedures",
      "Conduct assessments for all new supplier engagements",
      "Document risk acceptance decisions before contract signing",
    ],
    evidence: [
      "Pre-engagement assessment procedures and questionnaires",
      "Completed assessment records with risk decisions",
    ],
    pitfalls: [
      "Conducting assessments after contracts are already signed",
      "Not including cybersecurity in vendor selection criteria",
    ],
  },
  {
    control_code: "GV.SC-06",
    title: "Establish Minimum Security Standards for Suppliers",
    description:
      "Define and communicate minimum cybersecurity standards that suppliers must meet before entering into a relationship.",
    steps: [
      "Define minimum security standards based on industry best practices",
      "Tier standards based on supplier criticality and data access level",
      "Communicate standards to procurement and potential suppliers",
      "Verify compliance with minimum standards before engagement",
    ],
    evidence: [
      "Minimum supplier security standards document",
      "Compliance verification records for new suppliers",
    ],
    pitfalls: [
      "Setting standards so high that no supplier can meet them",
      "Not differentiating standards based on risk level",
    ],
  },
  {
    control_code: "GV.SC-07",
    title: "Implement Continuous Supplier Risk Monitoring",
    description:
      "Establish continuous monitoring of supplier cybersecurity risk throughout the relationship lifecycle.",
    steps: [
      "Subscribe to supplier risk monitoring services",
      "Monitor for supplier security incidents and breaches",
      "Track supplier security ratings and changes over time",
      "Integrate monitoring data into supplier risk assessments",
    ],
    evidence: [
      "Supplier risk monitoring service subscriptions",
      "Monitoring alerts and risk rating tracking records",
    ],
    pitfalls: [
      "Relying on annual assessments instead of continuous monitoring",
      "Not acting on monitoring alerts in a timely manner",
    ],
  },
  {
    control_code: "GV.SC-07",
    title: "Conduct Periodic Supplier Risk Reassessments",
    description:
      "Perform scheduled reassessments of supplier cybersecurity risk, with frequency based on supplier criticality.",
    steps: [
      "Define reassessment frequency based on supplier criticality tiers",
      "Conduct reassessments using standardized methodology",
      "Compare results with previous assessments to identify trends",
      "Update risk registers and response plans based on findings",
    ],
    evidence: [
      "Supplier reassessment schedule and completion records",
      "Trend analysis reports across assessment periods",
    ],
    pitfalls: [
      "Using the same assessment frequency for all suppliers regardless of risk",
      "Not comparing results across assessment periods",
    ],
  },
  {
    control_code: "GV.SC-08",
    title: "Include Suppliers in Incident Response Planning",
    description:
      "Ensure critical suppliers are integrated into organizational incident response plans, with defined roles, communication channels, and coordination procedures.",
    steps: [
      "Identify suppliers that should be part of incident response planning",
      "Define supplier roles and responsibilities during incidents",
      "Establish communication channels and escalation procedures",
      "Conduct joint incident response exercises with critical suppliers",
    ],
    evidence: [
      "Incident response plans with supplier integration sections",
      "Joint exercise records and after-action reports",
    ],
    pitfalls: [
      "Not including suppliers in incident response exercises",
      "Lacking pre-established communication channels for incident coordination",
    ],
  },
  {
    control_code: "GV.SC-08",
    title: "Establish Supply Chain Incident Communication Protocols",
    description:
      "Define and test communication protocols for supply chain security incidents, ensuring rapid and effective coordination.",
    steps: [
      "Define incident notification requirements for suppliers (timing, content, format)",
      "Establish secure communication channels for incident information sharing",
      "Create templates for supplier incident notifications",
      "Test communication protocols through tabletop exercises",
    ],
    evidence: [
      "Supply chain incident communication protocol document",
      "Communication protocol test records",
    ],
    pitfalls: [
      "Not defining response time requirements for supplier incident notifications",
      "Not testing communication protocols before they are needed",
    ],
  },
  {
    control_code: "GV.SC-09",
    title: "Monitor Supply Chain Security Throughout Product Lifecycle",
    description:
      "Implement monitoring of supply chain security practices throughout the entire technology product and service lifecycle.",
    steps: [
      "Define monitoring points across the product/service lifecycle",
      "Implement security validation at each lifecycle stage",
      "Track supply chain security metrics over time",
      "Report on lifecycle security performance to governance bodies",
    ],
    evidence: [
      "Lifecycle monitoring plan and implementation records",
      "Supply chain security performance reports",
    ],
    pitfalls: [
      "Only monitoring at procurement and ignoring in-service monitoring",
      "Not tracking security performance metrics over the full lifecycle",
    ],
  },
  {
    control_code: "GV.SC-09",
    title: "Integrate Supply Chain Metrics into Security Program",
    description:
      "Include supply chain security performance metrics in the overall cybersecurity program metrics and reporting.",
    steps: [
      "Define supply chain security KPIs",
      "Integrate KPIs into cybersecurity program dashboards",
      "Report on supply chain security alongside other program metrics",
      "Use metrics to drive supply chain security improvements",
    ],
    evidence: [
      "Supply chain KPI definitions",
      "Integrated cybersecurity program dashboards",
    ],
    pitfalls: [
      "Reporting supply chain security metrics separately from program metrics",
      "Defining KPIs that are difficult to collect or verify",
    ],
  },
  {
    control_code: "GV.SC-10",
    title: "Define Supplier Off-boarding Security Procedures",
    description:
      "Establish comprehensive security procedures for supplier relationship termination including data handling, access revocation, and knowledge transfer.",
    steps: [
      "Define data return and destruction requirements for terminated suppliers",
      "Establish access revocation timelines and verification procedures",
      "Define knowledge transfer requirements for transitioning services",
      "Create off-boarding checklists for different supplier categories",
    ],
    evidence: [
      "Supplier off-boarding security procedures",
      "Completed off-boarding checklists",
    ],
    pitfalls: [
      "Not revoking supplier access promptly upon relationship termination",
      "Not verifying data destruction by terminated suppliers",
    ],
  },
  {
    control_code: "GV.SC-10",
    title: "Implement Post-Termination Risk Monitoring",
    description:
      "Monitor for residual risks after supplier relationship termination, including data exposure and lingering access.",
    steps: [
      "Conduct post-termination access audits",
      "Verify data destruction certificates from terminated suppliers",
      "Monitor for unauthorized access from former supplier systems",
      "Assess residual risk from former supplier knowledge of systems",
    ],
    evidence: [
      "Post-termination access audit reports",
      "Data destruction verification records",
    ],
    pitfalls: [
      "Assuming all risk ends when the contract expires",
      "Not monitoring for unauthorized access after termination",
    ],
  },
];

// ---------------------------------------------------------------------------
// Seeding logic
// ---------------------------------------------------------------------------

async function seedAdminUser(client: PoolClient): Promise<void> {
  console.log("\n--- Seeding Admin User ---");

  const existing = await client.query(
    "SELECT id FROM users WHERE email = $1",
    ["admin@policyvault.local"]
  );

  if (existing.rows.length > 0) {
    console.log("  Admin user already exists, skipping.");
    return;
  }

  const passwordHash = await bcrypt.hash("admin123", 12);

  await client.query(
    `INSERT INTO users (email, password_hash, name, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO NOTHING`,
    ["admin@policyvault.local", passwordHash, "Admin User", "admin"]
  );

  console.log("  Admin user created (admin@policyvault.local).");
}

async function seedFramework(client: PoolClient): Promise<void> {
  console.log("\n--- Seeding NIST CSF 2.0 Framework ---");

  // 1. Insert framework record
  const fwResult = await client.query(
    `INSERT INTO frameworks (code, name, version, release_date, issuing_body, description, industry_applicability, total_controls)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (code) DO UPDATE SET
       name = EXCLUDED.name,
       version = EXCLUDED.version,
       release_date = EXCLUDED.release_date,
       issuing_body = EXCLUDED.issuing_body,
       description = EXCLUDED.description,
       industry_applicability = EXCLUDED.industry_applicability,
       total_controls = EXCLUDED.total_controls
     RETURNING id`,
    [
      "NIST-CSF-2.0",
      "NIST Cybersecurity Framework",
      "2.0",
      "2024-02-26",
      "National Institute of Standards and Technology (NIST)",
      "The NIST Cybersecurity Framework (CSF) 2.0 provides guidance to industry, government agencies, and other organizations to manage cybersecurity risks. It offers a taxonomy of high-level cybersecurity outcomes that can be used by any organization — regardless of its size, sector, or maturity — to better understand, assess, prioritize, and communicate its cybersecurity efforts.",
      [
        "All Industries",
        "Government",
        "Critical Infrastructure",
        "Healthcare",
        "Financial Services",
        "Energy",
        "Manufacturing",
        "Technology",
      ],
      106, // approximate total
    ]
  );

  const frameworkId: string = fwResult.rows[0].id;
  console.log(`  Framework record created/updated (id: ${frameworkId}).`);

  let totalControls = 0;

  // 2. Seed Functions, Subcategories, Controls
  for (const func of NIST_CSF_FUNCTIONS) {
    console.log(`\n  Function: ${func.code} - ${func.name}`);

    // Insert top-level category (Function)
    const funcResult = await client.query(
      `INSERT INTO framework_categories (framework_id, category_code, category_name, description, parent_category_id, sort_order)
       VALUES ($1, $2, $3, $4, NULL, $5)
       ON CONFLICT (framework_id, category_code) DO UPDATE SET
         category_name = EXCLUDED.category_name,
         description = EXCLUDED.description,
         sort_order = EXCLUDED.sort_order
       RETURNING id`,
      [frameworkId, func.code, func.name, func.description, func.sort_order]
    );

    const functionCategoryId: string = funcResult.rows[0].id;

    for (const sub of func.subcategories) {
      console.log(`    Subcategory: ${sub.code} - ${sub.name}`);

      // Insert subcategory with parent reference
      const subResult = await client.query(
        `INSERT INTO framework_categories (framework_id, category_code, category_name, description, parent_category_id, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (framework_id, category_code) DO UPDATE SET
           category_name = EXCLUDED.category_name,
           description = EXCLUDED.description,
           parent_category_id = EXCLUDED.parent_category_id,
           sort_order = EXCLUDED.sort_order
         RETURNING id`,
        [
          frameworkId,
          sub.code,
          sub.name,
          sub.description,
          functionCategoryId,
          sub.sort_order,
        ]
      );

      const subcategoryId: string = subResult.rows[0].id;

      for (let i = 0; i < sub.controls.length; i++) {
        const ctrl = sub.controls[i];

        const ctrlResult = await client.query(
          `INSERT INTO framework_controls (framework_id, category_id, control_code, control_title, control_description, implementation_guidance, assessment_procedures, related_controls, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (framework_id, control_code) DO UPDATE SET
             category_id = EXCLUDED.category_id,
             control_title = EXCLUDED.control_title,
             control_description = EXCLUDED.control_description,
             implementation_guidance = EXCLUDED.implementation_guidance,
             assessment_procedures = EXCLUDED.assessment_procedures,
             related_controls = EXCLUDED.related_controls,
             sort_order = EXCLUDED.sort_order
           RETURNING id`,
          [
            frameworkId,
            subcategoryId,
            ctrl.code,
            ctrl.title,
            ctrl.description,
            ctrl.guidance,
            JSON.stringify(ctrl.assessment),
            ctrl.related || [],
            i + 1,
          ]
        );

        totalControls++;
        const controlId: string = ctrlResult.rows[0].id;

        // Insert best practices for GOVERN controls
        const practices = GOVERN_BEST_PRACTICES.filter(
          (bp) => bp.control_code === ctrl.code
        );
        for (let j = 0; j < practices.length; j++) {
          const bp = practices[j];
          await client.query(
            `INSERT INTO control_best_practices (control_id, practice_title, practice_description, implementation_steps, evidence_examples, common_pitfalls, source, sort_order)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT DO NOTHING`,
            [
              controlId,
              bp.title,
              bp.description,
              JSON.stringify(bp.steps),
              JSON.stringify(bp.evidence),
              JSON.stringify(bp.pitfalls),
              "NIST CSF 2.0 Implementation Guidance",
              j + 1,
            ]
          );
        }

        if (practices.length > 0) {
          console.log(
            `      ${ctrl.code}: ${ctrl.title} (${practices.length} best practices)`
          );
        } else {
          console.log(`      ${ctrl.code}: ${ctrl.title}`);
        }
      }
    }
  }

  // Update total_controls count
  await client.query(
    `UPDATE frameworks SET total_controls = $1 WHERE id = $2`,
    [totalControls, frameworkId]
  );

  console.log(`\n  Total controls seeded: ${totalControls}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function seed(): Promise<void> {
  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await seedAdminUser(client);
    await seedFramework(client);

    await client.query("COMMIT");

    console.log("\n=== Seed completed successfully ===\n");

    // Print summary
    const fwCount = await client.query("SELECT COUNT(*) FROM frameworks");
    const catCount = await client.query(
      "SELECT COUNT(*) FROM framework_categories"
    );
    const ctrlCount = await client.query(
      "SELECT COUNT(*) FROM framework_controls"
    );
    const bpCount = await client.query(
      "SELECT COUNT(*) FROM control_best_practices"
    );
    const userCount = await client.query("SELECT COUNT(*) FROM users");

    console.log("Summary:");
    console.log(`  Users:            ${userCount.rows[0].count}`);
    console.log(`  Frameworks:       ${fwCount.rows[0].count}`);
    console.log(`  Categories:       ${catCount.rows[0].count}`);
    console.log(`  Controls:         ${ctrlCount.rows[0].count}`);
    console.log(`  Best Practices:   ${bpCount.rows[0].count}`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("\nSeed FAILED — rolled back transaction.");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

console.log("Seeding database...");
console.log(`Database: ${DATABASE_URL.replace(/\/\/.*@/, "//***@")}\n`);

seed()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seed error:", err);
    process.exit(1);
  });
