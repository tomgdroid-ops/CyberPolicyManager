-- Migration 021: Create default organization and migrate existing data

-- Create default organization for existing data
INSERT INTO organizations (id, name, slug, description, industry)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Default Organization',
  'default',
  'Default organization for migrated data',
  'General'
);

-- Migrate existing policies to default org
UPDATE policies SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;

-- Migrate existing analysis results
UPDATE analysis_results SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;

-- Migrate existing notifications
UPDATE notifications SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;

-- Migrate existing audit logs
UPDATE audit_log SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;

-- Migrate existing mappings
UPDATE policy_control_mappings SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;

-- Make organization_id NOT NULL after migration for key tables
ALTER TABLE policies ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE analysis_results ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE policy_control_mappings ALTER COLUMN organization_id SET NOT NULL;

-- Make first user (admin) a super_admin and add to default org
UPDATE users SET is_super_admin = true WHERE email = 'admin@policyvault.com';

-- Also make any existing admin users super_admin (in case email differs)
UPDATE users SET is_super_admin = true WHERE id = (SELECT id FROM users ORDER BY created_at ASC LIMIT 1);

-- Add first user to default organization as org_admin
INSERT INTO organization_members (organization_id, user_id, role, is_primary)
SELECT '00000000-0000-0000-0000-000000000001', id, 'org_admin', true
FROM users
WHERE is_super_admin = true
ON CONFLICT (organization_id, user_id) DO NOTHING;
