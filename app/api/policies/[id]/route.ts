import { NextRequest, NextResponse } from "next/server";
import { requireOrganization, requireOrgUser } from "@/lib/session";
import { getPolicyById, updatePolicy, deletePolicy } from "@/lib/queries/policies";
import { logAudit } from "@/lib/queries/audit";
import { updatePolicySchema } from "@/lib/validators/policy";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { organizationId } = await requireOrganization();
    const { id } = await params;
    const policy = await getPolicyById(id, organizationId);
    if (!policy) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }
    return NextResponse.json(policy);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "No organization selected") {
        return NextResponse.json({ error: "No organization selected" }, { status: 400 });
      }
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { session, organizationId } = await requireOrgUser();
    const { id } = await params;
    const body = await request.json();
    const parsed = updatePolicySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await getPolicyById(id, organizationId);
    if (!existing) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }
    if (existing.status !== "draft" && existing.status !== "revision") {
      return NextResponse.json({ error: "Can only edit policies in draft or revision status" }, { status: 400 });
    }

    const updated = await updatePolicy(id, organizationId, parsed.data);
    if (updated) {
      await logAudit(organizationId, session.user.id, "policy.updated", "policy", id, {
        changes: Object.keys(parsed.data),
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden") || error.message.includes("Requires")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (error.message === "No organization selected") {
        return NextResponse.json({ error: "No organization selected" }, { status: 400 });
      }
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { session, organizationId } = await requireOrgUser();
    const { id } = await params;
    const deleted = await deletePolicy(id, organizationId);
    if (!deleted) {
      return NextResponse.json({ error: "Policy not found or cannot be deleted (only draft policies can be deleted)" }, { status: 404 });
    }

    await logAudit(organizationId, session.user.id, "policy.deleted", "policy", id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden") || error.message.includes("Requires")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (error.message === "No organization selected") {
        return NextResponse.json({ error: "No organization selected" }, { status: 400 });
      }
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
