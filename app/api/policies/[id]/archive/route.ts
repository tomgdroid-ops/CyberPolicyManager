import { NextRequest, NextResponse } from "next/server";
import { requireOrganization } from "@/lib/session";
import { getPolicyById, updatePolicyStatus, createPolicyVersion } from "@/lib/queries/policies";
import { logAudit } from "@/lib/queries/audit";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { session, organizationId } = await requireOrganization();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const policy = await getPolicyById(id, organizationId);
    if (!policy) return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    if (policy.status !== "finalized") {
      return NextResponse.json({ error: "Can only archive finalized policies" }, { status: 400 });
    }

    await createPolicyVersion(id, "archived", session.user.id, body.comment);
    const updated = await updatePolicyStatus(id, organizationId, "archived");

    await logAudit(organizationId, session.user.id, "policy.archived", "policy", id, {});

    return NextResponse.json(updated);
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
