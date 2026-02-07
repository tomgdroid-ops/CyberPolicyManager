"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { Framework } from "@/types/framework";
import { AnalysisResult, CategoryScore, GapItem } from "@/types/analysis";
import { BarChart3, Play, Download, AlertTriangle, CheckCircle, Clock } from "lucide-react";

export default function CompliancePage() {
  const { addToast } = useToast();
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [selectedFramework, setSelectedFramework] = useState("");
  const [latestAnalysis, setLatestAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/frameworks").then((r) => r.json()),
      fetch("/api/analysis").then((r) => r.json()),
    ])
      .then(([fws, als]) => {
        setFrameworks(fws);
        setAnalyses(als);
        if (fws.length > 0) setSelectedFramework(fws[0].id);
        const completed = als.filter((a: AnalysisResult) => a.status === "completed");
        if (completed.length > 0) setLatestAnalysis(completed[0]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function startAnalysis() {
    if (!selectedFramework) return;
    setRunning(true);
    try {
      const res = await fetch("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ framework_id: selectedFramework }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const analysis = await res.json();
      addToast({ title: "Analysis started. This may take a few moments..." });

      // Poll for completion
      const pollInterval = setInterval(async () => {
        const statusRes = await fetch(`/api/analysis/${analysis.id}`);
        const statusData = await statusRes.json();
        if (statusData.status === "completed") {
          clearInterval(pollInterval);
          setLatestAnalysis(statusData);
          setRunning(false);
          addToast({ title: "Analysis complete!" });
          // Refresh the list
          const alsRes = await fetch("/api/analysis");
          setAnalyses(await alsRes.json());
        } else if (statusData.status === "failed") {
          clearInterval(pollInterval);
          setRunning(false);
          addToast({ title: "Analysis failed", description: statusData.error_message, variant: "destructive" });
        }
      }, 3000);
    } catch (error) {
      addToast({ title: "Error", description: error instanceof Error ? error.message : "Failed to start", variant: "destructive" });
      setRunning(false);
    }
  }

  const severityCounts = latestAnalysis?.gaps
    ? (latestAnalysis.gaps as GapItem[]).reduce(
        (acc: Record<string, number>, g: GapItem) => {
          acc[g.severity] = (acc[g.severity] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      )
    : {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Compliance Analysis</h1>
        <div className="flex items-center gap-2">
          <Select value={selectedFramework} onChange={(e) => setSelectedFramework(e.target.value)} className="w-64">
            {frameworks.map((fw) => (
              <option key={fw.id} value={fw.id}>{fw.name}</option>
            ))}
          </Select>
          <Button onClick={startAnalysis} disabled={running || !selectedFramework}>
            <Play className="mr-2 h-4 w-4" />
            {running ? "Running..." : "Run Analysis"}
          </Button>
        </div>
      </div>

      {running && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="py-6 flex items-center gap-3">
            <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-blue-800">Analysis in progress... Analyzing policies against framework controls.</p>
          </CardContent>
        </Card>
      )}

      {latestAnalysis && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground">Overall Score</p>
                <p className="text-4xl font-bold text-primary">{(latestAnalysis.overall_score || 0).toFixed(0)}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground">Fully Covered</p>
                <p className="text-3xl font-bold text-green-600">{latestAnalysis.controls_fully_covered}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground">Partially Covered</p>
                <p className="text-3xl font-bold text-amber-600">{latestAnalysis.controls_partially_covered}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground">Not Covered</p>
                <p className="text-3xl font-bold text-red-600">{latestAnalysis.controls_not_covered}</p>
              </CardContent>
            </Card>
          </div>

          {/* Gap Severity Summary */}
          {Object.keys(severityCounts).length > 0 && (
            <div className="grid gap-4 md:grid-cols-4">
              {(["critical", "high", "medium", "low"] as const).map((sev) => (
                <Card key={sev}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <AlertTriangle className={`h-5 w-5 ${
                      sev === "critical" ? "text-red-600" :
                      sev === "high" ? "text-orange-600" :
                      sev === "medium" ? "text-amber-600" : "text-blue-600"
                    }`} />
                    <div>
                      <p className="text-sm text-muted-foreground capitalize">{sev} Gaps</p>
                      <p className="text-xl font-bold">{severityCounts[sev] || 0}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Category Scores */}
          {latestAnalysis.category_scores && (
            <Card>
              <CardHeader><CardTitle>Category Coverage</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(latestAnalysis.category_scores as CategoryScore[]).map((cat) => (
                    <div key={cat.category_code} className="flex items-center gap-4">
                      <span className="w-20 font-mono text-sm text-primary">{cat.category_code}</span>
                      <span className="w-48 text-sm">{cat.category_name}</span>
                      <div className="flex-1 h-4 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            cat.score >= 80 ? "bg-green-500" :
                            cat.score >= 60 ? "bg-amber-500" :
                            cat.score >= 40 ? "bg-orange-500" : "bg-red-500"
                          }`}
                          style={{ width: `${cat.score}%` }}
                        />
                      </div>
                      <span className="w-16 text-right font-medium">{cat.score.toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Gaps Table */}
          {latestAnalysis.gaps && (latestAnalysis.gaps as GapItem[]).length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Compliance Gaps ({(latestAnalysis.gaps as GapItem[]).length})</CardTitle>
                  <div className="flex gap-2">
                    <a href={`/api/analysis/${latestAnalysis.id}/export?format=gaps_csv`}>
                      <Button variant="outline" size="sm"><Download className="mr-1 h-3 w-3" />CSV</Button>
                    </a>
                    <a href={`/api/analysis/${latestAnalysis.id}/export?format=pdf`}>
                      <Button variant="outline" size="sm"><Download className="mr-1 h-3 w-3" />PDF</Button>
                    </a>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(latestAnalysis.gaps as GapItem[]).map((gap, i) => (
                    <div key={i} className="p-3 rounded border">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm text-primary">{gap.control_code}</span>
                        <Badge variant={
                          gap.severity === "critical" ? "destructive" :
                          gap.severity === "high" ? "draft" :
                          gap.severity === "medium" ? "review" : "secondary"
                        }>
                          {gap.severity}
                        </Badge>
                      </div>
                      <p className="text-sm">{gap.description}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        <strong>Remediation:</strong> {gap.remediation}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {latestAnalysis.recommendations && (latestAnalysis.recommendations as Array<{ priority: number; title: string; description: string; timeframe: string }>).length > 0 && (
            <Card>
              <CardHeader><CardTitle>Recommendations</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(latestAnalysis.recommendations as Array<{ priority: number; title: string; description: string; timeframe: string }>).map((rec, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                        {rec.priority}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{rec.title}</span>
                          <Badge variant="outline">{rec.timeframe.replace("_", " ")}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!latestAnalysis && !running && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No analysis results yet</h3>
            <p className="mt-1 text-muted-foreground">
              Select a framework and click "Run Analysis" to assess your policy compliance.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Analysis History */}
      {analyses.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Analysis History</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analyses.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded border">
                  <div className="flex items-center gap-3">
                    {a.status === "completed" ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : a.status === "failed" ? (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-blue-600" />
                    )}
                    <div>
                      <span className="text-sm font-medium">{a.framework_name}</span>
                      {a.overall_score !== null && (
                        <span className="ml-2 text-sm text-muted-foreground">
                          {parseFloat(String(a.overall_score)).toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(a.created_at).toLocaleString()}
                    </span>
                    {a.status === "completed" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setLatestAnalysis(a)}
                      >
                        View
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
