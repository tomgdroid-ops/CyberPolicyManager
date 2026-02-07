export type PolicyStatus = "draft" | "review" | "finalized" | "archived" | "revision";

export interface Policy {
  id: string;
  policy_code: string;
  policy_name: string;
  description: string | null;
  scope: string | null;
  status: PolicyStatus;
  version_major: number;
  version_minor: number;
  owner_id: string | null;
  author_id: string | null;
  department: string | null;
  classification: string | null;
  effective_date: string | null;
  review_date: string | null;
  review_frequency_months: number;
  document_filename: string | null;
  document_path: string | null;
  document_hash: string | null;
  document_size_bytes: number | null;
  document_content_text: string | null;
  created_at: string;
  updated_at: string;
  owner_name?: string;
  author_name?: string;
}

export interface CreatePolicyInput {
  policy_code: string;
  policy_name: string;
  description?: string;
  scope?: string;
  owner_id?: string;
  department?: string;
  classification?: string;
  effective_date?: string;
  review_date?: string;
  review_frequency_months?: number;
}

export interface UpdatePolicyInput extends Partial<CreatePolicyInput> {}

export interface PolicyVersion {
  id: string;
  policy_id: string;
  version_major: number;
  version_minor: number;
  policy_name: string;
  description: string | null;
  status: PolicyStatus;
  document_filename: string | null;
  changed_by: string | null;
  change_action: string;
  change_comment: string | null;
  snapshot: Record<string, unknown> | null;
  created_at: string;
  changed_by_name?: string;
}

export const VALID_TRANSITIONS: Record<PolicyStatus, PolicyStatus[]> = {
  draft: ["review"],
  review: ["draft", "finalized"],
  finalized: ["archived", "revision"],
  archived: [],
  revision: ["review"],
};
