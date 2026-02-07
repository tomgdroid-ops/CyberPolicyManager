import { query } from "@/lib/db";

export async function listFrameworks() {
  const result = await query(
    "SELECT * FROM frameworks WHERE is_active = true ORDER BY name"
  );
  return result.rows;
}

export async function getFrameworkById(id: string) {
  const result = await query("SELECT * FROM frameworks WHERE id = $1", [id]);
  return result.rows[0] || null;
}

export async function getFrameworkCategories(frameworkId: string) {
  const result = await query(
    `SELECT * FROM framework_categories
     WHERE framework_id = $1
     ORDER BY sort_order, category_code`,
    [frameworkId]
  );
  return result.rows;
}

export async function getFrameworkControls(frameworkId: string, categoryId?: string) {
  let sql = `
    SELECT fc.*, fcat.category_code, fcat.category_name
    FROM framework_controls fc
    JOIN framework_categories fcat ON fc.category_id = fcat.id
    WHERE fc.framework_id = $1
  `;
  const params: unknown[] = [frameworkId];

  if (categoryId) {
    sql += ` AND fc.category_id = $2`;
    params.push(categoryId);
  }

  sql += ` ORDER BY fc.sort_order, fc.control_code`;

  const result = await query(sql, params);
  return result.rows;
}

export async function getControlById(controlId: string) {
  const result = await query(
    `SELECT fc.*, fcat.category_code, fcat.category_name, f.name as framework_name, f.code as framework_code
     FROM framework_controls fc
     JOIN framework_categories fcat ON fc.category_id = fcat.id
     JOIN frameworks f ON fc.framework_id = f.id
     WHERE fc.id = $1`,
    [controlId]
  );
  return result.rows[0] || null;
}

export async function getControlBestPractices(controlId: string) {
  const result = await query(
    "SELECT * FROM control_best_practices WHERE control_id = $1 ORDER BY sort_order",
    [controlId]
  );
  return result.rows;
}

export async function searchControls(frameworkId: string, searchTerm: string) {
  const result = await query(
    `SELECT fc.*, fcat.category_code, fcat.category_name
     FROM framework_controls fc
     JOIN framework_categories fcat ON fc.category_id = fcat.id
     WHERE fc.framework_id = $1
       AND (fc.control_code ILIKE $2 OR fc.control_title ILIKE $2 OR fc.control_description ILIKE $2)
     ORDER BY fc.sort_order, fc.control_code
     LIMIT 50`,
    [frameworkId, `%${searchTerm}%`]
  );
  return result.rows;
}
