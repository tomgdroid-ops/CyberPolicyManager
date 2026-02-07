import { query } from "../db";
import { OrganizationMember, OrganizationInvitation, OrgRole } from "@/types/organization";
import crypto from "crypto";

// Get all members of an organization
export async function getOrganizationMembers(organizationId: string): Promise<OrganizationMember[]> {
  const result = await query(
    `SELECT om.id, om.organization_id, om.user_id, om.role, om.is_primary, om.joined_at,
            u.name as user_name, u.email as user_email
     FROM organization_members om
     JOIN users u ON om.user_id = u.id
     WHERE om.organization_id = $1
     ORDER BY om.is_primary DESC, u.name ASC`,
    [organizationId]
  );

  return result.rows.map(mapMember);
}

// Get member by ID
export async function getMemberById(memberId: string): Promise<OrganizationMember | null> {
  const result = await query(
    `SELECT om.id, om.organization_id, om.user_id, om.role, om.is_primary, om.joined_at,
            u.name as user_name, u.email as user_email
     FROM organization_members om
     JOIN users u ON om.user_id = u.id
     WHERE om.id = $1`,
    [memberId]
  );

  if (result.rows.length === 0) return null;
  return mapMember(result.rows[0]);
}

// Get user's membership in an organization
export async function getUserMembership(
  organizationId: string,
  userId: string
): Promise<OrganizationMember | null> {
  const result = await query(
    `SELECT om.id, om.organization_id, om.user_id, om.role, om.is_primary, om.joined_at,
            u.name as user_name, u.email as user_email
     FROM organization_members om
     JOIN users u ON om.user_id = u.id
     WHERE om.organization_id = $1 AND om.user_id = $2`,
    [organizationId, userId]
  );

  if (result.rows.length === 0) return null;
  return mapMember(result.rows[0]);
}

// Add member to organization
export async function addMember(
  organizationId: string,
  userId: string,
  role: OrgRole,
  isPrimary: boolean = false
): Promise<OrganizationMember> {
  const result = await query(
    `INSERT INTO organization_members (organization_id, user_id, role, is_primary)
     VALUES ($1, $2, $3, $4)
     RETURNING id, organization_id, user_id, role, is_primary, joined_at`,
    [organizationId, userId, role, isPrimary]
  );

  // Fetch with user info
  return (await getMemberById(result.rows[0].id))!;
}

// Update member role
export async function updateMemberRole(memberId: string, role: OrgRole): Promise<OrganizationMember | null> {
  const result = await query(
    `UPDATE organization_members SET role = $1 WHERE id = $2
     RETURNING id`,
    [role, memberId]
  );

  if (result.rows.length === 0) return null;
  return getMemberById(memberId);
}

// Remove member from organization
export async function removeMember(memberId: string): Promise<boolean> {
  const result = await query(`DELETE FROM organization_members WHERE id = $1`, [memberId]);
  return result.rowCount !== null && result.rowCount > 0;
}

// Set primary organization for user
export async function setPrimaryOrganization(userId: string, organizationId: string): Promise<void> {
  // Clear all primary flags for this user
  await query(`UPDATE organization_members SET is_primary = false WHERE user_id = $1`, [userId]);

  // Set the new primary
  await query(
    `UPDATE organization_members SET is_primary = true WHERE user_id = $1 AND organization_id = $2`,
    [userId, organizationId]
  );
}

// =====================
// Invitation Functions
// =====================

// Get pending invitations for an organization
export async function getOrganizationInvitations(organizationId: string): Promise<OrganizationInvitation[]> {
  const result = await query(
    `SELECT oi.id, oi.organization_id, oi.email, oi.role, oi.token, oi.invited_by,
            oi.expires_at, oi.accepted_at, oi.created_at,
            o.name as organization_name, u.name as invited_by_name
     FROM organization_invitations oi
     JOIN organizations o ON oi.organization_id = o.id
     LEFT JOIN users u ON oi.invited_by = u.id
     WHERE oi.organization_id = $1 AND oi.accepted_at IS NULL AND oi.expires_at > now()
     ORDER BY oi.created_at DESC`,
    [organizationId]
  );

  return result.rows.map(mapInvitation);
}

