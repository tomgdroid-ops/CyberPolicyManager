"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PolicyVersion } from "@/types/policy";
import { ArrowLeft, Clock } from "lucide-react";

export default function PolicyHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const [versions, setVersions] = useState<PolicyVersion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/policies/${id}/history`)
      .then((res) => res.json())
      .then(setVersions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href={`/policies/${id}`}>
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h1 className="text-2xl font-bold">Version History</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>Changes</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : versions.length === 0 ? (
            <p className="text-muted-foreground">No version history available.</p>
          ) : (
            <div className="space-y-4">
              {versions.map((v) => (
                <div key={v.id} className="flex gap-4 border-l-2 border-border pl-4 pb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{v.change_action.replace(/_/g, " ")}</span>
                      <span className="text-muted-foreground">
                        v{v.version_major}.{v.version_minor}
                      </span>
                    </div>
                    {v.change_comment && (
                      <p className="mt-1 text-sm text-muted-foreground">{v.change_comment}</p>
                    )}
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(v.created_at).toLocaleString()}
                      {v.changed_by_name && (
                        <span>&middot; by {v.changed_by_name}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
