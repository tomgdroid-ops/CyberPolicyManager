import { query } from "@/lib/db";

export async function createAnalysis(frameworkId: string, triggeredBy: string) {
  const result = await query(
    `INSERT INTO analysis_results (framework_id, triggered_by, status)
     VALUES ($1, $2, 'pending') RETURNING *`,
    [frameworkId, triggeredBy]
  );
  return result.rows[0];
}

export async function getAnalysisById(id: string) {
  const result = await query(
    `SELECT ar.*, f.name as framework_name, f.code as framework_code, u.name as triggered_by_name
     FROM analysis_results ar
     JOIN frameworks f ON ar.framework_id = f.id
     LEFT JOIN users u ON ar.triggered_by = u.id
     WHERE ar.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function listAnalyses(limit: number = 20) {
  const result = await query(
    `SELECT ar.*, f.name as framework_name, f.code as framework_code, u.name as triggered_by_name
     FROM analysis_results ar
     JOIN frameworks f ON ar.framework_id = f.id
     LEFT JOIN users u ON ar.triggered_by = u.id
     ORDER BY ar.created_at DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}

export async function getLatestCompletedAnalysis(frameworkId?: string) {
  let sql = `SELECT ar.*, f.name as framework_name, f.code as framework_code
             FROM analysis_results ar
             JOIN frameworks f ON ar.framework_id = f.id
             WHERE ar.status = 'completed'`;
  const params: unknown[] = [];

  if (frameworkId) {
    sql += ` AND ar.framework_id = $1`;
    params.push(frameworkId);
  }

  sql += ` ORDER BY ar.completed_at DESC LIMIT 1`;

  const result = await query(sql, params);
  return result.rows[0] || null;
}
