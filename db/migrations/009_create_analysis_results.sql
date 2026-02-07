CREATE TABLE IF NOT EXISTS analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES frameworks(id),
  status VARCHAR(50) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  triggered_by UUID REFERENCES users(id),
  total_controls INT,
  controls_fully_covered INT DEFAULT 0,
  controls_partially_covered INT DEFAULT 0,
  controls_not_covered INT DEFAULT 0,
  overall_score DECIMAL(5,2),
  category_scores JSONB,
  gaps JSONB,
  recommendations JSONB,
  policy_mappings_snapshot JSONB,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analysis_framework ON analysis_results(framework_id);
CREATE INDEX IF NOT EXISTS idx_analysis_status ON analysis_results(status);
CREATE INDEX IF NOT EXISTS idx_analysis_created ON analysis_results(created_at DESC);
