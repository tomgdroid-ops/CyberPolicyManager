import { query } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function getUserByEmail(email: string) {
  const result = await query("SELECT id, email, name, role, is_active, created_at, updated_at FROM users WHERE email = $1", [email]);
  return result.rows[0] || null;
}

export async function getUserById(id: string) {
  const result = await query("SELECT id, email, name, role, is_active, created_at, updated_at FROM users WHERE id = $1", [id]);
  return result.rows[0] || null;
}

export async function listUsers() {
  const result = await query("SELECT id, email, name, role, is_active, created_at, updated_at FROM users ORDER BY name");
  return result.rows;
}

export async function createUser(email: string, password: string, name: string, role: string = "user") {
  const hash = await bcrypt.hash(password, 12);
  const result = await query(
    "INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role, is_active, created_at, updated_at",
    [email, hash, name, role]
  );
  return result.rows[0];
}

export async function updateUser(id: string, data: { name?: string; role?: string; is_active?: boolean }) {
  const sets: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (data.name !== undefined) {
    sets.push(`name = $${idx++}`);
    params.push(data.name);
  }
  if (data.role !== undefined) {
    sets.push(`role = $${idx++}`);
    params.push(data.role);
  }
  if (data.is_active !== undefined) {
    sets.push(`is_active = $${idx++}`);
    params.push(data.is_active);
  }

  if (sets.length === 0) return null;

  sets.push(`updated_at = now()`);
  params.push(id);

  const result = await query(
    `UPDATE users SET ${sets.join(", ")} WHERE id = $${idx} RETURNING id, email, name, role, is_active, created_at, updated_at`,
    params
  );
  return result.rows[0] || null;
}

export async function changePassword(id: string, newPassword: string) {
  const hash = await bcrypt.hash(newPassword, 12);
  await query("UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2", [hash, id]);
}
