CREATE TABLE IF NOT EXISTS policy_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  version_major INT NOT NULL,
  version_minor INT NOT NULL,
  policy_name VARCHAR(500) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL,
  document_filename VARCHAR(500),
  document_path VARCHAR(1000),
  changed_by UUID REFERENCES users(id),
  change_action VARCHAR(100) NOT NULL,
  change_comment TEXT,
  snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_policy_versions_policy ON policy_versions(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_versions_created ON policy_versions(created_at);
