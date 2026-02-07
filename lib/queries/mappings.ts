import { query } from "@/lib/db";

export async function getPolicyMappings(policyId: string) {
  const result = await query(
    `SELECT pcm.*, fc.control_code, fc.control_title, fc.control_description,
            fcat.category_code, fcat.category_name, f.name as framework_name, f.code as framework_code
     FROM policy_control_mappings pcm
     JOIN framework_controls fc ON pcm.control_id = fc.id
     JOIN framework_categories fcat ON fc.category_id = fcat.id
     JOIN frameworks f ON fc.framework_id = f.id
     WHERE pcm.policy_id = $1
     ORDER BY fc.control_code`,
    [policyId]
  );
  return result.rows;
}

export async function getControlMappings(controlId: string) {
  const result = await query(
    `SELECT pcm.*, p.policy_name, p.policy_code, p.status as policy_status
     FROM policy_control_mappings pcm
     JOIN policies p ON pcm.policy_id = p.id
     WHERE pcm.control_id = $1
     ORDER BY p.policy_name`,
    [controlId]
  );
  return result.rows;
}

export async function createMapping(
  policyId: string,
  controlId: string,
  coverage: string = "full",
  notes?: string,
  isAiSuggested: boolean = false,
  aiConfidence?: number
) {
  const result = await query(
    `INSERT INTO policy_control_mappings (policy_id, control_id, coverage, notes, is_ai_suggested, ai_confidence)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (policy_id, control_id) DO UPDATE SET
       coverage = EXCLUDED.coverage,
       notes = EXCLUDED.notes,
       is_ai_suggested = EXCLUDED.is_ai_suggested,
       ai_confidence = EXCLUDED.ai_confidence
     RETURNING *`,
    [policyId, controlId, coverage, notes || null, isAiSuggested, aiConfidence || null]
  );
  return result.rows[0];
}

export async function updateMapping(id: string, coverage: string, notes?: string) {
  const result = await query(
    `UPDATE policy_control_mappings SET coverage = $1, notes = $2 WHERE id = $3 RETURNING *`,
    [coverage, notes || null, id]
  );
  return result.rows[0] || null;
}

export async function deleteMapping(id: string) {
  const result = await query(
    "DELETE FROM policy_control_mappings WHERE id = $1 RETURNING id",
    [id]
  );
  return result.rows[0] || null;
}

export async function verifyMapping(id: string, userId: string) {
  const result = await query(
    `UPDATE policy_control_mappings SET verified_by = $1, verified_at = now() WHERE id = $2 RETURNING *`,
    [userId, id]
  );
  return result.rows[0] || null;
}

export async function deleteAiMappingsForPolicy(policyId: string) {
  await query(
    "DELETE FROM policy_control_mappings WHERE policy_id = $1 AND is_ai_suggested = true AND verified_by IS NULL",
    [policyId]
  );
}
