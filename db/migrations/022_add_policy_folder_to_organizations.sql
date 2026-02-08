-- Add policy folder path setting to organizations
-- This allows organizations to map a local folder containing their policy documents

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS policy_folder_path TEXT,
ADD COLUMN IF NOT EXISTS policy_folder_sync_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS policy_folder_last_sync TIMESTAMPTZ;

-- Add comment for documentation
COMMENT ON COLUMN organizations.policy_folder_path IS 'Local file system path to policy documents folder';
COMMENT ON COLUMN organizations.policy_folder_sync_enabled IS 'Whether automatic folder sync is enabled';
COMMENT ON COLUMN organizations.policy_folder_last_sync IS 'Timestamp of last folder synchronization';