// Get invitation by token
export async function getInvitationByToken(token: string): Promise<OrganizationInvitation | null> {
  const result = await query(
    `SELECT oi.id, oi.organization_id, oi.email, oi.role, oi.token, oi.invited_by,
            oi.expires_at, oi.accepted_at, oi.created_at,
            o.name as organization_name, u.name as invited_by_name
     FROM organization_invitations oi
     JOIN organizations o ON oi.organization_id = o.id
     LEFT JOIN users u ON oi.invited_by = u.id
     WHERE oi.token = $1`,
    [token]
  );

  if (result.rows.length === 0) return null;
  return mapInvitation(result.rows[0]);
}

// Create invitation
export async function createInvitation(
  organizationId: string,
  email: string,
  role: OrgRole,
  invitedBy: string
): Promise<OrganizationInvitation> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const result = await query(
    `INSERT INTO organization_invitations (organization_id, email, role, token, invited_by, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, organization_id, email, role, token, invited_by, expires_at, accepted_at, created_at`,
    [organizationId, email.toLowerCase(), role, token, invitedBy, expiresAt]
  );

  return (await getInvitationByToken(result.rows[0].token))!;
}

// Accept invitation
export async function acceptInvitation(token: string, userId: string): Promise<boolean> {
  const invitation = await getInvitationByToken(token);

  if (!invitation) return false;
  if (invitation.acceptedAt) return false;
  if (new Date(invitation.expiresAt) < new Date()) return false;

  // Add user as member
  await addMember(invitation.organizationId, userId, invitation.role, false);

  // Mark invitation as accepted
  await query(
    `UPDATE organization_invitations SET accepted_at = now() WHERE token = $1`,
    [token]
  );

  return true;
}

// Cancel/delete invitation
export async function cancelInvitation(invitationId: string): Promise<boolean> {
  const result = await query(`DELETE FROM organization_invitations WHERE id = $1`, [invitationId]);
  return result.rowCount !== null && result.rowCount > 0;
}

// Check if user already invited or member
export async function isUserInvitedOrMember(organizationId: string, email: string): Promise<boolean> {
  // Check if already a member
  const memberResult = await query(
    `SELECT 1 FROM organization_members om
     JOIN users u ON om.user_id = u.id
     WHERE om.organization_id = $1 AND LOWER(u.email) = LOWER($2)`,
    [organizationId, email]
  );
  if (memberResult.rows.length > 0) return true;

  // Check if pending invitation exists
  const inviteResult = await query(
    `SELECT 1 FROM organization_invitations
     WHERE organization_id = $1 AND LOWER(email) = LOWER($2) AND accepted_at IS NULL AND expires_at > now()`,
    [organizationId, email]
  );
  return inviteResult.rows.length > 0;
}

// Get pending invitations for a user by email
export async function getPendingInvitationsForEmail(email: string): Promise<OrganizationInvitation[]> {
  const result = await query(
    `SELECT oi.id, oi.organization_id, oi.email, oi.role, oi.token, oi.invited_by,
            oi.expires_at, oi.accepted_at, oi.created_at,
            o.name as organization_name, u.name as invited_by_name
     FROM organization_invitations oi
     JOIN organizations o ON oi.organization_id = o.id
     LEFT JOIN users u ON oi.invited_by = u.id
     WHERE LOWER(oi.email) = LOWER($1) AND oi.accepted_at IS NULL AND oi.expires_at > now()
     ORDER BY oi.created_at DESC`,
    [email]
  );

  return result.rows.map(mapInvitation);
}

// Helper to map database row to OrganizationMember type
function mapMember(row: Record<string, unknown>): OrganizationMember {
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    userId: row.user_id as string,
    role: row.role as OrgRole,
    isPrimary: row.is_primary as boolean,
    joinedAt: new Date(row.joined_at as string),
    userName: row.user_name as string | undefined,
    userEmail: row.user_email as string | undefined,
  };
}

// Helper to map database row to OrganizationInvitation type
function mapInvitation(row: Record<string, unknown>): OrganizationInvitation {
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    email: row.email as string,
    role: row.role as OrgRole,
    token: row.token as string,
    invitedBy: row.invited_by as string | undefined,
    expiresAt: new Date(row.expires_at as string),
    acceptedAt: row.accepted_at ? new Date(row.accepted_at as string) : undefined,
    createdAt: new Date(row.created_at as string),
    organizationName: row.organization_name as string | undefined,
    invitedByName: row.invited_by_name as string | undefined,
  };
}
