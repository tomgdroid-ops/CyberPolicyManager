import { getServerSession, Session } from "next-auth";
import { authOptions } from "./auth";
import { OrgRole } from "@/types/organization";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireSession() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

// Require user to have an organization context
export async function requireOrganization() {
  const session = await requireSession();
  if (!session.user.currentOrganization) {
    throw new Error("No organization selected");
  }
  return {
    session,
    organizationId: session.user.currentOrganization.id,
    organizationRole: session.user.currentOrganization.role,
  };
}

// Require super admin access
export async function requireSuperAdmin() {
  const session = await requireSession();
  if (!session.user.isSuperAdmin) {
    throw new Error("Forbidden: Super admin access required");
  }
  return session;
}

// Require specific organization role or higher
export async function requireOrgRole(minRole: OrgRole) {
  const { session, organizationId, organizationRole } = await requireOrganization();

  const roleHierarchy: Record<OrgRole, number> = {
    org_admin: 3,
    org_user: 2,
    org_viewer: 1,
  };

  if (roleHierarchy[organizationRole] < roleHierarchy[minRole]) {
    throw new Error(`Forbidden: Requires ${minRole} or higher`);
  }

  return { session, organizationId, organizationRole };
}

// Require org_admin role
export async function requireOrgAdmin() {
  return requireOrgRole("org_admin");
}

// Require at least org_user role (can create/edit)
export async function requireOrgUser() {
  return requireOrgRole("org_user");
}

// Check if user can access a specific organization
export async function canAccessOrganization(organizationId: string): Promise<boolean> {
  const session = await getSession();
  if (!session?.user) return false;

  // Super admin can access any organization
  if (session.user.isSuperAdmin) return true;

  // Check if user is a member of the organization
  return session.user.organizations?.some((org) => org.id === organizationId) ?? false;
}

// Get user's role in a specific organization
export async function getOrgRole(organizationId: string): Promise<OrgRole | null> {
  const session = await getSession();
  if (!session?.user) return null;

  const org = session.user.organizations?.find((o) => o.id === organizationId);
  return org?.role ?? null;
}

// Helper type for session with organization context
export interface SessionWithOrg extends Session {
  user: Session["user"] & {
    currentOrganization: NonNullable<Session["user"]["currentOrganization"]>;
  };
}
