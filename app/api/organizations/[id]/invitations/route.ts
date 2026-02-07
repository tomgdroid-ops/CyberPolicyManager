import { NextResponse } from "next/server";
import { requireSession, getOrgRole } from "@/lib/session";
import {
  getOrganizationInvitations,
  createInvitation,
  isUserInvitedOrMember,
} from "@/lib/queries/organization-members";
import { logAudit } from "@/lib/queries/audit";
import { z } from "zod";

const createInviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["org_admin", "org_user", "org_viewer"]),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/organizations/[id]/invitations - List pending invitations
export async function GET(request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { id: organizationId } = await context.params;

    // Check if user is org_admin or super_admin
    const role = await getOrgRole(organizationId);
    if (!session.user.isSuperAdmin && role !== "org_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const invitations = await getOrganizationInvitations(organizationId);

    return NextResponse.json({ invitations });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error listing invitations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/organizations/[id]/invitations - Create invitation
export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { id: organizationId } = await context.params;

    // Check if user is org_admin or super_admin
    const role = await getOrgRole(organizationId);
    if (!session.user.isSuperAdmin && role !== "org_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createInviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.issues },
        { status: 400 }
      );
    }

    // Check if user is already invited or a member
    const exists = await isUserInvitedOrMember(organizationId, parsed.data.email);
    if (exists) {
      return NextResponse.json(
        { error: "User is already a member or has a pending invitation" },
        { status: 400 }
      );
    }

    const invitation = await createInvitation(
      organizationId,
      parsed.data.email,
      parsed.data.role,
      session.user.id
    );

    await logAudit(
      organizationId,
      session.user.id,
      "invitation.created",
      "organization_invitation",
      invitation.id,
      { email: parsed.data.email, role: parsed.data.role }
    );

    // TODO: Send invitation email (for now, just return the token)
    // In production, you would send an email with a link like:
    // `${process.env.NEXTAUTH_URL}/invite/${invitation.token}`

    return NextResponse.json({
      invitation,
      inviteUrl: `/invite/${invitation.token}`,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error creating invitation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
