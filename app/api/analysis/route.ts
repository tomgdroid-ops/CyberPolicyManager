import { NextRequest, NextResponse } from "next/server";
import { requireOrganization, requireOrgUser } from "@/lib/session";
import { createAnalysis, listAnalyses } from "@/lib/queries/analysis";
import { runAnalysis } from "@/lib/services/analysis-service";
import { logAudit } from "@/lib/queries/audit";

export async function GET() {
  try {
    const { organizationId } = await requireOrganization();
    const analyses = await listAnalyses(organizationId);
    return NextResponse.json(analyses);
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

export async function POST(request: NextRequest) {
  try {
    const { session, organizationId } = await requireOrgUser();
    const body = await request.json();

    if (!body.framework_id) {
      return NextResponse.json({ error: "framework_id is required" }, { status: 400 });
    }

    const analysis = await createAnalysis(organizationId, body.framework_id, session.user.id);

    await logAudit(organizationId, session.user.id, "analysis.started", "analysis", analysis.id, {
      framework_id: body.framework_id,
    });

    // Run analysis in background (non-blocking)
    runAnalysis(analysis.id, organizationId, body.framework_id, session.user.id).catch((err) => {
      console.error("Background analysis failed:", err);
    });

    return NextResponse.json(analysis, { status: 201 });
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
    console.error("Start analysis error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
