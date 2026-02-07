"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { AnalysisResult } from "@/types/analysis";
import { Download, FileBarChart, FileSpreadsheet } from "lucide-react";

export default function ReportsPage() {
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analysis")
      .then((r) => r.json())
      .then((data) => {
        // Handle error responses
        const list = Array.isArray(data) ? data : [];
        setAnalyses(list.filter((a: AnalysisResult) => a.status === "completed"));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Reports</h1>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Card key={i}><CardContent className="p-6"><div className="h-24 animate-pulse rounded bg-muted" /></CardContent></Card>
          ))}
        </div>
      ) : analyses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileBarChart className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No reports available</h3>
            <p className="mt-1 text-muted-foreground">Run a compliance analysis first to generate reports.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {analyses.map((analysis) => (
            <Card key={analysis.id}>
              <CardHeader>
                <CardTitle className="text-lg">{analysis.framework_name}</CardTitle>
                <CardDescription>
                  Score: {parseFloat(String(analysis.overall_score || 0)).toFixed(1)}% &middot;{" "}
                  {new Date(analysis.completed_at || analysis.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <a href={`/api/analysis/${analysis.id}/export?format=pdf`}>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <FileBarChart className="mr-2 h-4 w-4" />
                    Download PDF Report
                  </Button>
                </a>
                <a href={`/api/analysis/${analysis.id}/export?format=gaps_csv`}>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Download Gaps CSV
                  </Button>
                </a>
                <a href={`/api/analysis/${analysis.id}/export?format=coverage_csv`}>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Download Coverage CSV
                  </Button>
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
