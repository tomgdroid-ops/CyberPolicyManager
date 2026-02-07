import { NextResponse } from "next/server";
import { requireSuperAdmin, requireSession } from "@/lib/session";
import {
  getAllOrganizations,
  createOrganization,
  isSlugAvailable,
} from "@/lib/queries/organizations";
import { logAudit } from "@/lib/queries/audit";
import { z } from "zod";

const createOrgSchema = z.object({
  name: z.string().min(1).max(500),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  industry: z.string().max(255).optional(),
  description: z.string().optional(),
});

// GET /api/organizations - List all organizations (super_admin only)
export async function GET() {
  try {
    const session = await requireSuperAdmin();

    const organizations = await getAllOrganizations();

    return NextResponse.json({ organizations });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    console.error("Error listing organizations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/organizations - Create new organization (super_admin only)
export async function POST(request: Request) {
  try {
    const session = await requireSuperAdmin();
    const body = await request.json();

    const parsed = createOrgSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.issues },
        { status: 400 }
      );
    }

    // Check if slug is available
    const slugAvailable = await isSlugAvailable(parsed.data.slug);
    if (!slugAvailable) {
      return NextResponse.json(
        { error: "Organization slug is already taken" },
        { status: 400 }
      );
    }

    const organization = await createOrganization(parsed.data, session.user.id);

    await logAudit(
      organization.id,
      session.user.id,
      "organization.created",
      "organization",
      organization.id,
      { name: organization.name, slug: organization.slug }
    );

    return NextResponse.json({ organization }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    console.error("Error creating organization:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
