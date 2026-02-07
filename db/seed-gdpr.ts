import { Pool } from "pg";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_MDRrigq17LGu@ep-calm-night-ai4qscfu-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function query(text: string, params?: unknown[]) {
  return pool.query(text, params);
}

async function seedGDPR() {
  console.log("Seeding GDPR framework...");

  const frameworkResult = await query(
    `INSERT INTO frameworks (code, name, version, release_date, issuing_body, description, industry_applicability, total_controls, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (code) DO UPDATE SET name = $2, version = $3, updated_at = now()
     RETURNING id`,
    [
      "GDPR",
      "General Data Protection Regulation",
      "2016/679",
      "2018-05-25",
      "European Union",
      "The General Data Protection Regulation (GDPR) is a regulation in EU law on data protection and privacy in the European Union and the European Economic Area. It also addresses the transfer of personal data outside the EU and EEA areas.",
      ["All Industries", "Technology", "Healthcare", "Finance", "Retail", "Marketing"],
      99,
      true,
    ]
  );
  const frameworkId = frameworkResult.rows[0].id;

  const categories = [
    { code: "PRINCIPLES", name: "Principles of Processing", description: "Fundamental principles relating to processing of personal data (Articles 5-11)." },
    { code: "RIGHTS", name: "Rights of Data Subjects", description: "Rights of individuals whose personal data is processed (Articles 12-23)." },
    { code: "CONTROLLER", name: "Controller and Processor", description: "Obligations of data controllers and processors (Articles 24-43)." },
    { code: "TRANSFER", name: "International Transfers", description: "Rules for transferring personal data to third countries (Articles 44-50)." },
    { code: "AUTHORITY", name: "Supervisory Authorities", description: "Independent supervisory authorities and cooperation (Articles 51-76)." },
    { code: "REMEDIES", name: "Remedies and Penalties", description: "Remedies, liability, and administrative fines (Articles 77-84)." },
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

  const controls = [
    // Principles of Processing (Articles 5-11)
    { category: "PRINCIPLES", code: "Art.5.1.a", title: "Lawfulness, Fairness and Transparency", description: "Personal data shall be processed lawfully, fairly and in a transparent manner in relation to the data subject." },
    { category: "PRINCIPLES", code: "Art.5.1.b", title: "Purpose Limitation", description: "Personal data shall be collected for specified, explicit and legitimate purposes and not further processed in a manner that is incompatible with those purposes." },
    { category: "PRINCIPLES", code: "Art.5.1.c", title: "Data Minimization", description: "Personal data shall be adequate, relevant and limited to what is necessary in relation to the purposes for which they are processed." },
    { category: "PRINCIPLES", code: "Art.5.1.d", title: "Accuracy", description: "Personal data shall be accurate and, where necessary, kept up to date; every reasonable step must be taken to ensure that personal data that are inaccurate are erased or rectified without delay." },
    { category: "PRINCIPLES", code: "Art.5.1.e", title: "Storage Limitation", description: "Personal data shall be kept in a form which permits identification of data subjects for no longer than is necessary for the purposes for which the personal data are processed." },
    { category: "PRINCIPLES", code: "Art.5.1.f", title: "Integrity and Confidentiality", description: "Personal data shall be processed in a manner that ensures appropriate security of the personal data, including protection against unauthorized or unlawful processing and against accidental loss, destruction or damage." },
    { category: "PRINCIPLES", code: "Art.5.2", title: "Accountability", description: "The controller shall be responsible for, and be able to demonstrate compliance with the data protection principles." },
    { category: "PRINCIPLES", code: "Art.6.1.a", title: "Consent", description: "Processing is lawful if the data subject has given consent to the processing of their personal data for one or more specific purposes." },
    { category: "PRINCIPLES", code: "Art.6.1.b", title: "Contractual Necessity", description: "Processing is necessary for the performance of a contract to which the data subject is party or to take steps at the request of the data subject prior to entering into a contract." },
    { category: "PRINCIPLES", code: "Art.6.1.c", title: "Legal Obligation", description: "Processing is necessary for compliance with a legal obligation to which the controller is subject." },
    { category: "PRINCIPLES", code: "Art.6.1.d", title: "Vital Interests", description: "Processing is necessary to protect the vital interests of the data subject or of another natural person." },
    { category: "PRINCIPLES", code: "Art.6.1.e", title: "Public Interest", description: "Processing is necessary for the performance of a task carried out in the public interest or in the exercise of official authority vested in the controller." },
    { category: "PRINCIPLES", code: "Art.6.1.f", title: "Legitimate Interests", description: "Processing is necessary for the purposes of the legitimate interests pursued by the controller or by a third party, except where such interests are overridden by the interests or fundamental rights and freedoms of the data subject." },
    { category: "PRINCIPLES", code: "Art.7.1", title: "Conditions for Consent - Demonstration", description: "Where processing is based on consent, the controller shall be able to demonstrate that the data subject has consented to processing of their personal data." },
    { category: "PRINCIPLES", code: "Art.7.2", title: "Conditions for Consent - Presentation", description: "If consent is given in a written declaration which also concerns other matters, the request for consent shall be presented in a manner which is clearly distinguishable from the other matters, in an intelligible and easily accessible form, using clear and plain language." },
    { category: "PRINCIPLES", code: "Art.7.3", title: "Conditions for Consent - Withdrawal", description: "The data subject shall have the right to withdraw consent at any time. The withdrawal of consent shall not affect the lawfulness of processing based on consent before its withdrawal." },
    { category: "PRINCIPLES", code: "Art.7.4", title: "Conditions for Consent - Freely Given", description: "When assessing whether consent is freely given, utmost account shall be taken of whether the performance of a contract is conditional on consent to the processing of personal data that is not necessary for that contract." },
    { category: "PRINCIPLES", code: "Art.8.1", title: "Child's Consent", description: "Where consent applies, in relation to the offer of information society services directly to a child, the processing of the personal data of a child shall be lawful where the child is at least 16 years old." },
    { category: "PRINCIPLES", code: "Art.9.1", title: "Special Categories Prohibition", description: "Processing of personal data revealing racial or ethnic origin, political opinions, religious or philosophical beliefs, trade union membership, genetic data, biometric data, health data, or sex life/orientation shall be prohibited." },
    { category: "PRINCIPLES", code: "Art.9.2", title: "Special Categories Exceptions", description: "Processing of special categories is permitted under specific conditions including explicit consent, employment obligations, vital interests, legitimate activities, manifestly public data, legal claims, substantial public interest, health purposes, public health, and archiving/research." },
    { category: "PRINCIPLES", code: "Art.10", title: "Criminal Convictions Data", description: "Processing of personal data relating to criminal convictions and offences shall be carried out only under the control of official authority or when authorized by Union or Member State law." },
    { category: "PRINCIPLES", code: "Art.11.1", title: "Processing Not Requiring Identification", description: "If the purposes for which a controller processes personal data do not require the identification of a data subject, the controller shall not be obliged to maintain, acquire or process additional information to identify the data subject." },

    // Rights of Data Subjects (Articles 12-23)
    { category: "RIGHTS", code: "Art.12.1", title: "Transparent Communication", description: "The controller shall take appropriate measures to provide information relating to processing to the data subject in a concise, transparent, intelligible and easily accessible form, using clear and plain language." },
    { category: "RIGHTS", code: "Art.12.2", title: "Facilitating Rights Exercise", description: "The controller shall facilitate the exercise of data subject rights under Articles 15 to 22." },
    { category: "RIGHTS", code: "Art.12.3", title: "Response Timeframe", description: "The controller shall provide information on action taken on a request within one month of receipt of the request, extendable by two further months where necessary." },
    { category: "RIGHTS", code: "Art.12.4", title: "Refusal to Act", description: "If the controller does not take action on the request, they shall inform the data subject within one month of reasons for not taking action and the possibility of lodging a complaint." },
    { category: "RIGHTS", code: "Art.12.5", title: "Free Information", description: "Information and actions taken shall be provided free of charge. Where requests are manifestly unfounded or excessive, the controller may charge a reasonable fee or refuse to act." },
    { category: "RIGHTS", code: "Art.12.6", title: "Identity Verification", description: "Where the controller has reasonable doubts concerning the identity of the natural person making the request, the controller may request additional information necessary to confirm identity." },
    { category: "RIGHTS", code: "Art.13.1", title: "Information at Collection - Direct", description: "Where personal data are collected from the data subject, the controller shall provide identity and contact details, purposes and legal basis, recipients, and transfer intentions at the time of collection." },
    { category: "RIGHTS", code: "Art.13.2", title: "Additional Information at Collection", description: "At the time of collection, the controller shall provide information on retention period, data subject rights, right to withdraw consent, right to lodge complaint, and whether provision is obligatory." },
    { category: "RIGHTS", code: "Art.14.1", title: "Information When Not Collected Directly", description: "Where personal data have not been obtained from the data subject, the controller shall provide information including the source of the data and categories of personal data." },
    { category: "RIGHTS", code: "Art.14.3", title: "Timing of Information Provision", description: "Information shall be provided within a reasonable period after obtaining the data, but at the latest within one month, at first communication, or at disclosure to another recipient." },
    { category: "RIGHTS", code: "Art.15.1", title: "Right of Access", description: "The data subject shall have the right to obtain confirmation as to whether personal data concerning them is being processed, and where that is the case, access to the personal data and related information." },
    { category: "RIGHTS", code: "Art.15.3", title: "Copy of Data", description: "The controller shall provide a copy of the personal data undergoing processing. For additional copies requested, the controller may charge a reasonable fee based on administrative costs." },
    { category: "RIGHTS", code: "Art.16", title: "Right to Rectification", description: "The data subject shall have the right to obtain from the controller without undue delay the rectification of inaccurate personal data concerning them." },
    { category: "RIGHTS", code: "Art.17.1", title: "Right to Erasure (Right to be Forgotten)", description: "The data subject shall have the right to obtain from the controller the erasure of personal data concerning them without undue delay where specific grounds apply." },
    { category: "RIGHTS", code: "Art.17.2", title: "Informing Other Controllers", description: "Where the controller has made personal data public and is obliged to erase it, the controller shall take reasonable steps to inform other controllers processing the data." },
    { category: "RIGHTS", code: "Art.18.1", title: "Right to Restriction of Processing", description: "The data subject shall have the right to obtain from the controller restriction of processing where the accuracy is contested, processing is unlawful, controller no longer needs it, or pending verification of legitimate grounds." },
    { category: "RIGHTS", code: "Art.19", title: "Notification Obligation", description: "The controller shall communicate any rectification or erasure of personal data or restriction of processing to each recipient to whom the personal data have been disclosed." },
    { category: "RIGHTS", code: "Art.20.1", title: "Right to Data Portability", description: "The data subject shall have the right to receive personal data concerning them in a structured, commonly used and machine-readable format and have the right to transmit that data to another controller." },
    { category: "RIGHTS", code: "Art.21.1", title: "Right to Object - General", description: "The data subject shall have the right to object at any time to processing of personal data based on public interest or legitimate interests grounds." },
    { category: "RIGHTS", code: "Art.21.2", title: "Right to Object - Direct Marketing", description: "Where personal data are processed for direct marketing purposes, the data subject shall have the right to object at any time to processing for such marketing." },
    { category: "RIGHTS", code: "Art.21.4", title: "Information About Right to Object", description: "At the latest at the time of the first communication with the data subject, the right to object shall be explicitly brought to their attention and presented clearly and separately from any other information." },
    { category: "RIGHTS", code: "Art.22.1", title: "Automated Decision-Making", description: "The data subject shall have the right not to be subject to a decision based solely on automated processing, including profiling, which produces legal effects concerning them or similarly significantly affects them." },
    { category: "RIGHTS", code: "Art.22.3", title: "Safeguards for Automated Decisions", description: "In permitted automated decision-making cases, the controller shall implement suitable measures to safeguard the data subject's rights and freedoms and legitimate interests." },

    // Controller and Processor (Articles 24-43)
    { category: "CONTROLLER", code: "Art.24.1", title: "Controller Responsibility", description: "The controller shall implement appropriate technical and organizational measures to ensure and demonstrate that processing is performed in accordance with the regulation." },
    { category: "CONTROLLER", code: "Art.24.2", title: "Proportionate Measures", description: "Where proportionate in relation to processing activities, the measures shall include the implementation of appropriate data protection policies by the controller." },
    { category: "CONTROLLER", code: "Art.25.1", title: "Data Protection by Design", description: "The controller shall implement appropriate technical and organizational measures designed to implement data protection principles effectively and integrate safeguards into processing." },
    { category: "CONTROLLER", code: "Art.25.2", title: "Data Protection by Default", description: "The controller shall implement appropriate measures to ensure that, by default, only personal data which are necessary for each specific purpose are processed." },
    { category: "CONTROLLER", code: "Art.26.1", title: "Joint Controllers", description: "Where two or more controllers jointly determine the purposes and means of processing, they shall be joint controllers and shall determine their respective responsibilities in a transparent manner." },
    { category: "CONTROLLER", code: "Art.27.1", title: "Representatives of Non-EU Controllers", description: "Where the controller or processor is not established in the Union, they shall designate in writing a representative in the Union." },
    { category: "CONTROLLER", code: "Art.28.1", title: "Processor Selection", description: "Where processing is to be carried out on behalf of a controller, the controller shall use only processors providing sufficient guarantees to implement appropriate measures." },
    { category: "CONTROLLER", code: "Art.28.3", title: "Processing Contract", description: "Processing by a processor shall be governed by a contract or legal act setting out the subject-matter, duration, nature and purpose, type of data, categories of data subjects, and controller obligations and rights." },
    { category: "CONTROLLER", code: "Art.29", title: "Processing Under Authority", description: "The processor and any person acting under the authority of the controller or processor who has access to personal data shall not process those data except on instructions from the controller." },
    { category: "CONTROLLER", code: "Art.30.1", title: "Records of Processing - Controller", description: "Each controller shall maintain a record of processing activities under its responsibility, including purposes, categories of data subjects and data, recipients, transfers, retention periods, and security measures." },
    { category: "CONTROLLER", code: "Art.30.2", title: "Records of Processing - Processor", description: "Each processor shall maintain a record of all categories of processing activities carried out on behalf of a controller." },
    { category: "CONTROLLER", code: "Art.31", title: "Cooperation with Supervisory Authority", description: "The controller and the processor and, where applicable, their representatives, shall cooperate, on request, with the supervisory authority in the performance of its tasks." },
    { category: "CONTROLLER", code: "Art.32.1", title: "Security of Processing", description: "The controller and processor shall implement appropriate technical and organizational measures to ensure a level of security appropriate to the risk, including pseudonymization, encryption, confidentiality, integrity, availability, and resilience." },
    { category: "CONTROLLER", code: "Art.32.2", title: "Security Risk Assessment", description: "In assessing the appropriate level of security, account shall be taken of the risks presented by processing, in particular from accidental or unlawful destruction, loss, alteration, unauthorized disclosure of, or access to personal data." },
    { category: "CONTROLLER", code: "Art.32.4", title: "Processor Personnel Security", description: "The controller and processor shall take steps to ensure that any natural person acting under their authority who has access to personal data does not process them except on instructions from the controller." },
    { category: "CONTROLLER", code: "Art.33.1", title: "Breach Notification to Authority", description: "In the case of a personal data breach, the controller shall without undue delay and, where feasible, not later than 72 hours after becoming aware of it, notify the supervisory authority." },
    { category: "CONTROLLER", code: "Art.33.2", title: "Processor Breach Notification", description: "The processor shall notify the controller without undue delay after becoming aware of a personal data breach." },
    { category: "CONTROLLER", code: "Art.33.3", title: "Breach Notification Content", description: "The notification to the supervisory authority shall describe the nature of the breach, categories and number of data subjects affected, name of DPO, likely consequences, and measures taken or proposed." },
    { category: "CONTROLLER", code: "Art.33.5", title: "Breach Documentation", description: "The controller shall document any personal data breaches, comprising the facts relating to the breach, its effects and the remedial action taken." },
    { category: "CONTROLLER", code: "Art.34.1", title: "Breach Communication to Data Subject", description: "When the personal data breach is likely to result in a high risk to the rights and freedoms of natural persons, the controller shall communicate the personal data breach to the data subject without undue delay." },
    { category: "CONTROLLER", code: "Art.34.2", title: "Communication Content", description: "The communication to the data subject shall describe in clear and plain language the nature of the breach and contain the name of the DPO, likely consequences, and measures taken or proposed." },
    { category: "CONTROLLER", code: "Art.35.1", title: "Data Protection Impact Assessment", description: "Where processing is likely to result in a high risk to rights and freedoms of natural persons, the controller shall carry out an assessment of the impact of the envisaged processing operations on the protection of personal data." },
    { category: "CONTROLLER", code: "Art.35.3", title: "DPIA Required Cases", description: "A DPIA is required for systematic and extensive evaluation of personal aspects based on automated processing, large scale processing of special categories, or systematic monitoring of a publicly accessible area on a large scale." },
    { category: "CONTROLLER", code: "Art.35.7", title: "DPIA Content", description: "The assessment shall contain a systematic description of processing operations and purposes, assessment of necessity and proportionality, assessment of risks, and measures to address the risks." },
    { category: "CONTROLLER", code: "Art.36.1", title: "Prior Consultation", description: "The controller shall consult the supervisory authority prior to processing where a DPIA indicates that the processing would result in a high risk in the absence of measures taken by the controller to mitigate the risk." },
    { category: "CONTROLLER", code: "Art.37.1", title: "DPO Designation Required", description: "The controller and processor shall designate a DPO where processing is carried out by a public authority, core activities require regular and systematic monitoring at large scale, or core activities consist of large scale processing of special categories." },
    { category: "CONTROLLER", code: "Art.37.5", title: "DPO Qualifications", description: "The DPO shall be designated on the basis of professional qualities and expert knowledge of data protection law and practices and ability to fulfill the tasks referred to in Article 39." },
    { category: "CONTROLLER", code: "Art.38.1", title: "DPO Support", description: "The controller and processor shall ensure that the DPO is involved, properly and in a timely manner, in all issues which relate to the protection of personal data." },
    { category: "CONTROLLER", code: "Art.38.2", title: "DPO Resources", description: "The controller and processor shall support the DPO by providing resources necessary to carry out their tasks and maintain expert knowledge." },
    { category: "CONTROLLER", code: "Art.38.3", title: "DPO Independence", description: "The controller and processor shall ensure that the DPO does not receive any instructions regarding the exercise of those tasks and shall not be dismissed or penalized for performing their tasks." },
    { category: "CONTROLLER", code: "Art.39.1", title: "DPO Tasks", description: "The DPO shall inform and advise the controller/processor and employees, monitor compliance, provide advice on DPIAs, cooperate with the supervisory authority, and act as contact point." },
    { category: "CONTROLLER", code: "Art.40.1", title: "Codes of Conduct", description: "Member States, supervisory authorities, the Board and the Commission shall encourage the drawing up of codes of conduct intended to contribute to the proper application of this Regulation." },
    { category: "CONTROLLER", code: "Art.42.1", title: "Certification", description: "Member States, supervisory authorities, the Board and the Commission shall encourage the establishment of data protection certification mechanisms and seals and marks." },

    // International Transfers (Articles 44-50)
    { category: "TRANSFER", code: "Art.44", title: "General Transfer Principle", description: "Any transfer of personal data to a third country or international organization shall take place only if the conditions laid down in this Chapter are complied with." },
    { category: "TRANSFER", code: "Art.45.1", title: "Adequacy Decision", description: "A transfer may take place where the Commission has decided that the third country, territory, sector, or international organization ensures an adequate level of protection." },
    { category: "TRANSFER", code: "Art.46.1", title: "Appropriate Safeguards", description: "In the absence of an adequacy decision, transfers may occur only if the controller or processor has provided appropriate safeguards and enforceable data subject rights and legal remedies are available." },
    { category: "TRANSFER", code: "Art.46.2", title: "Safeguards Without Authorization", description: "Appropriate safeguards may be provided by a legally binding instrument between public authorities, binding corporate rules, standard contractual clauses, or approved codes of conduct or certification mechanisms." },
    { category: "TRANSFER", code: "Art.47.1", title: "Binding Corporate Rules", description: "The competent supervisory authority shall approve binding corporate rules that are legally binding and apply to and are enforced by every member of the group of undertakings." },
    { category: "TRANSFER", code: "Art.49.1", title: "Derogations for Specific Situations", description: "In the absence of an adequacy decision or appropriate safeguards, transfers may occur based on explicit consent, contractual necessity, important public interest, legal claims, vital interests, or from a public register." },

    // Remedies and Penalties (Articles 77-84)
    { category: "REMEDIES", code: "Art.77.1", title: "Right to Lodge Complaint", description: "Every data subject shall have the right to lodge a complaint with a supervisory authority if they consider that the processing of personal data infringes this Regulation." },
    { category: "REMEDIES", code: "Art.78.1", title: "Right to Judicial Remedy Against Authority", description: "Each natural or legal person shall have the right to an effective judicial remedy against a legally binding decision of a supervisory authority concerning them." },
    { category: "REMEDIES", code: "Art.79.1", title: "Right to Judicial Remedy Against Controller/Processor", description: "Each data subject shall have the right to an effective judicial remedy where they consider that their rights have been infringed as a result of non-compliant processing." },
    { category: "REMEDIES", code: "Art.80.1", title: "Representation of Data Subjects", description: "The data subject shall have the right to mandate a not-for-profit body to lodge the complaint on their behalf, exercise rights under Articles 77-79, and exercise the right to compensation on their behalf." },
    { category: "REMEDIES", code: "Art.82.1", title: "Right to Compensation", description: "Any person who has suffered material or non-material damage as a result of an infringement of this Regulation shall have the right to receive compensation from the controller or processor." },
    { category: "REMEDIES", code: "Art.82.2", title: "Processor Liability", description: "Any controller involved in processing shall be liable for damage caused by processing which infringes this Regulation. A processor shall be liable for damage caused only where it has not complied with processor-specific obligations or has acted contrary to lawful instructions." },
    { category: "REMEDIES", code: "Art.83.1", title: "Administrative Fines - General", description: "Each supervisory authority shall ensure that the imposition of administrative fines shall in each individual case be effective, proportionate and dissuasive." },
    { category: "REMEDIES", code: "Art.83.4", title: "Lower Tier Fines", description: "Infringements of controller/processor obligations, certification body obligations, or monitoring body obligations shall be subject to fines up to €10,000,000 or 2% of annual worldwide turnover." },
    { category: "REMEDIES", code: "Art.83.5", title: "Higher Tier Fines", description: "Infringements of basic principles, data subject rights, international transfers, Member State law obligations, or non-compliance with supervisory authority orders shall be subject to fines up to €20,000,000 or 4% of annual worldwide turnover." },
    { category: "REMEDIES", code: "Art.84.1", title: "Other Penalties", description: "Member States shall lay down the rules on other penalties applicable to infringements of this Regulation and shall take all measures necessary to ensure that they are implemented." },
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
  console.log(`GDPR seeded: ${controls.length} controls`);
}

seedGDPR()
  .then(() => {
    console.log("Done!");
    pool.end();
  })
  .catch((err) => {
    console.error("Error:", err);
    pool.end();
    process.exit(1);
  });
