import { jsPDF } from "jspdf";
import Papa from "papaparse";
import { AnalysisResult, GapItem, CategoryScore } from "@/types/analysis";

export function generateCompliancePdf(analysis: AnalysisResult): Buffer {
  const doc = new jsPDF();
  let y = 20;

  // Title
  doc.setFontSize(20);
  doc.text("Compliance Analysis Report", 20, y);
  y += 15;

  doc.setFontSize(12);
  doc.text(`Framework: ${analysis.framework_name || analysis.framework_code || "N/A"}`, 20, y);
  y += 8;
  doc.text(`Date: ${analysis.completed_at ? new Date(analysis.completed_at).toLocaleDateString() : "N/A"}`, 20, y);
  y += 8;
  doc.text(`Triggered by: ${analysis.triggered_by_name || "N/A"}`, 20, y);
  y += 15;

  // Overall Score
  doc.setFontSize(16);
  doc.text("Overall Compliance Score", 20, y);
  y += 10;
  doc.setFontSize(24);
  doc.text(`${(analysis.overall_score || 0).toFixed(1)}%`, 20, y);
  y += 15;

  // Summary stats
  doc.setFontSize(12);
  doc.text(`Total Controls: ${analysis.total_controls || 0}`, 20, y); y += 7;
  doc.text(`Fully Covered: ${analysis.controls_fully_covered}`, 20, y); y += 7;
  doc.text(`Partially Covered: ${analysis.controls_partially_covered}`, 20, y); y += 7;
  doc.text(`Not Covered: ${analysis.controls_not_covered}`, 20, y); y += 15;

  // Category Scores
  if (analysis.category_scores && analysis.category_scores.length > 0) {
    doc.setFontSize(16);
    doc.text("Category Breakdown", 20, y);
    y += 10;
    doc.setFontSize(10);

    for (const cat of analysis.category_scores) {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(`${cat.category_code} - ${cat.category_name}: ${cat.score.toFixed(1)}% (${cat.fully_covered}F / ${cat.partially_covered}P / ${cat.not_covered}N)`, 20, y);
      y += 6;
    }
    y += 10;
  }

  // Gaps
  if (analysis.gaps && analysis.gaps.length > 0) {
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFontSize(16);
    doc.text("Compliance Gaps", 20, y);
    y += 10;
    doc.setFontSize(9);

    for (const gap of analysis.gaps) {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold");
      doc.text(`${gap.control_code} [${gap.severity.toUpperCase()}]`, 20, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(gap.description, 170);
      doc.text(lines, 20, y);
      y += lines.length * 4 + 3;
      const remLines = doc.splitTextToSize(`Remediation: ${gap.remediation}`, 170);
      doc.text(remLines, 20, y);
      y += remLines.length * 4 + 6;
    }
  }

  // Recommendations
  if (analysis.recommendations && analysis.recommendations.length > 0) {
    doc.addPage();
    y = 20;
    doc.setFontSize(16);
    doc.text("Recommendations", 20, y);
    y += 10;
    doc.setFontSize(10);

    for (const rec of analysis.recommendations) {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold");
      doc.text(`${rec.priority}. ${rec.title} [${rec.timeframe}]`, 20, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(rec.description, 170);
      doc.text(lines, 20, y);
      y += lines.length * 4 + 8;
    }
  }

  return Buffer.from(doc.output("arraybuffer"));
}

export function generateGapsCsv(analysis: AnalysisResult): string {
  const gaps = analysis.gaps || [];
  return Papa.unparse(
    gaps.map((g: GapItem) => ({
      Control_Code: g.control_code,
      Control_Title: g.control_title,
      Category: g.category_code,
      Severity: g.severity,
      Description: g.description,
      Remediation: g.remediation,
      Suggested_Policy: g.suggested_policy_type,
    }))
  );
}

export function generateCoverageCsv(analysis: AnalysisResult): string {
  const categories = analysis.category_scores || [];
  return Papa.unparse(
    categories.map((c: CategoryScore) => ({
      Category_Code: c.category_code,
      Category_Name: c.category_name,
      Score: c.score.toFixed(1) + "%",
      Total_Controls: c.total_controls,
      Fully_Covered: c.fully_covered,
      Partially_Covered: c.partially_covered,
      Not_Covered: c.not_covered,
    }))
  );
}
