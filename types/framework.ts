export interface Framework {
  id: string;
  code: string;
  name: string;
  version: string | null;
  release_date: string | null;
  issuing_body: string | null;
  description: string | null;
  industry_applicability: string[];
  total_controls: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FrameworkCategory {
  id: string;
  framework_id: string;
  category_code: string;
  category_name: string;
  description: string | null;
  parent_category_id: string | null;
  sort_order: number;
  children?: FrameworkCategory[];
}

export interface FrameworkControl {
  id: string;
  framework_id: string;
  category_id: string;
  control_code: string;
  control_title: string;
  control_description: string | null;
  implementation_guidance: string | null;
  assessment_procedures: string[] | null;
  related_controls: string[] | null;
  sort_order: number;
  category_code?: string;
  category_name?: string;
}

export interface ControlBestPractice {
  id: string;
  control_id: string;
  practice_title: string;
  practice_description: string | null;
  implementation_steps: string[] | null;
  evidence_examples: string[] | null;
  common_pitfalls: string[] | null;
  source: string | null;
  sort_order: number;
}

export interface PolicyControlMapping {
  id: string;
  policy_id: string;
  control_id: string;
  coverage: "full" | "partial" | "none";
  notes: string | null;
  is_ai_suggested: boolean;
  ai_confidence: number | null;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  control_code?: string;
  control_title?: string;
  policy_name?: string;
}
