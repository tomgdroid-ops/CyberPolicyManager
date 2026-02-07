-- Migration 020: Add organization_id to policy_control_mappings table
ALTER TABLE policy_control_mappings ADD COLUMN organization_id UUID REFERENCES organizations(id);

CREATE INDEX idx_mappings_org ON policy_control_mappings(organization_id);
