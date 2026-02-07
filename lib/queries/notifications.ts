import { query } from "@/lib/db";

export async function createNotification(
  organizationId: string,
  userId: string,
  type: string,
  title: string,
  message?: string,
  link?: string
) {
  const result = await query(
    `INSERT INTO notifications (organization_id, user_id, type, title, message, link)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [organizationId, userId, type, title, message || null, link || null]
  );
  return result.rows[0];
}

export async function getUserNotifications(
  userId: string,
  organizationId: string,
  options?: {
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
  }
) {
  const conditions = ["n.user_id = $1", "n.organization_id = $2"];
  const params: unknown[] = [userId, organizationId];
  let idx = 3;

  if (options?.unreadOnly) {
    conditions.push("n.is_read = false");
  }

  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  const result = await query(
    `SELECT n.* FROM notifications n
     WHERE ${conditions.join(" AND ")}
     ORDER BY n.created_at DESC
     LIMIT $${idx++} OFFSET $${idx}`,
    [...params, limit, offset]
  );

  const countResult = await query(
    `SELECT COUNT(*) FROM notifications n
     WHERE n.user_id = $1 AND n.organization_id = $2 AND n.is_read = false`,
    [userId, organizationId]
  );

  return {
    notifications: result.rows,
    unread_count: parseInt(countResult.rows[0].count),
  };
}

export async function markNotificationRead(id: string, userId: string, organizationId: string) {
  await query(
    "UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 AND organization_id = $3",
    [id, userId, organizationId]
  );
}

export async function markAllNotificationsRead(userId: string, organizationId: string) {
  await query(
    "UPDATE notifications SET is_read = true WHERE user_id = $1 AND organization_id = $2 AND is_read = false",
    [userId, organizationId]
  );
}

// Notify all members of an organization
export async function notifyOrganizationMembers(
  organizationId: string,
  type: string,
  title: string,
  message?: string,
  link?: string,
  excludeUserId?: string
) {
  // Get all members of the organization
  let memberQuery = `SELECT user_id FROM organization_members WHERE organization_id = $1`;
  const params: unknown[] = [organizationId];

  if (excludeUserId) {
    memberQuery += ` AND user_id != $2`;
    params.push(excludeUserId);
  }

  const membersResult = await query(memberQuery, params);

  // Create notifications for each member
  for (const member of membersResult.rows) {
    await createNotification(organizationId, member.user_id, type, title, message, link);
  }
}

// Notify users with specific role in organization
export async function notifyOrganizationRole(
  organizationId: string,
  role: string,
  type: string,
  title: string,
  message?: string,
  link?: string
) {
  const membersResult = await query(
    `SELECT user_id FROM organization_members WHERE organization_id = $1 AND role = $2`,
    [organizationId, role]
  );

  for (const member of membersResult.rows) {
    await createNotification(organizationId, member.user_id, type, title, message, link);
  }
}
