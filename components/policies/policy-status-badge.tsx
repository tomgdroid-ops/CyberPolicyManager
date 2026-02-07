import { Badge } from "@/components/ui/badge";
import { PolicyStatus } from "@/types/policy";

const statusConfig: Record<PolicyStatus, { label: string; variant: "draft" | "review" | "finalized" | "archived" | "revision" }> = {
  draft: { label: "Draft", variant: "draft" },
  review: { label: "In Review", variant: "review" },
  finalized: { label: "Finalized", variant: "finalized" },
  archived: { label: "Archived", variant: "archived" },
  revision: { label: "Revision", variant: "revision" },
};

export function PolicyStatusBadge({ status }: { status: PolicyStatus }) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
