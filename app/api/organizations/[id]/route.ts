import { NextResponse } from "next/server";
import { requireSuperAdmin, requireSession, canAccessOrganization, getOrgRole } from "@/lib/session";
import {
  getOrganizationById,
  updateOrganization,
  deactivateOrganization,
  getOrganizationStats,
} from "@/lib/queries/organizations";
import { logAudit } from "@/lib/queries/audit";
import { z } from "zod";

const updateOrgSchema = z.object({
  name: z.string().min(1).max(500).optional(),
  industry: z.string().max(255).optional(),
  description: z.string().optional(),
  logoUrl: z.string().url().optional().nullable(),
  settings: z.record(z.unknown()).optional(),
  isActive: z.boolean().optional(),
});

interface RouteParams {
  params: { id: string };
}

// GET /api/organizations/[id] - Get organization details
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await requireSession();
    const { id } = params;

    // Check access
    const canAccess = await canAccessOrganization(id);
    if (!canAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const organization = await getOrganizationById(id);
    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Get stats if user is admin
    const role = await getOrgRole(id);
    let stats = null;
    if (role === "org_admin" || session.user.isSuperAdmin) {
      stats = await getOrganizationStats(id);
    }

    return NextResponse.json({ organization, stats });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error getting organization:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/organizations/[id] - Update organization (super_admin or org_admin)
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await requireSession();
    const { id } = params;

    // Check if user is super_admin or org_admin for this org
    const role = await getOrgRole(id);
    if (!session.user.isSuperAdmin && role !== "org_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateOrgSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.issues },
        { status: 400 }
      );
    }

    // Non-super admins cannot change isActive
    if (!session.user.isSuperAdmin && parsed.data.isActive !== undefined) {
      delete parsed.data.isActive;
    }

    const organization = await updateOrganization(id, parsed.data);
    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    await logAudit(
      id,
      session.user.id,
      "organization.updated",
      "organization",
      id,
      { changes: parsed.data }
    );

    return NextResponse.json({ organization });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error updating organization:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/organizations/[id] - Deactivate organization (super_admin only)
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await requireSuperAdmin();
    const { id } = params;

    // Prevent deletion of default organization
    if (id === "00000000-0000-0000-0000-000000000001") {
      return NextResponse.json(
        { error: "Cannot deactivate the default organization" },
        { status: 400 }
      );
    }

    const success = await deactivateOrganization(id);
    if (!success) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    await logAudit(
      id,
      session.user.id,
      "organization.deactivated",
      "organization",
      id,
      {}
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    console.error("Error deactivating organization:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
