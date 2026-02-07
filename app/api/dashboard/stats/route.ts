import { NextResponse } from "next/server";
import { requireOrganization } from "@/lib/session";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const { organizationId } = await requireOrganization();

    const [policyCounts, overdueReviews, latestAnalysis, recentActivity] = await Promise.all([
      query(`
        SELECT
          COUNT(*) as total_policies,
          COUNT(*) FILTER (WHERE status = 'draft') as draft_count,
          COUNT(*) FILTER (WHERE status = 'review') as review_count,
          COUNT(*) FILTER (WHERE status = 'finalized') as finalized_count,
          COUNT(*) FILTER (WHERE status = 'archived') as archived_count
        FROM policies
        WHERE organization_id = $1
      `, [organizationId]),
      query(`
        SELECT COUNT(*) as count FROM policies
        WHERE organization_id = $1 AND review_date < CURRENT_DATE AND status = 'finalized'
      `, [organizationId]),
      query(`
        SELECT overall_score FROM analysis_results
        WHERE organization_id = $1 AND status = 'completed'
        ORDER BY completed_at DESC LIMIT 1
      `, [organizationId]),
      query(`
        SELECT a.id, a.action, a.entity_type, a.created_at, a.details,
               u.name as user_name
        FROM audit_log a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE a.organization_id = $1
        ORDER BY a.created_at DESC LIMIT 10
      `, [organizationId]),
    ]);

    return NextResponse.json({
      total_policies: parseInt(policyCounts.rows[0].total_policies),
      draft_count: parseInt(policyCounts.rows[0].draft_count),
      review_count: parseInt(policyCounts.rows[0].review_count),
      finalized_count: parseInt(policyCounts.rows[0].finalized_count),
      archived_count: parseInt(policyCounts.rows[0].archived_count),
      overdue_reviews: parseInt(overdueReviews.rows[0].count),
      latest_compliance_score: latestAnalysis.rows[0]?.overall_score
        ? parseFloat(latestAnalysis.rows[0].overall_score)
        : null,
      recent_activity: recentActivity.rows,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "No organization selected") {
        return NextResponse.json({ error: "No organization selected" }, { status: 400 });
      }
    }
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
