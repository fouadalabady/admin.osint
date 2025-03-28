-- OSINT Dashboard Complete Database Setup Script
-- This file runs all the SQL scripts in correct order

-- Display start message
SELECT 'Starting OSINT Dashboard database setup...' as message;

-- Run initialization script
\i sql/01_init.sql

-- Run authentication tables script
\i sql/02_auth_tables.sql

-- Run RLS policies script
\i sql/03_rls_policies.sql

-- Verify successful setup
SELECT
    'Database setup completed successfully!' as result,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'otp_verifications') AS otp_verifications_exists,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_registration_requests') AS user_registration_requests_exists,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'password_reset_verifications') AS password_reset_verifications_exists; 