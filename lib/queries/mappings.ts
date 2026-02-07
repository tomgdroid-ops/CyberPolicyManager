import { query } from "@/lib/db";

export async function getPolicyMappings(policyId: string, organizationId?: string) {
  // If organizationId provided, verify policy belongs to org
  const policyCheck = organizationId
    ? await query(
        "SELECT 1 FROM policies WHERE id = $1 AND organization_id = $2",
        [policyId, organizationId]
      )
    : { rows: [{}] };

  if (policyCheck.rows.length === 0) return [];

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

export async function getControlMappings(controlId: string, organizationId?: string) {
  const result = organizationId
    ? await query(
        `SELECT pcm.*, p.policy_name, p.policy_code, p.status as policy_status
         FROM policy_control_mappings pcm
         JOIN policies p ON pcm.policy_id = p.id
         WHERE pcm.control_id = $1 AND pcm.organization_id = $2
         ORDER BY p.policy_name`,
        [controlId, organizationId]
      )
    : await query(
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
  organizationId: string,
  policyId: string,
  controlId: string,
  coverage: string = "full",
  notes?: string,
  isAiSuggested: boolean = false,
  aiConfidence?: number
) {
  const result = await query(
    `INSERT INTO policy_control_mappings (organization_id, policy_id, control_id, coverage, notes, is_ai_suggested, ai_confidence)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (policy_id, control_id) DO UPDATE SET
       coverage = EXCLUDED.coverage,
       notes = EXCLUDED.notes,
       is_ai_suggested = EXCLUDED.is_ai_suggested,
       ai_confidence = EXCLUDED.ai_confidence
     RETURNING *`,
    [organizationId, policyId, controlId, coverage, notes || null, isAiSuggested, aiConfidence || null]
  );
  return result.rows[0];
}

export async function updateMapping(id: string, organizationId: string, coverage: string, notes?: string) {
  const result = await query(
    `UPDATE policy_control_mappings SET coverage = $1, notes = $2
     WHERE id = $3 AND organization_id = $4 RETURNING *`,
    [coverage, notes || null, id, organizationId]
  );
  return result.rows[0] || null;
}

export async function deleteMapping(id: string, organizationId: string) {
  const result = await query(
    "DELETE FROM policy_control_mappings WHERE id = $1 AND organization_id = $2 RETURNING id",
    [id, organizationId]
  );
  return result.rows[0] || null;
}

export async function verifyMapping(id: string, organizationId: string, userId: string) {
  const result = await query(
    `UPDATE policy_control_mappings SET verified_by = $1, verified_at = now()
     WHERE id = $2 AND organization_id = $3 RETURNING *`,
    [userId, id, organizationId]
  );
  return result.rows[0] || null;
}

export async function deleteAiMappingsForPolicy(policyId: string, organizationId: string) {
  await query(
    `DELETE FROM policy_control_mappings
     WHERE policy_id = $1 AND organization_id = $2 AND is_ai_suggested = true AND verified_by IS NULL`,
    [policyId, organizationId]
  );
}

// Get mapping statistics for an organization
export async function getMappingStats(organizationId: string, frameworkId?: string) {
  const params: unknown[] = [organizationId];
  let frameworkCondition = "";

  if (frameworkId) {
    frameworkCondition = "AND fc.framework_id = $2";
    params.push(frameworkId);
  }

  const result = await query(
    `SELECT
       COUNT(DISTINCT pcm.id) as total_mappings,
       COUNT(DISTINCT pcm.id) FILTER (WHERE pcm.coverage = 'full') as full_coverage,
       COUNT(DISTINCT pcm.id) FILTER (WHERE pcm.coverage = 'partial') as partial_coverage,
       COUNT(DISTINCT pcm.control_id) as controls_mapped,
       COUNT(DISTINCT pcm.policy_id) as policies_with_mappings
     FROM policy_control_mappings pcm
     JOIN framework_controls fc ON pcm.control_id = fc.id
     WHERE pcm.organization_id = $1 ${frameworkCondition}`,
    params
  );
  return result.rows[0];
}
