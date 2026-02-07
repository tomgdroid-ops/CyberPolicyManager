import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { getAnalysisById } from "@/lib/queries/analysis";
import { generateCompliancePdf, generateGapsCsv, generateCoverageCsv } from "@/lib/services/report-generator";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "pdf";

    const analysis = await getAnalysisById(id);
    if (!analysis) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }
    if (analysis.status !== "completed") {
      return NextResponse.json({ error: "Analysis not yet completed" }, { status: 400 });
    }

    if (format === "pdf") {
      const pdfBuffer = generateCompliancePdf(analysis);
      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="compliance-report-${analysis.framework_code || "report"}.pdf"`,
        },
      });
    }

    if (format === "gaps_csv") {
      const csv = generateGapsCsv(analysis);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="gaps-${analysis.framework_code || "report"}.csv"`,
        },
      });
    }

    if (format === "coverage_csv") {
      const csv = generateCoverageCsv(analysis);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="coverage-${analysis.framework_code || "report"}.csv"`,
        },
      });
    }

    return NextResponse.json({ error: "Invalid format. Use: pdf, gaps_csv, coverage_csv" }, { status: 400 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Export error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
