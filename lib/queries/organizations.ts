import { query } from "../db";
import {
  Organization,
  OrganizationWithRole,
  CreateOrganizationInput,
  UpdateOrganizationInput,
} from "@/types/organization";

// Get all organizations (super_admin only)
export async function getAllOrganizations(): Promise<Organization[]> {
  const result = await query(
    `SELECT id, name, slug, industry, description, logo_url, settings, is_active, created_at, updated_at
     FROM organizations
     ORDER BY name ASC`
  );

  return result.rows.map(mapOrganization);
}

// Get organization by ID
export async function getOrganizationById(id: string): Promise<Organization | null> {
  const result = await query(
    `SELECT id, name, slug, industry, description, logo_url, settings, is_active, created_at, updated_at
     FROM organizations
     WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) return null;
  return mapOrganization(result.rows[0]);
}

// Get organization by slug
export async function getOrganizationBySlug(slug: string): Promise<Organization | null> {
  const result = await query(
    `SELECT id, name, slug, industry, description, logo_url, settings, is_active, created_at, updated_at
     FROM organizations
     WHERE slug = $1`,
    [slug]
  );

  if (result.rows.length === 0) return null;
  return mapOrganization(result.rows[0]);
}

// Get organizations for a user
export async function getOrganizationsForUser(userId: string): Promise<OrganizationWithRole[]> {
  const result = await query(
    `SELECT o.id, o.name, o.slug, o.industry, o.description, o.logo_url, o.settings, o.is_active, o.created_at, o.updated_at,
            om.role, om.is_primary
     FROM organizations o
     JOIN organization_members om ON o.id = om.organization_id
     WHERE om.user_id = $1 AND o.is_active = true
     ORDER BY om.is_primary DESC, o.name ASC`,
    [userId]
  );

  return result.rows.map((row) => ({
    ...mapOrganization(row),
    role: row.role,
    isPrimary: row.is_primary,
  }));
}

// Create organization
export async function createOrganization(
  input: CreateOrganizationInput,
  createdByUserId?: string
): Promise<Organization> {
  const result = await query(
    `INSERT INTO organizations (name, slug, industry, description)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, slug, industry, description, logo_url, settings, is_active, created_at, updated_at`,
    [input.name, input.slug, input.industry || null, input.description || null]
  );

  const org = mapOrganization(result.rows[0]);

  // If createdByUserId provided, add them as org_admin
  if (createdByUserId) {
    await query(
      `INSERT INTO organization_members (organization_id, user_id, role, is_primary)
       VALUES ($1, $2, 'org_admin', true)`,
      [org.id, createdByUserId]
    );
  }

  return org;
}

// Update organization
export async function updateOrganization(
  id: string,
  input: UpdateOrganizationInput
): Promise<Organization | null> {
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (input.name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    values.push(input.name);
  }
  if (input.industry !== undefined) {
    updates.push(`industry = $${paramIndex++}`);
    values.push(input.industry);
  }
  if (input.description !== undefined) {
    updates.push(`description = $${paramIndex++}`);
    values.push(input.description);
  }
  if (input.logoUrl !== undefined) {
    updates.push(`logo_url = $${paramIndex++}`);
    values.push(input.logoUrl);
  }
  if (input.settings !== undefined) {
    updates.push(`settings = $${paramIndex++}`);
    values.push(JSON.stringify(input.settings));
  }
  if (input.isActive !== undefined) {
    updates.push(`is_active = $${paramIndex++}`);
    values.push(input.isActive);
  }

  if (updates.length === 0) {
    return getOrganizationById(id);
  }

  updates.push(`updated_at = now()`);
  values.push(id);

  const result = await query(
    `UPDATE organizations
     SET ${updates.join(", ")}
     WHERE id = $${paramIndex}
     RETURNING id, name, slug, industry, description, logo_url, settings, is_active, created_at, updated_at`,
    values
  );

  if (result.rows.length === 0) return null;
  return mapOrganization(result.rows[0]);
}

// Delete organization (soft delete by setting is_active = false)
export async function deactivateOrganization(id: string): Promise<boolean> {
  const result = await query(
    `UPDATE organizations SET is_active = false, updated_at = now() WHERE id = $1`,
    [id]
  );
  return result.rowCount !== null && result.rowCount > 0;
}

// Check if slug is available
export async function isSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
  const result = excludeId
    ? await query(`SELECT 1 FROM organizations WHERE slug = $1 AND id != $2`, [slug, excludeId])
    : await query(`SELECT 1 FROM organizations WHERE slug = $1`, [slug]);
  return result.rows.length === 0;
}

// Get organization stats
export async function getOrganizationStats(organizationId: string) {
  const [policiesResult, membersResult, analysisResult] = await Promise.all([
    query(`SELECT COUNT(*) as count FROM policies WHERE organization_id = $1`, [organizationId]),
    query(`SELECT COUNT(*) as count FROM organization_members WHERE organization_id = $1`, [organizationId]),
    query(`SELECT COUNT(*) as count FROM analysis_results WHERE organization_id = $1`, [organizationId]),
  ]);

  return {
    totalPolicies: parseInt(policiesResult.rows[0]?.count || "0", 10),
    totalMembers: parseInt(membersResult.rows[0]?.count || "0", 10),
    totalAnalyses: parseInt(analysisResult.rows[0]?.count || "0", 10),
  };
}

// Helper to map database row to Organization type
function mapOrganization(row: Record<string, unknown>): Organization {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    industry: row.industry as string | undefined,
    description: row.description as string | undefined,
    logoUrl: row.logo_url as string | undefined,
    settings: (row.settings as Record<string, unknown>) || {},
    isActive: row.is_active as boolean,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}
