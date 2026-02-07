CREATE TABLE IF NOT EXISTS framework_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES frameworks(id) ON DELETE CASCADE,
  category_code VARCHAR(50) NOT NULL,
  category_name VARCHAR(500) NOT NULL,
  description TEXT,
  parent_category_id UUID REFERENCES framework_categories(id),
  sort_order INT NOT NULL DEFAULT 0,
  UNIQUE(framework_id, category_code)
);

CREATE INDEX IF NOT EXISTS idx_fw_categories_framework ON framework_categories(framework_id);
