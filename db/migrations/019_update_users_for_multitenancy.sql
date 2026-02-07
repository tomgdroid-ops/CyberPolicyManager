-- Migration 019: Update users table for multi-tenancy
-- Add is_super_admin flag and remove single-tenant role column

ALTER TABLE users ADD COLUMN is_super_admin BOOLEAN NOT NULL DEFAULT false;

-- Drop the old role constraint and column (roles now managed via organization_members)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users DROP COLUMN IF EXISTS role;
