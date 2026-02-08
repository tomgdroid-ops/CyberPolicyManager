"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PolicyStatusBadge } from "@/components/policies/policy-status-badge";
import { Badge } from "@/components/ui/badge";
import { Policy, PolicyStatus, ControlMappingSummary } from "@/types/policy";
import { Plus, Search, FileText, Link as LinkIcon } from "lucide-react";

// Component to display control mappings in a compact way
function ControlMappingsCell({ mappings, policyId }: { mappings: ControlMappingSummary[] | null | undefined; policyId: string }) {
  if (!mappings || mappings.length === 0) {
    return (
      <Link href={`/policies/${policyId}/mappings`} className="text-muted-foreground hover:text-primary text-xs flex items-center gap-1">
        <LinkIcon className="h-3 w-3" />
        No mappings
      </Link>
    );
  }

  // Group by framework
  const byFramework = mappings.reduce((acc, m) => {
    if (!acc[m.framework_code]) acc[m.framework_code] = [];
    acc[m.framework_code].push(m);
    return acc;
  }, {} as Record<string, ControlMappingSummary[]>);

  const frameworkCodes = Object.keys(byFramework);
  const totalMappings = mappings.length;
  const MAX_DISPLAY = 3;

  return (
    <Link href={`/policies/${policyId}/mappings`} className="block hover:opacity-80">
      <div className="flex flex-wrap gap-1 max-w-xs">
        {frameworkCodes.slice(0, 2).map((fw) => {
          const controls = byFramework[fw];
          const displayControls = controls.slice(0, MAX_DISPLAY);
          const remaining = controls.length - MAX_DISPLAY;

          return (
            <div key={fw} className="flex flex-wrap gap-0.5">
              {displayControls.map((ctrl) => (
                <Badge
                  key={`${fw}-${ctrl.control_code}`}
                  variant={ctrl.coverage === "full" ? "finalized" : ctrl.coverage === "partial" ? "review" : "secondary"}
                  className="text-[10px] px-1 py-0"
                >
                  {ctrl.control_code}
                </Badge>
              ))}
              {remaining > 0 && (
                <Badge variant="outline" className="text-[10px] px-1 py-0">
                  +{remaining}
                </Badge>
              )}
            </div>
          );
        })}
        {frameworkCodes.length > 2 && (
          <Badge variant="outline" className="text-[10px] px-1 py-0">
            +{frameworkCodes.length - 2} frameworks
          </Badge>
        )}
        {totalMappings > 0 && (
          <span className="text-[10px] text-muted-foreground ml-1">
            ({totalMappings} total)
          </span>
        )}
      </div>
    </Link>
  );
}

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    fetchPolicies();
  }, [statusFilter]);

  async function fetchPolicies() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/policies?${params}`);
      const data = await res.json();
      setPolicies(data.policies || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Failed to fetch policies:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchPolicies();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Policies</h1>
        <Link href="/policies/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Policy
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-4">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px]">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search policies..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button type="submit" variant="secondary">Search</Button>
            </form>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-[180px]"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="review">In Review</option>
              <option value="finalized">Finalized</option>
              <option value="archived">Archived</option>
              <option value="revision">Revision</option>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : policies.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No policies found</h3>
              <p className="mt-1 text-muted-foreground">
                {search || statusFilter ? "Try adjusting your filters" : "Get started by creating your first policy"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 pr-4 font-medium">Code</th>
                    <th className="pb-3 pr-4 font-medium">Policy Name</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 pr-4 font-medium">Control Mappings</th>
                    <th className="pb-3 pr-4 font-medium">Version</th>
                    <th className="pb-3 pr-4 font-medium">Owner</th>
                    <th className="pb-3 font-medium">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {policies.map((policy) => (
                    <tr key={policy.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 pr-4">
                        <Link href={`/policies/${policy.id}`} className="font-mono text-xs text-primary hover:underline">
                          {policy.policy_code}
                        </Link>
                      </td>
                      <td className="py-3 pr-4">
                        <Link href={`/policies/${policy.id}`} className="font-medium hover:underline">
                          {policy.policy_name}
                        </Link>
                      </td>
                      <td className="py-3 pr-4">
                        <PolicyStatusBadge status={policy.status} />
                      </td>
                      <td className="py-3 pr-4">
                        <ControlMappingsCell mappings={policy.control_mappings} policyId={policy.id} />
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        v{policy.version_major}.{policy.version_minor}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {policy.owner_name || "-"}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {new Date(policy.updated_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 text-sm text-muted-foreground">
                {total} {total === 1 ? "policy" : "policies"} total
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
