# OSINT Dashboard Database Setup

This directory contains SQL scripts for setting up the Supabase database for the OSINT Dashboard application.

## Organization

The SQL scripts are organized in a modular way for easier maintenance and understanding:

1. **00_run_all.sql**: A master script that runs all other scripts in the correct order
2. **01_init.sql**: Initialization script that creates base functions and types
3. **02_auth_tables.sql**: Creates authentication-related tables
4. **03_rls_policies.sql**: Sets up Row Level Security policies for all tables

## How to Use

### Option 1: Run All Scripts
To set up the entire database at once, you can run the master script in the Supabase SQL Editor:

```sql
\i sql/00_run_all.sql
```

### Option 2: Run Individual Scripts
If you prefer to run scripts individually or only need to update specific parts of the database, you can run them separately:

```sql
\i sql/01_init.sql
\i sql/02_auth_tables.sql
\i sql/03_rls_policies.sql
```

## Maintenance

When modifying the database schema:

1. Update the relevant individual script
2. Run only that script to apply the changes
3. Version control the changes

This modular approach makes it easier to manage schema migrations and track changes over time. 