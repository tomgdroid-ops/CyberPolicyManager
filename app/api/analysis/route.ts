import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { createAnalysis, listAnalyses } from "@/lib/queries/analysis";
import { runAnalysis } from "@/lib/services/analysis-service";
import { logAudit } from "@/lib/queries/audit";

export async function GET() {
  try {
    await requireSession();
    const analyses = await listAnalyses();
    return NextResponse.json(analyses);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();

    if (!body.framework_id) {
      return NextResponse.json({ error: "framework_id is required" }, { status: 400 });
    }

    const analysis = await createAnalysis(body.framework_id, session.user.id);

    await logAudit(session.user.id, "analysis.started", "analysis", analysis.id, {
      framework_id: body.framework_id,
    });

    // Run analysis in background (non-blocking)
    runAnalysis(analysis.id, body.framework_id, session.user.id).catch((err) => {
      console.error("Background analysis failed:", err);
    });

    return NextResponse.json(analysis, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Start analysis error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
