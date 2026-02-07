import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { getPolicyById, updatePolicyStatus, createPolicyVersion } from "@/lib/queries/policies";
import { logAudit } from "@/lib/queries/audit";
import { createNotification } from "@/lib/queries/notifications";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const policy = await getPolicyById(id);
    if (!policy) return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    if (policy.status !== "review") {
      return NextResponse.json({ error: "Can only approve policies in review status" }, { status: 400 });
    }

    await createPolicyVersion(id, "approved", session.user.id, body.comment);
    const updated = await updatePolicyStatus(id, "finalized");

    await logAudit(session.user.id, "policy.approved", "policy", id, {
      from: "review", to: "finalized",
    });

    if (policy.author_id && policy.author_id !== session.user.id) {
      await createNotification(
        policy.author_id,
        "policy.approved",
        `Policy "${policy.policy_name}" approved`,
        `${session.user.name} approved this policy.`,
        `/policies/${id}`
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
