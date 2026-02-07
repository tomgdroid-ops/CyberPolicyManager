import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { listPolicies, createPolicy, createPolicyVersion } from "@/lib/queries/policies";
import { logAudit } from "@/lib/queries/audit";
import { createPolicySchema } from "@/lib/validators/policy";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);

    const result = await listPolicies({
      status: searchParams.get("status") || undefined,
      search: searchParams.get("search") || undefined,
      owner_id: searchParams.get("owner_id") || undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
      offset: searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("List policies error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const parsed = createPolicySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    const policy = await createPolicy(parsed.data, session.user.id);
    await createPolicyVersion(policy.id, "created", session.user.id, "Policy created");
    await logAudit(session.user.id, "policy.created", "policy", policy.id, {
      policy_name: policy.policy_name,
      policy_code: policy.policy_code,
    });

    return NextResponse.json(policy, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Create policy error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
