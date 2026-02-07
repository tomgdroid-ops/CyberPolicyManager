-- Migration 015: Add organization_id to policies table
ALTER TABLE policies ADD COLUMN organization_id UUID REFERENCES organizations(id);

CREATE INDEX idx_policies_org ON policies(organization_id);
