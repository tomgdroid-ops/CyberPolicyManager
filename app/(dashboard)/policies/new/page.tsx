"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewPolicyPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const body = {
      policy_code: formData.get("policy_code"),
      policy_name: formData.get("policy_name"),
      description: formData.get("description") || undefined,
      scope: formData.get("scope") || undefined,
      department: formData.get("department") || undefined,
      classification: formData.get("classification") || undefined,
      effective_date: formData.get("effective_date") || undefined,
      review_date: formData.get("review_date") || undefined,
      review_frequency_months: formData.get("review_frequency_months")
        ? parseInt(formData.get("review_frequency_months") as string)
        : undefined,
    };

    try {
      const res = await fetch("/api/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create policy");
      }

      const policy = await res.json();
      addToast({ title: "Policy created successfully" });
      router.push(`/policies/${policy.id}`);
    } catch (error) {
      addToast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create policy",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/policies">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">New Policy</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Policy Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="policy_code">Policy Code *</Label>
                <Input id="policy_code" name="policy_code" placeholder="e.g., ISP-001" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input id="department" name="department" placeholder="e.g., Information Security" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="policy_name">Policy Name *</Label>
              <Input id="policy_name" name="policy_name" placeholder="e.g., Information Security Policy" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="Brief description of this policy..." rows={3} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scope">Scope</Label>
              <Textarea id="scope" name="scope" placeholder="Who does this policy apply to?" rows={2} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="classification">Classification</Label>
                <Select id="classification" name="classification" defaultValue="Internal">
                  <option value="Public">Public</option>
                  <option value="Internal">Internal</option>
                  <option value="Confidential">Confidential</option>
                  <option value="Restricted">Restricted</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="effective_date">Effective Date</Label>
                <Input id="effective_date" name="effective_date" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="review_date">Review Date</Label>
                <Input id="review_date" name="review_date" type="date" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="review_frequency_months">Review Frequency (months)</Label>
              <Input
                id="review_frequency_months"
                name="review_frequency_months"
                type="number"
                min="1"
                max="60"
                defaultValue="12"
                className="w-32"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Policy"}
              </Button>
              <Link href="/policies">
                <Button variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
