import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { getPolicyMappings, createMapping } from "@/lib/queries/mappings";
import { logAudit } from "@/lib/queries/audit";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
    const { id } = await params;
    const mappings = await getPolicyMappings(id);
    return NextResponse.json(mappings);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const body = await request.json();

    if (!body.control_id) {
      return NextResponse.json({ error: "control_id is required" }, { status: 400 });
    }

    const mapping = await createMapping(
      id,
      body.control_id,
      body.coverage || "full",
      body.notes
    );

    await logAudit(session.user.id, "mapping.created", "policy", id, {
      control_id: body.control_id,
      coverage: body.coverage,
    });

    return NextResponse.json(mapping, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Create mapping error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
