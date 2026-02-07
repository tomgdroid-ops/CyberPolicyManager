import { query } from "@/lib/db";

export async function createAnalysis(
  organizationId: string,
  frameworkId: string,
  triggeredBy: string
) {
  const result = await query(
    `INSERT INTO analysis_results (organization_id, framework_id, triggered_by, status)
     VALUES ($1, $2, $3, 'pending') RETURNING *`,
    [organizationId, frameworkId, triggeredBy]
  );
  return result.rows[0];
}

export async function getAnalysisById(id: string, organizationId?: string) {
  const result = organizationId
    ? await query(
        `SELECT ar.*, f.name as framework_name, f.code as framework_code, u.name as triggered_by_name
         FROM analysis_results ar
         JOIN frameworks f ON ar.framework_id = f.id
         LEFT JOIN users u ON ar.triggered_by = u.id
         WHERE ar.id = $1 AND ar.organization_id = $2`,
        [id, organizationId]
      )
    : await query(
        `SELECT ar.*, f.name as framework_name, f.code as framework_code, u.name as triggered_by_name
         FROM analysis_results ar
         JOIN frameworks f ON ar.framework_id = f.id
         LEFT JOIN users u ON ar.triggered_by = u.id
         WHERE ar.id = $1`,
        [id]
      );
  return result.rows[0] || null;
}

export async function listAnalyses(organizationId: string, limit: number = 20) {
  const result = await query(
    `SELECT ar.*, f.name as framework_name, f.code as framework_code, u.name as triggered_by_name
     FROM analysis_results ar
     JOIN frameworks f ON ar.framework_id = f.id
     LEFT JOIN users u ON ar.triggered_by = u.id
     WHERE ar.organization_id = $1
     ORDER BY ar.created_at DESC
     LIMIT $2`,
    [organizationId, limit]
  );
  return result.rows;
}

export async function getLatestCompletedAnalysis(organizationId: string, frameworkId?: string) {
  let sql = `SELECT ar.*, f.name as framework_name, f.code as framework_code
             FROM analysis_results ar
             JOIN frameworks f ON ar.framework_id = f.id
             WHERE ar.organization_id = $1 AND ar.status = 'completed'`;
  const params: unknown[] = [organizationId];

  if (frameworkId) {
    sql += ` AND ar.framework_id = $2`;
    params.push(frameworkId);
  }

  sql += ` ORDER BY ar.completed_at DESC LIMIT 1`;

  const result = await query(sql, params);
  return result.rows[0] || null;
}

export async function updateAnalysisStatus(
  id: string,
  organizationId: string,
  status: "pending" | "running" | "completed" | "failed",
  updates?: {
    totalControls?: number;
    controlsFullyCovered?: number;
    controlsPartiallyCovered?: number;
    controlsNotCovered?: number;
    overallScore?: number;
    categoryScores?: Record<string, number>;
    gaps?: unknown[];
    recommendations?: unknown[];
    policyMappingsSnapshot?: unknown;
    errorMessage?: string;
    startedAt?: Date;
    completedAt?: Date;
  }
) {
  const sets = ["status = $1"];
  const params: unknown[] = [status];
  let idx = 3;

  if (updates?.totalControls !== undefined) {
    sets.push(`total_controls = $${idx++}`);
    params.push(updates.totalControls);
  }
  if (updates?.controlsFullyCovered !== undefined) {
    sets.push(`controls_fully_covered = $${idx++}`);
    params.push(updates.controlsFullyCovered);
  }
  if (updates?.controlsPartiallyCovered !== undefined) {
    sets.push(`controls_partially_covered = $${idx++}`);
    params.push(updates.controlsPartiallyCovered);
  }
  if (updates?.controlsNotCovered !== undefined) {
    sets.push(`controls_not_covered = $${idx++}`);
    params.push(updates.controlsNotCovered);
  }
  if (updates?.overallScore !== undefined) {
    sets.push(`overall_score = $${idx++}`);
    params.push(updates.overallScore);
  }
  if (updates?.categoryScores !== undefined) {
    sets.push(`category_scores = $${idx++}`);
    params.push(JSON.stringify(updates.categoryScores));
  }
  if (updates?.gaps !== undefined) {
    sets.push(`gaps = $${idx++}`);
    params.push(JSON.stringify(updates.gaps));
  }
  if (updates?.recommendations !== undefined) {
    sets.push(`recommendations = $${idx++}`);
    params.push(JSON.stringify(updates.recommendations));
  }
  if (updates?.policyMappingsSnapshot !== undefined) {
    sets.push(`policy_mappings_snapshot = $${idx++}`);
    params.push(JSON.stringify(updates.policyMappingsSnapshot));
  }
  if (updates?.errorMessage !== undefined) {
    sets.push(`error_message = $${idx++}`);
    params.push(updates.errorMessage);
  }
  if (updates?.startedAt !== undefined) {
    sets.push(`started_at = $${idx++}`);
    params.push(updates.startedAt);
  }
  if (updates?.completedAt !== undefined) {
    sets.push(`completed_at = $${idx++}`);
    params.push(updates.completedAt);
  }

  params.push(id);
  params.push(organizationId);

  const result = await query(
    `UPDATE analysis_results SET ${sets.join(", ")}
     WHERE id = $2 AND organization_id = $${idx}
     RETURNING *`,
    params
  );
  return result.rows[0] || null;
}

// Get analysis statistics for dashboard
export async function getAnalysisStats(organizationId: string) {
  const result = await query(
    `SELECT
       COUNT(*) as total_analyses,
       COUNT(*) FILTER (WHERE status = 'completed') as completed,
       COUNT(*) FILTER (WHERE status = 'failed') as failed,
       AVG(overall_score) FILTER (WHERE status = 'completed') as avg_score,
       MAX(completed_at) as last_analysis_at
     FROM analysis_results
     WHERE organization_id = $1`,
    [organizationId]
  );
  return result.rows[0];
}
