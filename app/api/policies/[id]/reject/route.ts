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
      return NextResponse.json({ error: "Can only return policies in review status to draft" }, { status: 400 });
    }

    await createPolicyVersion(id, "returned_to_draft", session.user.id, body.comment);
    const updated = await updatePolicyStatus(id, "draft");

    await logAudit(session.user.id, "policy.returned_to_draft", "policy", id, {
      from: "review", to: "draft", reason: body.comment,
    });

    if (policy.author_id && policy.author_id !== session.user.id) {
      await createNotification(
        policy.author_id,
        "policy.rejected",
        `Policy "${policy.policy_name}" returned to draft`,
        body.comment
          ? `${session.user.name} returned this policy: ${body.comment}`
          : `${session.user.name} returned this policy to draft.`,
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
