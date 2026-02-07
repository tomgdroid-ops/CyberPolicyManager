import { NextResponse } from "next/server";
import { requireSession, getOrgRole } from "@/lib/session";
import {
  getMemberById,
  updateMemberRole,
  removeMember,
} from "@/lib/queries/organization-members";
import { logAudit } from "@/lib/queries/audit";
import { z } from "zod";

const updateMemberSchema = z.object({
  role: z.enum(["org_admin", "org_user", "org_viewer"]),
});

interface RouteParams {
  params: { id: string; memberId: string };
}

// PUT /api/organizations/[id]/members/[memberId] - Update member role
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await requireSession();
    const { id: organizationId, memberId } = params;

    // Check if user is org_admin or super_admin
    const role = await getOrgRole(organizationId);
    if (!session.user.isSuperAdmin && role !== "org_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.issues },
        { status: 400 }
      );
    }

    // Get existing member to verify it belongs to this org
    const existingMember = await getMemberById(memberId);
    if (!existingMember || existingMember.organizationId !== organizationId) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Prevent demoting yourself if you're the only admin
    if (existingMember.userId === session.user.id && parsed.data.role !== "org_admin") {
      return NextResponse.json(
        { error: "Cannot demote yourself. Transfer admin role first." },
        { status: 400 }
      );
    }

    const member = await updateMemberRole(memberId, parsed.data.role);

    await logAudit(
      organizationId,
      session.user.id,
      "member.role_updated",
      "organization_member",
      memberId,
      { userId: existingMember.userId, oldRole: existingMember.role, newRole: parsed.data.role }
    );

    return NextResponse.json({ member });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error updating member:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/organizations/[id]/members/[memberId] - Remove member
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await requireSession();
    const { id: organizationId, memberId } = params;

    // Check if user is org_admin or super_admin
    const role = await getOrgRole(organizationId);
    if (!session.user.isSuperAdmin && role !== "org_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get existing member
    const existingMember = await getMemberById(memberId);
    if (!existingMember || existingMember.organizationId !== organizationId) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Prevent removing yourself
    if (existingMember.userId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot remove yourself from the organization" },
        { status: 400 }
      );
    }

    await removeMember(memberId);

    await logAudit(
      organizationId,
      session.user.id,
      "member.removed",
      "organization_member",
      memberId,
      { userId: existingMember.userId }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error removing member:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
