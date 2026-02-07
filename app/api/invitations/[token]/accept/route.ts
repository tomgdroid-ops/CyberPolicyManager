import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import {
  getInvitationByToken,
  acceptInvitation,
} from "@/lib/queries/organization-members";
import { logAudit } from "@/lib/queries/audit";

type RouteContext = {
  params: Promise<{ token: string }>;
};

// POST /api/invitations/[token]/accept - Accept an invitation
export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { token } = await context.params;

    // Get the invitation
    const invitation = await getInvitationByToken(token);

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    if (invitation.acceptedAt) {
      return NextResponse.json(
        { error: "Invitation has already been accepted" },
        { status: 400 }
      );
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "Invitation has expired" },
        { status: 400 }
      );
    }

    // Verify the invitation email matches the logged-in user
    if (invitation.email.toLowerCase() !== session.user.email.toLowerCase()) {
      return NextResponse.json(
        { error: "This invitation was sent to a different email address" },
        { status: 403 }
      );
    }

    // Accept the invitation
    const success = await acceptInvitation(token, session.user.id);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to accept invitation" },
        { status: 500 }
      );
    }

    await logAudit(
      invitation.organizationId,
      session.user.id,
      "invitation.accepted",
      "organization_invitation",
      invitation.id,
      { email: invitation.email, role: invitation.role }
    );

    return NextResponse.json({
      success: true,
      organizationId: invitation.organizationId,
      organizationName: invitation.organizationName,
      role: invitation.role,
      message: "You have successfully joined the organization",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error accepting invitation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/invitations/[token]/accept - Get invitation details (for preview)
export async function GET(request: Request, context: RouteContext) {
  try {
    const { token } = await context.params;

    const invitation = await getInvitationByToken(token);

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    if (invitation.acceptedAt) {
      return NextResponse.json(
        { error: "Invitation has already been accepted" },
        { status: 400 }
      );
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "Invitation has expired" },
        { status: 400 }
      );
    }

    // Return safe invitation details (without token)
    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        organizationName: invitation.organizationName,
        invitedByName: invitation.invitedByName,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
      },
    });
  } catch (error) {
    console.error("Error getting invitation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
