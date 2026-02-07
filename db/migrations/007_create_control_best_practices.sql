CREATE TABLE IF NOT EXISTS control_best_practices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  control_id UUID NOT NULL REFERENCES framework_controls(id) ON DELETE CASCADE,
  practice_title VARCHAR(500) NOT NULL,
  practice_description TEXT,
  implementation_steps JSONB,
  evidence_examples JSONB,
  common_pitfalls JSONB,
  source VARCHAR(500),
  sort_order INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_best_practices_control ON control_best_practices(control_id);
