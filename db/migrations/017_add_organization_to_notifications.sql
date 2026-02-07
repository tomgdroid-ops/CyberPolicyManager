-- Migration 017: Add organization_id to notifications table
ALTER TABLE notifications ADD COLUMN organization_id UUID REFERENCES organizations(id);

CREATE INDEX idx_notifications_org ON notifications(organization_id);
