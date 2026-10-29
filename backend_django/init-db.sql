-- PostgreSQL Initialization script for GFI Nasho 1 Irrigation Management System
-- Runs automatically on container initial boot

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Grant schema permissions
GRANT ALL PRIVILEGES ON DATABASE nasho_irrigation TO nasho_admin;
