import { query } from "@/lib/db";

export async function logAudit(
  organizationId: string | null,
  userId: string | null,
  action: string,
  entityType: string,
  entityId: string | null,
  details?: Record<string, unknown>,
  ipAddress?: string
) {
  await query(
    `INSERT INTO audit_log (organization_id, user_id, action, entity_type, entity_id, details, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [organizationId, userId, action, entityType, entityId, details ? JSON.stringify(details) : null, ipAddress || null]
  );
}

export async function getAuditLog(
  organizationId: string,
  options: {
    entityType?: string;
    entityId?: string;
    userId?: string;
    limit?: number;
    offset?: number;
  }
) {
  const conditions: string[] = ["a.organization_id = $1"];
  const params: unknown[] = [organizationId];
  let idx = 2;

  if (options.entityType) {
    conditions.push(`a.entity_type = $${idx++}`);
    params.push(options.entityType);
  }
  if (options.entityId) {
    conditions.push(`a.entity_id = $${idx++}`);
    params.push(options.entityId);
  }
  if (options.userId) {
    conditions.push(`a.user_id = $${idx++}`);
    params.push(options.userId);
  }

  const where = `WHERE ${conditions.join(" AND ")}`;
  const limit = options.limit || 50;
  const offset = options.offset || 0;

  const result = await query(
    `SELECT a.*, u.name as user_name, u.email as user_email
     FROM audit_log a
     LEFT JOIN users u ON a.user_id = u.id
     ${where}
     ORDER BY a.created_at DESC
     LIMIT $${idx++} OFFSET $${idx}`,
    [...params, limit, offset]
  );
  return result.rows;
}

export async function getRecentActivity(organizationId: string, limit: number = 20) {
  const result = await query(
    `SELECT a.*, u.name as user_name
     FROM audit_log a
     LEFT JOIN users u ON a.user_id = u.id
     WHERE a.organization_id = $1
     ORDER BY a.created_at DESC
     LIMIT $2`,
    [organizationId, limit]
  );
  return result.rows;
}

// Get activity across all organizations (for super_admin)
export async function getGlobalRecentActivity(limit: number = 50) {
  const result = await query(
    `SELECT a.*, u.name as user_name, o.name as organization_name
     FROM audit_log a
     LEFT JOIN users u ON a.user_id = u.id
     LEFT JOIN organizations o ON a.organization_id = o.id
     ORDER BY a.created_at DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}
