-- Baseline migration for the remixed project.
-- The database already contains the full application schema (profiles, wallets,
-- transactions, categories, banners, announcements, user_roles, admin_audit,
-- account_status, feature_flags, reminder_settings), provisioned with the remix.
-- This migration intentionally changes nothing; it establishes migration 0000
-- as the starting point for all future schema changes on this project.
COMMENT ON SCHEMA public IS 'NataKas application schema (baseline established after remix)';