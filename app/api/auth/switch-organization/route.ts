import { NextResponse } from "next/server";
import { requireSession, canAccessOrganization } from "@/lib/session";
import { setPrimaryOrganization } from "@/lib/queries/organization-members";
import { z } from "zod";

const switchOrgSchema = z.object({
  organizationId: z.string().uuid(),
  setPrimary: z.boolean().optional(),
});

// POST /api/auth/switch-organization - Switch to a different organization
export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();

    const parsed = switchOrgSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { organizationId, setPrimary } = parsed.data;

    // Check if user has access to this organization
    const canAccess = await canAccessOrganization(organizationId);
    if (!canAccess) {
      return NextResponse.json(
        { error: "You do not have access to this organization" },
        { status: 403 }
      );
    }

    // If setPrimary is true, update the user's primary organization
    if (setPrimary) {
      await setPrimaryOrganization(session.user.id, organizationId);
    }

    // Return success - the actual switch happens via NextAuth update
    // Client should call `update({ currentOrganizationId: organizationId })` on the session
    return NextResponse.json({
      success: true,
      organizationId,
      message: "Organization switched. Please update your session.",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error switching organization:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
