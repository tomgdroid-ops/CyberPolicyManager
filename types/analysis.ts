export type AnalysisStatus = "pending" | "running" | "completed" | "failed";

export interface GapItem {
  control_code: string;
  control_title: string;
  category_code: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  remediation: string;
  suggested_policy_type: string;
}

export interface Recommendation {
  priority: number;
  title: string;
  description: string;
  timeframe: "immediate" | "short_term" | "medium_term" | "long_term";
  related_gaps: string[];
}

export interface CategoryScore {
  category_code: string;
  category_name: string;
  score: number;
  total_controls: number;
  fully_covered: number;
  partially_covered: number;
  not_covered: number;
}

export interface AnalysisResult {
  id: string;
  framework_id: string;
  status: AnalysisStatus;
  triggered_by: string | null;
  total_controls: number | null;
  controls_fully_covered: number;
  controls_partially_covered: number;
  controls_not_covered: number;
  overall_score: number | null;
  category_scores: CategoryScore[] | null;
  gaps: GapItem[] | null;
  recommendations: Recommendation[] | null;
  policy_mappings_snapshot: Record<string, unknown> | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  framework_name?: string;
  framework_code?: string;
  triggered_by_name?: string;
}
