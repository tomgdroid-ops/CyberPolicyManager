import { query } from "@/lib/db";

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message?: string,
  link?: string
) {
  const result = await query(
    `INSERT INTO notifications (user_id, type, title, message, link)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [userId, type, title, message || null, link || null]
  );
  return result.rows[0];
}

export async function getUserNotifications(userId: string, options?: {
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}) {
  const conditions = ["n.user_id = $1"];
  const params: unknown[] = [userId];
  let idx = 2;

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
    `SELECT COUNT(*) FROM notifications n WHERE n.user_id = $1 AND n.is_read = false`,
    [userId]
  );

  return {
    notifications: result.rows,
    unread_count: parseInt(countResult.rows[0].count),
  };
}

export async function markNotificationRead(id: string, userId: string) {
  await query(
    "UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2",
    [id, userId]
  );
}

export async function markAllNotificationsRead(userId: string) {
  await query(
    "UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false",
    [userId]
  );
}
