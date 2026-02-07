CREATE TABLE IF NOT EXISTS policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_code VARCHAR(50) NOT NULL,
  policy_name VARCHAR(500) NOT NULL,
  description TEXT,
  scope TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'review', 'finalized', 'archived', 'revision')),
  version_major INT NOT NULL DEFAULT 1,
  version_minor INT NOT NULL DEFAULT 0,
  owner_id UUID REFERENCES users(id),
  author_id UUID REFERENCES users(id),
  department VARCHAR(255),
  classification VARCHAR(100) DEFAULT 'Internal',
  effective_date DATE,
  review_date DATE,
  review_frequency_months INT DEFAULT 12,
  document_filename VARCHAR(500),
  document_path VARCHAR(1000),
  document_hash VARCHAR(128),
  document_size_bytes BIGINT,
  document_content_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);
CREATE INDEX IF NOT EXISTS idx_policies_owner ON policies(owner_id);
CREATE INDEX IF NOT EXISTS idx_policies_code ON policies(policy_code);
CREATE INDEX IF NOT EXISTS idx_policies_review_date ON policies(review_date);
