"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PolicyStatusBadge } from "@/components/policies/policy-status-badge";
import { PolicyStatusActions } from "@/components/policies/policy-status-actions";
import { Policy } from "@/types/policy";
import { useToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  ArrowLeft,
  FileText,
  Clock,
  User,
  Upload,
  History,
  Link2,
  Trash2,
  Save,
} from "lucide-react";

export default function PolicyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { addToast } = useToast();
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchPolicy();
  }, [id]);

  async function fetchPolicy() {
    try {
      const res = await fetch(`/api/policies/${id}`);
      if (!res.ok) throw new Error("Not found");
      setPolicy(await res.json());
    } catch {
      addToast({ title: "Policy not found", variant: "destructive" });
      router.push("/policies");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    const body = {
      policy_code: formData.get("policy_code"),
      policy_name: formData.get("policy_name"),
      description: formData.get("description") || null,
      scope: formData.get("scope") || null,
      department: formData.get("department") || null,
      classification: formData.get("classification"),
      effective_date: formData.get("effective_date") || null,
      review_date: formData.get("review_date") || null,
      review_frequency_months: formData.get("review_frequency_months")
        ? parseInt(formData.get("review_frequency_months") as string)
        : 12,
    };

    try {
      const res = await fetch(`/api/policies/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Save failed");
      const updated = await res.json();
      setPolicy(updated);
      setEditing(false);
      addToast({ title: "Policy saved" });
    } catch (error) {
      addToast({ title: "Error", description: error instanceof Error ? error.message : "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = [".docx", ".pdf"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!allowed.includes(ext)) {
      addToast({ title: "Invalid file type", description: "Only .docx and .pdf files are accepted", variant: "destructive" });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/policies/${id}/upload`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error((await res.json()).error || "Upload failed");
      addToast({ title: "Document uploaded and parsed" });
      fetchPolicy();
    } catch (error) {
      addToast({ title: "Upload failed", description: error instanceof Error ? error.message : "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this policy? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/policies/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Delete failed");
      addToast({ title: "Policy deleted" });
      router.push("/policies");
    } catch (error) {
      addToast({ title: "Error", description: error instanceof Error ? error.message : "Delete failed", variant: "destructive" });
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (!policy) return null;

  const isEditable = policy.status === "draft" || policy.status === "revision";

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/policies">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{policy.policy_name}</h1>
            <PolicyStatusBadge status={policy.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {policy.policy_code} &middot; v{policy.version_major}.{policy.version_minor}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <PolicyStatusActions policyId={policy.id} currentStatus={policy.status} />
        {isEditable && !editing && (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit</Button>
        )}
        {isEditable && (
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="mr-1 h-3 w-3" /> Delete
          </Button>
        )}
        <Link href={`/policies/${id}/history`}>
          <Button variant="outline" size="sm">
            <History className="mr-1 h-3 w-3" /> History
          </Button>
        </Link>
        <Link href={`/policies/${id}/mappings`}>
          <Button variant="outline" size="sm">
            <Link2 className="mr-1 h-3 w-3" /> Control Mappings
          </Button>
        </Link>
      </div>

      {editing && isEditable ? (
        <Card>
          <CardHeader><CardTitle>Edit Policy</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Policy Code</Label>
                  <Input name="policy_code" defaultValue={policy.policy_code} required />
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input name="department" defaultValue={policy.department || ""} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Policy Name</Label>
                <Input name="policy_name" defaultValue={policy.policy_name} required />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea name="description" defaultValue={policy.description || ""} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Scope</Label>
                <Textarea name="scope" defaultValue={policy.scope || ""} rows={2} />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Classification</Label>
                  <Select name="classification" defaultValue={policy.classification || "Internal"}>
                    <option value="Public">Public</option>
                    <option value="Internal">Internal</option>
                    <option value="Confidential">Confidential</option>
                    <option value="Restricted">Restricted</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Effective Date</Label>
                  <Input name="effective_date" type="date" defaultValue={policy.effective_date?.substring(0, 10) || ""} />
                </div>
                <div className="space-y-2">
                  <Label>Review Date</Label>
                  <Input name="review_date" type="date" defaultValue={policy.review_date?.substring(0, 10) || ""} />
                </div>
              </div>
              <Input name="review_frequency_months" type="hidden" defaultValue={policy.review_frequency_months} />
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={saving}>
                  <Save className="mr-1 h-3 w-3" /> {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button variant="outline" type="button" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              {policy.description && (
                <div>
                  <p className="font-medium text-muted-foreground">Description</p>
                  <p>{policy.description}</p>
                </div>
              )}
              {policy.scope && (
                <div>
                  <p className="font-medium text-muted-foreground">Scope</p>
                  <p>{policy.scope}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium text-muted-foreground">Department</p>
                  <p>{policy.department || "-"}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Classification</p>
                  <p>{policy.classification || "-"}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Effective Date</p>
                  <p>{policy.effective_date ? new Date(policy.effective_date).toLocaleDateString() : "-"}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Review Date</p>
                  <p>{policy.review_date ? new Date(policy.review_date).toLocaleDateString() : "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Document</CardTitle></CardHeader>
            <CardContent>
              {policy.document_filename ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{policy.document_filename}</span>
                  </div>
                  {policy.document_size_bytes && (
                    <p className="text-sm text-muted-foreground">
                      {(policy.document_size_bytes / 1024).toFixed(1)} KB
                    </p>
                  )}
                  {policy.document_content_text && (
                    <p className="text-sm text-green-600">Text extracted successfully</p>
                  )}
                  {isEditable && (
                    <div>
                      <label className="cursor-pointer inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-accent">
                        <Upload className="mr-1 h-3 w-3" />
                        {uploading ? "Uploading..." : "Replace Document"}
                        <input type="file" accept=".docx,.pdf" onChange={handleUpload} className="hidden" disabled={uploading} />
                      </label>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">No document uploaded</p>
                  {isEditable && (
                    <label className="cursor-pointer mt-3 inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-accent">
                      <Upload className="mr-1 h-3 w-3" />
                      {uploading ? "Uploading..." : "Upload Document"}
                      <input type="file" accept=".docx,.pdf" onChange={handleUpload} className="hidden" disabled={uploading} />
                    </label>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Metadata</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" /> Owner
                  </p>
                  <p>{policy.owner_name || "-"}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" /> Author
                  </p>
                  <p>{policy.author_name || "-"}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Created
                  </p>
                  <p>{new Date(policy.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Updated
                  </p>
                  <p>{new Date(policy.updated_at).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
