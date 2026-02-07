-- Migration 016: Add organization_id to analysis_results table
ALTER TABLE analysis_results ADD COLUMN organization_id UUID REFERENCES organizations(id);

CREATE INDEX idx_analysis_org ON analysis_results(organization_id);
