import { NextResponse } from "next/server";
import { requireSession, getOrgRole } from "@/lib/session";
import {
  getOrganizationMembers,
  addMember,
} from "@/lib/queries/organization-members";
import { logAudit } from "@/lib/queries/audit";
import { query } from "@/lib/db";
import { z } from "zod";

const addMemberSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["org_admin", "org_user", "org_viewer"]),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/organizations/[id]/members - List organization members
export async function GET(request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { id: organizationId } = await context.params;

    // Check access - any member can view the member list
    const role = await getOrgRole(organizationId);
    if (!role && !session.user.isSuperAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const members = await getOrganizationMembers(organizationId);

    return NextResponse.json({ members });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error listing members:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/organizations/[id]/members - Add member (org_admin or super_admin)
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
    const parsed = addMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.issues },
        { status: 400 }
      );
    }

    // Check if user exists
    const userResult = await query("SELECT id, email, name FROM users WHERE id = $1", [
      parsed.data.userId,
    ]);
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if already a member
    const existingResult = await query(
      "SELECT 1 FROM organization_members WHERE organization_id = $1 AND user_id = $2",
      [organizationId, parsed.data.userId]
    );
    if (existingResult.rows.length > 0) {
      return NextResponse.json(
        { error: "User is already a member of this organization" },
        { status: 400 }
      );
    }

    const member = await addMember(
      organizationId,
      parsed.data.userId,
      parsed.data.role,
      false
    );

    await logAudit(
      organizationId,
      session.user.id,
      "member.added",
      "organization_member",
      member.id,
      { userId: parsed.data.userId, role: parsed.data.role }
    );

    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error adding member:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
