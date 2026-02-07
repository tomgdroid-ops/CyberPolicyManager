"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Framework, FrameworkCategory, FrameworkControl } from "@/types/framework";
import { ArrowLeft, Search, ChevronDown, ChevronRight } from "lucide-react";

export default function FrameworkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [framework, setFramework] = useState<(Framework & { categories: FrameworkCategory[] }) | null>(null);
  const [controls, setControls] = useState<FrameworkControl[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedControl, setSelectedControl] = useState<(FrameworkControl & { best_practices?: unknown[] }) | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/frameworks/${id}`).then((r) => r.json()),
      fetch(`/api/frameworks/${id}/controls`).then((r) => r.json()),
    ])
      .then(([fw, ctrls]) => {
        setFramework(fw);
        setControls(ctrls);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!search.trim()) {
      const res = await fetch(`/api/frameworks/${id}/controls`);
      setControls(await res.json());
      return;
    }
    const res = await fetch(`/api/frameworks/${id}/controls?search=${encodeURIComponent(search)}`);
    setControls(await res.json());
  }

  async function loadControlDetail(controlId: string) {
    const res = await fetch(`/api/frameworks/${id}/controls?control_id=${controlId}`);
    const data = await res.json();
    setSelectedControl(data);
  }

  function toggleCategory(catId: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  }

  if (loading) {
    return <div className="h-64 animate-pulse rounded bg-muted" />;
  }

  if (!framework) return null;

  // Group controls by category
  const controlsByCategory = controls.reduce<Record<string, FrameworkControl[]>>((acc, ctrl) => {
    const key = ctrl.category_code || "uncategorized";
    if (!acc[key]) acc[key] = [];
    acc[key].push(ctrl);
    return acc;
  }, {});

  // Get parent categories (no parent_category_id) and subcategories
  const parentCategories = framework.categories.filter((c) => !c.parent_category_id);
  const subcategories = framework.categories.filter((c) => c.parent_category_id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/frameworks">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{framework.name}</h1>
          <p className="text-sm text-muted-foreground">
            {framework.issuing_body} &middot; {framework.total_controls} controls
          </p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search controls..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button type="submit" variant="secondary">Search</Button>
      </form>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-2">
          {parentCategories.map((cat) => {
            const isExpanded = expandedCategories.has(cat.id);
            const childCats = subcategories.filter((s) => s.parent_category_id === cat.id);

            return (
              <Card key={cat.id}>
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50"
                  onClick={() => toggleCategory(cat.id)}
                >
                  <div>
                    <span className="font-mono text-sm text-primary">{cat.category_code}</span>
                    <span className="ml-2 font-medium">{cat.category_name}</span>
                  </div>
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                {isExpanded && (
                  <CardContent className="pt-0">
                    {cat.description && (
                      <p className="text-sm text-muted-foreground mb-4">{cat.description}</p>
                    )}
                    {childCats.length > 0 ? (
                      childCats.map((sub) => (
                        <div key={sub.id} className="mb-4">
                          <h4 className="font-mono text-xs text-muted-foreground mb-2">
                            {sub.category_code} - {sub.category_name}
                          </h4>
                          <div className="space-y-1 pl-2">
                            {(controlsByCategory[sub.category_code] || []).map((ctrl) => (
                              <button
                                key={ctrl.id}
                                onClick={() => loadControlDetail(ctrl.id)}
                                className={`w-full text-left p-2 rounded text-sm hover:bg-muted/50 ${
                                  selectedControl?.id === ctrl.id ? "bg-primary/10 border border-primary/20" : ""
                                }`}
                              >
                                <span className="font-mono text-xs text-primary">{ctrl.control_code}</span>
                                <span className="ml-2">{ctrl.control_title}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="space-y-1">
                        {(controlsByCategory[cat.category_code] || []).map((ctrl) => (
                          <button
                            key={ctrl.id}
                            onClick={() => loadControlDetail(ctrl.id)}
                            className={`w-full text-left p-2 rounded text-sm hover:bg-muted/50 ${
                              selectedControl?.id === ctrl.id ? "bg-primary/10 border border-primary/20" : ""
                            }`}
                          >
                            <span className="font-mono text-xs text-primary">{ctrl.control_code}</span>
                            <span className="ml-2">{ctrl.control_title}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        <div>
          {selectedControl ? (
            <Card className="sticky top-6">
              <CardHeader>
                <Badge variant="outline" className="w-fit">{selectedControl.control_code}</Badge>
                <CardTitle className="text-lg">{selectedControl.control_title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {selectedControl.control_description && (
                  <div>
                    <p className="font-medium text-muted-foreground mb-1">Description</p>
                    <p>{selectedControl.control_description}</p>
                  </div>
                )}
                {selectedControl.implementation_guidance && (
                  <div>
                    <p className="font-medium text-muted-foreground mb-1">Implementation Guidance</p>
                    <p>{selectedControl.implementation_guidance}</p>
                  </div>
                )}
                {selectedControl.assessment_procedures && (
                  <div>
                    <p className="font-medium text-muted-foreground mb-1">Assessment Procedures</p>
                    <ul className="list-disc list-inside space-y-1">
                      {(selectedControl.assessment_procedures as string[]).map((proc, i) => (
                        <li key={i}>{proc}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {(selectedControl as { best_practices?: Array<{ practice_title: string; practice_description: string }> }).best_practices &&
                  ((selectedControl as { best_practices: Array<{ practice_title: string; practice_description: string }> }).best_practices).length > 0 && (
                  <div>
                    <p className="font-medium text-muted-foreground mb-1">Best Practices</p>
                    {((selectedControl as { best_practices: Array<{ practice_title: string; practice_description: string }> }).best_practices).map((bp, i) => (
                      <div key={i} className="mb-2 p-2 rounded bg-muted/50">
                        <p className="font-medium">{bp.practice_title}</p>
                        <p className="text-muted-foreground">{bp.practice_description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Select a control to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
