"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { PolicyControlMapping, Framework, FrameworkControl } from "@/types/framework";
import { ArrowLeft, Plus, Trash2, Search, CheckCircle, Bot } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function PolicyMappingsPage() {
  const { id } = useParams<{ id: string }>();
  const { addToast } = useToast();
  const [mappings, setMappings] = useState<PolicyControlMapping[]>([]);
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [loading, setLoading] = useState(true);

  // Add mapping dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState("");
  const [controls, setControls] = useState<FrameworkControl[]>([]);
  const [controlSearch, setControlSearch] = useState("");
  const [selectedControl, setSelectedControl] = useState("");
  const [coverage, setCoverage] = useState("full");
  const [notes, setNotes] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  async function fetchData() {
    try {
      const [mappingsRes, frameworksRes] = await Promise.all([
        fetch(`/api/policies/${id}/mappings`),
        fetch("/api/frameworks"),
      ]);
      setMappings(await mappingsRes.json());
      setFrameworks(await frameworksRes.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function searchControls() {
    if (!selectedFramework) return;
    const params = new URLSearchParams();
    if (controlSearch) params.set("search", controlSearch);
    const res = await fetch(`/api/frameworks/${selectedFramework}/controls?${params}`);
    setControls(await res.json());
  }

  useEffect(() => {
    if (selectedFramework) searchControls();
  }, [selectedFramework]);

  async function addMapping() {
    if (!selectedControl) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/policies/${id}/mappings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ control_id: selectedControl, coverage, notes }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      addToast({ title: "Mapping added" });
      setDialogOpen(false);
      setSelectedControl("");
      setNotes("");
      fetchData();
    } catch (error) {
      addToast({ title: "Error", description: error instanceof Error ? error.message : "Failed", variant: "destructive" });
    } finally {
      setAdding(false);
    }
  }

  async function removeMapping(mappingId: string) {
    if (!confirm("Remove this mapping?")) return;
    try {
      await fetch(`/api/policies/${id}/mappings/${mappingId}`, { method: "DELETE" });
      addToast({ title: "Mapping removed" });
      fetchData();
    } catch {
      addToast({ title: "Error removing mapping", variant: "destructive" });
    }
  }

  async function verifyMapping(mappingId: string) {
    try {
      await fetch(`/api/policies/${id}/mappings/${mappingId}`, { method: "PATCH" });
      addToast({ title: "Mapping verified" });
      fetchData();
    } catch {
      addToast({ title: "Error verifying mapping", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/policies/${id}`}>
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <h1 className="text-2xl font-bold">Control Mappings</h1>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Mapping
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{mappings.length} Control Mapping{mappings.length !== 1 ? "s" : ""}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-12 animate-pulse rounded bg-muted" />)}
            </div>
          ) : mappings.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              No control mappings yet. Add manual mappings or run an AI analysis to auto-map controls.
            </p>
          ) : (
            <div className="space-y-2">
              {mappings.map((m) => (
                <div key={m.id} className="flex items-start justify-between p-3 rounded border">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-primary">{m.control_code}</span>
                      <span className="text-sm font-medium">{m.control_title}</span>
                      <Badge variant={m.coverage === "full" ? "finalized" : m.coverage === "partial" ? "review" : "draft"}>
                        {m.coverage}
                      </Badge>
                      {m.is_ai_suggested && (
                        <Badge variant="secondary"><Bot className="mr-1 h-3 w-3" />AI</Badge>
                      )}
                      {m.verified_by && (
                        <Badge variant="outline"><CheckCircle className="mr-1 h-3 w-3" />Verified</Badge>
                      )}
                    </div>
                    {m.notes && <p className="text-xs text-muted-foreground mt-1">{m.notes}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      {(m as PolicyControlMapping & { framework_name?: string }).framework_name}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {m.is_ai_suggested && !m.verified_by && (
                      <Button variant="outline" size="sm" onClick={() => verifyMapping(m.id)}>
                        <CheckCircle className="h-3 w-3" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => removeMapping(m.id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onClose={() => setDialogOpen(false)} className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Control Mapping</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Framework</label>
              <Select value={selectedFramework} onChange={(e) => setSelectedFramework(e.target.value)}>
                <option value="">Select framework...</option>
                {frameworks.map((fw) => (
                  <option key={fw.id} value={fw.id}>{fw.name}</option>
                ))}
              </Select>
            </div>
            {selectedFramework && (
              <>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search controls..."
                      value={controlSearch}
                      onChange={(e) => setControlSearch(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && searchControls()}
                      className="pl-9"
                    />
                  </div>
                  <Button variant="secondary" onClick={searchControls}>Search</Button>
                </div>
                <div className="max-h-48 overflow-y-auto border rounded">
                  {controls.map((ctrl) => (
                    <button
                      key={ctrl.id}
                      onClick={() => setSelectedControl(ctrl.id)}
                      className={`w-full text-left p-2 text-sm hover:bg-muted/50 border-b last:border-0 ${
                        selectedControl === ctrl.id ? "bg-primary/10" : ""
                      }`}
                    >
                      <span className="font-mono text-xs text-primary">{ctrl.control_code}</span>
                      <span className="ml-2">{ctrl.control_title}</span>
                    </button>
                  ))}
                  {controls.length === 0 && (
                    <p className="p-4 text-center text-sm text-muted-foreground">No controls found</p>
                  )}
                </div>
              </>
            )}
            <div>
              <label className="text-sm font-medium">Coverage</label>
              <Select value={coverage} onChange={(e) => setCoverage(e.target.value)}>
                <option value="full">Full</option>
                <option value="partial">Partial</option>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Input placeholder="Optional notes..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={addMapping} disabled={!selectedControl || adding}>
              {adding ? "Adding..." : "Add Mapping"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
