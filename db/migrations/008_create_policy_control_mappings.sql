CREATE TABLE IF NOT EXISTS policy_control_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  control_id UUID NOT NULL REFERENCES framework_controls(id) ON DELETE CASCADE,
  coverage VARCHAR(50) NOT NULL DEFAULT 'full'
    CHECK (coverage IN ('full', 'partial', 'none')),
  notes TEXT,
  is_ai_suggested BOOLEAN NOT NULL DEFAULT false,
  ai_confidence DECIMAL(3,2),
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(policy_id, control_id)
);

CREATE INDEX IF NOT EXISTS idx_mappings_policy ON policy_control_mappings(policy_id);
CREATE INDEX IF NOT EXISTS idx_mappings_control ON policy_control_mappings(control_id);
