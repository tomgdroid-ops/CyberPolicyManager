"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Framework } from "@/types/framework";
import { BookOpen } from "lucide-react";

export default function FrameworksPage() {
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/frameworks")
      .then((res) => res.json())
      .then((data) => {
        // Handle error responses
        setFrameworks(Array.isArray(data) ? data : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Compliance Frameworks</h1>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}><CardContent className="p-6"><div className="h-32 animate-pulse rounded bg-muted" /></CardContent></Card>
          ))}
        </div>
      ) : frameworks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No frameworks available</h3>
            <p className="mt-1 text-muted-foreground">
              Run the database seed to load NIST CSF 2.0 and other frameworks.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {frameworks.map((fw) => (
            <Link key={fw.id} href={`/frameworks/${fw.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{fw.name}</CardTitle>
                    {fw.version && <Badge variant="secondary">v{fw.version}</Badge>}
                  </div>
                  <CardDescription>{fw.issuing_body}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {fw.description || "No description available"}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{fw.total_controls} controls</span>
                    {fw.industry_applicability?.length > 0 && (
                      <div className="flex gap-1">
                        {fw.industry_applicability.slice(0, 2).map((ind) => (
                          <Badge key={ind} variant="outline" className="text-xs">{ind}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
