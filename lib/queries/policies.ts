import { query } from "@/lib/db";
import { CreatePolicyInput, UpdatePolicyInput } from "@/types/policy";

export async function listPolicies(filters?: {
  status?: string;
  search?: string;
  owner_id?: string;
  limit?: number;
  offset?: number;
}) {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (filters?.status) {
    conditions.push(`p.status = $${idx++}`);
    params.push(filters.status);
  }
  if (filters?.search) {
    conditions.push(`(p.policy_name ILIKE $${idx} OR p.policy_code ILIKE $${idx})`);
    params.push(`%${filters.search}%`);
    idx++;
  }
  if (filters?.owner_id) {
    conditions.push(`p.owner_id = $${idx++}`);
    params.push(filters.owner_id);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = filters?.limit || 100;
  const offset = filters?.offset || 0;

  const result = await query(
    `SELECT p.*,
            o.name as owner_name,
            a.name as author_name,
            (SELECT COUNT(*) FROM policy_control_mappings m WHERE m.policy_id = p.id) as mapping_count
     FROM policies p
     LEFT JOIN users o ON p.owner_id = o.id
     LEFT JOIN users a ON p.author_id = a.id
     ${where}
     ORDER BY p.updated_at DESC
     LIMIT $${idx++} OFFSET $${idx}`,
    [...params, limit, offset]
  );

  const countResult = await query(
    `SELECT COUNT(*) FROM policies p ${where}`,
    params
  );

  return {
    policies: result.rows,
    total: parseInt(countResult.rows[0].count),
  };
}

export async function getPolicyById(id: string) {
  const result = await query(
    `SELECT p.*,
            o.name as owner_name,
            a.name as author_name
     FROM policies p
     LEFT JOIN users o ON p.owner_id = o.id
     LEFT JOIN users a ON p.author_id = a.id
     WHERE p.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function createPolicy(data: CreatePolicyInput, authorId: string) {
  const result = await query(
    `INSERT INTO policies (policy_code, policy_name, description, scope, owner_id, author_id,
       department, classification, effective_date, review_date, review_frequency_months)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      data.policy_code,
      data.policy_name,
      data.description || null,
      data.scope || null,
      data.owner_id || authorId,
      authorId,
      data.department || null,
      data.classification || "Internal",
      data.effective_date || null,
      data.review_date || null,
      data.review_frequency_months || 12,
    ]
  );
  return result.rows[0];
}

export async function updatePolicy(id: string, data: UpdatePolicyInput) {
  const sets: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  const fields: (keyof UpdatePolicyInput)[] = [
    "policy_code", "policy_name", "description", "scope", "owner_id",
    "department", "classification", "effective_date", "review_date", "review_frequency_months",
  ];

  for (const field of fields) {
    if (data[field] !== undefined) {
      sets.push(`${field} = $${idx++}`);
      params.push(data[field] ?? null);
    }
  }

  if (sets.length === 0) return null;

  sets.push("updated_at = now()");
  params.push(id);

  const result = await query(
    `UPDATE policies SET ${sets.join(", ")} WHERE id = $${idx} AND status = 'draft' RETURNING *`,
    params
  );
  return result.rows[0] || null;
}

export async function deletePolicy(id: string) {
  const result = await query(
    "DELETE FROM policies WHERE id = $1 AND status = 'draft' RETURNING id",
    [id]
  );
  return result.rows[0] || null;
}

export async function updatePolicyStatus(id: string, newStatus: string) {
  const result = await query(
    `UPDATE policies SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
    [newStatus, id]
  );
  return result.rows[0] || null;
}

export async function createPolicyVersion(
  policyId: string,
  action: string,
  changedBy: string,
  comment?: string
) {
  const policy = await getPolicyById(policyId);
  if (!policy) return null;

  const result = await query(
    `INSERT INTO policy_versions (policy_id, version_major, version_minor, policy_name,
       description, status, document_filename, document_path, changed_by, change_action,
       change_comment, snapshot)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      policyId,
      policy.version_major,
      policy.version_minor,
      policy.policy_name,
      policy.description,
      policy.status,
      policy.document_filename,
      policy.document_path,
      changedBy,
      action,
      comment || null,
      JSON.stringify(policy),
    ]
  );
  return result.rows[0];
}

export async function getPolicyVersions(policyId: string) {
  const result = await query(
    `SELECT pv.*, u.name as changed_by_name
     FROM policy_versions pv
     LEFT JOIN users u ON pv.changed_by = u.id
     WHERE pv.policy_id = $1
     ORDER BY pv.created_at DESC`,
    [policyId]
  );
  return result.rows;
}

export async function incrementPolicyVersion(id: string, major: boolean = false) {
  if (major) {
    await query(
      "UPDATE policies SET version_major = version_major + 1, version_minor = 0, updated_at = now() WHERE id = $1",
      [id]
    );
  } else {
    await query(
      "UPDATE policies SET version_minor = version_minor + 1, updated_at = now() WHERE id = $1",
      [id]
    );
  }
}
