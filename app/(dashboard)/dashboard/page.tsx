"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, FileCheck, FileClock, FileWarning, BarChart3 } from "lucide-react";

interface DashboardStats {
  total_policies: number;
  draft_count: number;
  review_count: number;
  finalized_count: number;
  archived_count: number;
  overdue_reviews: number;
  latest_compliance_score: number | null;
  recent_activity: Array<{
    id: string;
    action: string;
    entity_type: string;
    user_name: string;
    created_at: string;
    details: Record<string, unknown>;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then((data) => {
        // Handle error responses - API may return { error: "..." }
        if (data && !data.error) {
          setStats(data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Total Policies", value: stats?.total_policies || 0, icon: FileText, color: "text-blue-600" },
    { label: "In Draft", value: stats?.draft_count || 0, icon: FileClock, color: "text-amber-600" },
    { label: "In Review", value: stats?.review_count || 0, icon: FileWarning, color: "text-blue-500" },
    { label: "Finalized", value: stats?.finalized_count || 0, icon: FileCheck, color: "text-green-600" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Compliance Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.latest_compliance_score !== null && stats?.latest_compliance_score !== undefined ? (
              <div className="flex items-center gap-4">
                <div className="text-5xl font-bold text-primary">
                  {stats.latest_compliance_score.toFixed(0)}%
                </div>
                <p className="text-sm text-muted-foreground">
                  Latest compliance analysis score
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">
                No compliance analysis has been run yet. Go to Compliance to run your first analysis.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recent_activity && stats.recent_activity.length > 0 ? (
              <div className="space-y-3">
                {stats.recent_activity.slice(0, 8).map((item) => (
                  <div key={item.id} className="flex items-start justify-between text-sm">
                    <div>
                      <span className="font-medium">{item.user_name}</span>{" "}
                      <span className="text-muted-foreground">{item.action}</span>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No recent activity yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {(stats?.overdue_reviews || 0) > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <FileWarning className="h-6 w-6 text-amber-600" />
              <div>
                <p className="font-semibold text-amber-800">
                  {stats!.overdue_reviews} {stats!.overdue_reviews === 1 ? "policy" : "policies"} overdue for review
                </p>
                <p className="text-sm text-amber-700">
                  Visit the Policies page to see which policies need attention.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
