import { NextRequest, NextResponse } from "next/server";
import { requireOrgUser } from "@/lib/session";
import { getPolicyById, updatePolicyStatus, createPolicyVersion, incrementPolicyVersion } from "@/lib/queries/policies";
import { logAudit } from "@/lib/queries/audit";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { session, organizationId } = await requireOrgUser();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const policy = await getPolicyById(id, organizationId);
    if (!policy) return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    if (policy.status !== "finalized") {
      return NextResponse.json({ error: "Can only initiate revision on finalized policies" }, { status: 400 });
    }

    await createPolicyVersion(id, "revision_initiated", session.user.id, body.comment);
    await incrementPolicyVersion(id, false);
    const updated = await updatePolicyStatus(id, organizationId, "revision");

    await logAudit(organizationId, session.user.id, "policy.revision_initiated", "policy", id, {});

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden") || error.message.includes("Requires")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
