"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnalysisResult, GapItem, CategoryScore } from "@/types/analysis";
import { ArrowLeft, Download } from "lucide-react";

export default function AnalysisDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/analysis/${id}`)
      .then((r) => r.json())
      .then(setAnalysis)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="h-64 animate-pulse rounded bg-muted" />;
  if (!analysis) return <p>Analysis not found.</p>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/compliance"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold">Analysis Result</h1>
            <p className="text-sm text-muted-foreground">{analysis.framework_name} &middot; {new Date(analysis.created_at).toLocaleString()}</p>
          </div>
        </div>
        {analysis.status === "completed" && (
          <div className="flex gap-2">
            <a href={`/api/analysis/${id}/export?format=pdf`}><Button variant="outline" size="sm"><Download className="mr-1 h-3 w-3" />PDF</Button></a>
            <a href={`/api/analysis/${id}/export?format=gaps_csv`}><Button variant="outline" size="sm"><Download className="mr-1 h-3 w-3" />Gaps CSV</Button></a>
          </div>
        )}
      </div>

      {analysis.status !== "completed" ? (
        <Card><CardContent className="py-8 text-center">
          <Badge variant={analysis.status === "failed" ? "destructive" : "review"}>{analysis.status}</Badge>
          {analysis.error_message && <p className="mt-2 text-sm text-destructive">{analysis.error_message}</p>}
        </CardContent></Card>
      ) : (
        <>
          <Card>
            <CardContent className="py-6 text-center">
              <p className="text-sm text-muted-foreground">Overall Compliance Score</p>
              <p className="text-5xl font-bold text-primary">{(analysis.overall_score || 0).toFixed(1)}%</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {analysis.controls_fully_covered} fully covered / {analysis.controls_partially_covered} partial / {analysis.controls_not_covered} gaps out of {analysis.total_controls} controls
              </p>
            </CardContent>
          </Card>

          {analysis.category_scores && (
            <Card>
              <CardHeader><CardTitle>Category Scores</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(analysis.category_scores as CategoryScore[]).map((cat) => (
                    <div key={cat.category_code} className="flex items-center gap-4">
                      <span className="w-16 font-mono text-sm">{cat.category_code}</span>
                      <span className="w-40 text-sm">{cat.category_name}</span>
                      <div className="flex-1 h-3 rounded bg-muted overflow-hidden">
                        <div className="h-full bg-primary rounded" style={{ width: `${cat.score}%` }} />
                      </div>
                      <span className="w-12 text-right text-sm font-medium">{cat.score.toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {analysis.gaps && (analysis.gaps as GapItem[]).length > 0 && (
            <Card>
              <CardHeader><CardTitle>Gaps ({(analysis.gaps as GapItem[]).length})</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {(analysis.gaps as GapItem[]).map((gap, i) => (
                  <div key={i} className="p-3 rounded border">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{gap.control_code}</span>
                      <Badge variant={gap.severity === "critical" ? "destructive" : "secondary"}>{gap.severity}</Badge>
                    </div>
                    <p className="text-sm mt-1">{gap.description}</p>
                    <p className="text-sm text-muted-foreground mt-1">Remediation: {gap.remediation}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
