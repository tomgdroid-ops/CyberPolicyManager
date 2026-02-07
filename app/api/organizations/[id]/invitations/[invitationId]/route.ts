import { NextResponse } from "next/server";
import { requireSession, getOrgRole } from "@/lib/session";
import { cancelInvitation } from "@/lib/queries/organization-members";
import { logAudit } from "@/lib/queries/audit";
import { query } from "@/lib/db";

interface RouteParams {
  params: { id: string; invitationId: string };
}

// DELETE /api/organizations/[id]/invitations/[invitationId] - Cancel invitation
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await requireSession();
    const { id: organizationId, invitationId } = params;

    // Check if user is org_admin or super_admin
    const role = await getOrgRole(organizationId);
    if (!session.user.isSuperAdmin && role !== "org_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify invitation belongs to this organization
    const result = await query(
      "SELECT id, email FROM organization_invitations WHERE id = $1 AND organization_id = $2",
      [invitationId, organizationId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    const invitation = result.rows[0];
    await cancelInvitation(invitationId);

    await logAudit(
      organizationId,
      session.user.id,
      "invitation.cancelled",
      "organization_invitation",
      invitationId,
      { email: invitation.email }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error cancelling invitation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
