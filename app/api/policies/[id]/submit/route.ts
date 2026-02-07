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

    if (policy.status !== "draft" && policy.status !== "revision") {
      return NextResponse.json({ error: "Can only submit policies in draft or revision status" }, { status: 400 });
    }

    await createPolicyVersion(id, "submitted_for_review", session.user.id, body.comment);
    const updated = await updatePolicyStatus(id, "review");

    await logAudit(session.user.id, "policy.submitted_for_review", "policy", id, {
      from: policy.status, to: "review",
    });

    if (policy.owner_id && policy.owner_id !== session.user.id) {
      await createNotification(
        policy.owner_id,
        "policy.submitted",
        `Policy "${policy.policy_name}" submitted for review`,
        `${session.user.name} submitted this policy for your review.`,
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
