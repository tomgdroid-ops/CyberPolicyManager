"use client";

import { Button } from "@/components/ui/button";
import { PolicyStatus, VALID_TRANSITIONS } from "@/types/policy";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const actionConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; endpoint: string }> = {
  review: { label: "Submit for Review", variant: "default", endpoint: "submit" },
  draft: { label: "Return to Draft", variant: "outline", endpoint: "reject" },
  finalized: { label: "Approve & Finalize", variant: "default", endpoint: "approve" },
  archived: { label: "Archive", variant: "secondary", endpoint: "archive" },
  revision: { label: "Start Revision", variant: "outline", endpoint: "revise" },
};

export function PolicyStatusActions({ policyId, currentStatus }: { policyId: string; currentStatus: PolicyStatus }) {
  const { addToast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [comment, setComment] = useState("");

  const validNextStatuses = VALID_TRANSITIONS[currentStatus];

  async function executeAction(targetStatus: string) {
    const config = actionConfig[targetStatus];
    if (!config) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/policies/${policyId}/${config.endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: comment || undefined }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Action failed");
      }

      addToast({ title: `Policy ${config.label.toLowerCase()}d successfully` });
      setDialogOpen(false);
      setComment("");
      setPendingAction(null);
      router.refresh();
      // Force a hard refresh of the page data
      window.location.reload();
    } catch (error) {
      addToast({
        title: "Error",
        description: error instanceof Error ? error.message : "Action failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function handleActionClick(targetStatus: string) {
    setPendingAction(targetStatus);
    setComment("");
    setDialogOpen(true);
  }

  if (validNextStatuses.length === 0) return null;

  return (
    <>
      <div className="flex gap-2">
        {validNextStatuses.map((targetStatus) => {
          const config = actionConfig[targetStatus];
          if (!config) return null;
          return (
            <Button
              key={targetStatus}
              variant={config.variant}
              onClick={() => handleActionClick(targetStatus)}
              disabled={loading}
              size="sm"
            >
              {config.label}
            </Button>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onClose={() => setDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>
              {pendingAction && actionConfig[pendingAction]?.label}
            </DialogTitle>
            <DialogDescription>
              Add an optional comment for this status change.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Optional comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => pendingAction && executeAction(pendingAction)}
              disabled={loading}
            >
              {loading ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
