-- Migration 018: Add organization_id to audit_log table
ALTER TABLE audit_log ADD COLUMN organization_id UUID REFERENCES organizations(id);

CREATE INDEX idx_audit_org ON audit_log(organization_id);
