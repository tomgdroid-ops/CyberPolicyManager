CREATE TABLE IF NOT EXISTS framework_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES frameworks(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES framework_categories(id) ON DELETE CASCADE,
  control_code VARCHAR(100) NOT NULL,
  control_title VARCHAR(500) NOT NULL,
  control_description TEXT,
  implementation_guidance TEXT,
  assessment_procedures JSONB,
  related_controls TEXT[],
  sort_order INT NOT NULL DEFAULT 0,
  UNIQUE(framework_id, control_code)
);

CREATE INDEX IF NOT EXISTS idx_fw_controls_framework ON framework_controls(framework_id);
CREATE INDEX IF NOT EXISTS idx_fw_controls_category ON framework_controls(category_id);
CREATE INDEX IF NOT EXISTS idx_fw_controls_code ON framework_controls(control_code);
