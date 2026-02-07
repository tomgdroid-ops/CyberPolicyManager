export type OrgRole = "org_admin" | "org_user" | "org_viewer";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  industry?: string;
  description?: string;
  logoUrl?: string;
  settings: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: OrgRole;
  isPrimary: boolean;
  joinedAt: Date;
  // Joined fields
  userName?: string;
  userEmail?: string;
}

export interface OrganizationInvitation {
  id: string;
  organizationId: string;
  email: string;
  role: OrgRole;
  token: string;
  invitedBy?: string;
  expiresAt: Date;
  acceptedAt?: Date;
  createdAt: Date;
  // Joined fields
  organizationName?: string;
  invitedByName?: string;
}

export interface OrganizationWithRole extends Organization {
  role: OrgRole;
  isPrimary: boolean;
}

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  industry?: string;
  description?: string;
}

export interface UpdateOrganizationInput {
  name?: string;
  industry?: string;
  description?: string;
  logoUrl?: string;
  settings?: Record<string, unknown>;
  isActive?: boolean;
}

export interface InviteMemberInput {
  email: string;
  role: OrgRole;
}
