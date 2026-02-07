import { NextRequest, NextResponse } from "next/server";
import { requireOrganization, requireOrgUser } from "@/lib/session";
import { listPolicies, createPolicy, createPolicyVersion } from "@/lib/queries/policies";
import { logAudit } from "@/lib/queries/audit";
import { createPolicySchema } from "@/lib/validators/policy";

export async function GET(request: NextRequest) {
  try {
    const { organizationId } = await requireOrganization();
    const { searchParams } = new URL(request.url);

    const result = await listPolicies(organizationId, {
      status: searchParams.get("status") || undefined,
      search: searchParams.get("search") || undefined,
      owner_id: searchParams.get("owner_id") || undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
      offset: searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "No organization selected") {
        return NextResponse.json({ error: "No organization selected" }, { status: 400 });
      }
    }
    console.error("List policies error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { session, organizationId } = await requireOrgUser();
    const body = await request.json();
    const parsed = createPolicySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    const policy = await createPolicy(organizationId, parsed.data, session.user.id);
    await createPolicyVersion(policy.id, "created", session.user.id, "Policy created");
    await logAudit(organizationId, session.user.id, "policy.created", "policy", policy.id, {
      policy_name: policy.policy_name,
      policy_code: policy.policy_code,
    });

    return NextResponse.json(policy, { status: 201 });
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
    console.error("Create policy error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
