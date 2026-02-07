import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/session";
import { query } from "@/lib/db";

export async function GET() {
  try {
    await requireSuperAdmin();

    const [orgsResult, usersResult, policiesResult, activityResult] = await Promise.all([
      query("SELECT COUNT(*) FROM organizations WHERE is_active = true"),
      query("SELECT COUNT(*) FROM users WHERE is_active = true"),
      query("SELECT COUNT(*) FROM policies"),
      query(`
        SELECT a.id, a.action, a.created_at,
               u.name as user_name,
               o.name as organization_name
        FROM audit_log a
        LEFT JOIN users u ON a.user_id = u.id
        LEFT JOIN organizations o ON a.organization_id = o.id
        ORDER BY a.created_at DESC
        LIMIT 20
      `),
    ]);

    return NextResponse.json({
      totalOrganizations: parseInt(orgsResult.rows[0].count),
      totalUsers: parseInt(usersResult.rows[0].count),
      totalPolicies: parseInt(policiesResult.rows[0].count),
      recentActivity: activityResult.rows,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
