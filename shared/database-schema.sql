-- ACH Processing System Database Schema

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'operator', 'viewer')),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ACH Transactions table
CREATE TABLE ach_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id VARCHAR(50) NOT NULL,
    routing_number VARCHAR(9) NOT NULL,
    account_number_encrypted TEXT NOT NULL,
    account_number_hash VARCHAR(64) NOT NULL,
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('checking', 'savings')),
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('debit', 'credit')),
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    effective_date DATE NOT NULL,
    description VARCHAR(100) NOT NULL,
    individual_id VARCHAR(15) NOT NULL,
    individual_name VARCHAR(22) NOT NULL,
    company_name VARCHAR(50),
    company_id VARCHAR(10),
    sender_ip INET NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed', 'cancelled')),
    processed_at TIMESTAMP WITH TIME ZONE,
    nacha_file_id UUID,
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NACHA Files table
CREATE TABLE nacha_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    effective_date DATE NOT NULL,
    total_records INTEGER NOT NULL,
    total_debits DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_credits DECIMAL(15,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) DEFAULT 'generated' CHECK (status IN ('generated', 'transmitted', 'failed')),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    transmitted_at TIMESTAMP WITH TIME ZONE,
    file_content TEXT NOT NULL,
    transaction_ids UUID[] NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System Configuration table
CREATE TABLE system_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT false,
    updated_by UUID NOT NULL REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Federal Holidays table
CREATE TABLE federal_holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    is_recurring BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_ach_transactions_effective_date ON ach_transactions(effective_date);
CREATE INDEX idx_ach_transactions_status ON ach_transactions(status);
CREATE INDEX idx_ach_transactions_created_at ON ach_transactions(created_at);
CREATE INDEX idx_ach_transactions_created_by ON ach_transactions(created_by);
CREATE INDEX idx_nacha_files_effective_date ON nacha_files(effective_date);
CREATE INDEX idx_nacha_files_status ON nacha_files(status);
CREATE INDEX idx_federal_holidays_date ON federal_holidays(date);
CREATE INDEX idx_users_email ON users(email);

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ach_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nacha_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE federal_holidays ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY users_select_own ON users
    FOR SELECT USING (auth.uid() = id);

-- Admins can read all users
CREATE POLICY users_select_admin ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin' 
            AND is_active = true
        )
    );

-- ACH transactions policies
CREATE POLICY ach_transactions_select ON ach_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND is_active = true
        )
    );

CREATE POLICY ach_transactions_insert ON ach_transactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'operator') 
            AND is_active = true
        )
    );

CREATE POLICY ach_transactions_update ON ach_transactions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'operator') 
            AND is_active = true
        )
    );

-- NACHA files policies
CREATE POLICY nacha_files_select ON nacha_files
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND is_active = true
        )
    );

CREATE POLICY nacha_files_insert ON nacha_files
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'operator') 
            AND is_active = true
        )
    );

-- System configs policies (admin only)
CREATE POLICY system_configs_select ON system_configs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin' 
            AND is_active = true
        )
    );

CREATE POLICY system_configs_insert ON system_configs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin' 
            AND is_active = true
        )
    );

CREATE POLICY system_configs_update ON system_configs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin' 
            AND is_active = true
        )
    );

-- Federal holidays policies
CREATE POLICY federal_holidays_select ON federal_holidays
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND is_active = true
        )
    );

CREATE POLICY federal_holidays_insert ON federal_holidays
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin' 
            AND is_active = true
        )
    );

CREATE POLICY federal_holidays_update ON federal_holidays
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin' 
            AND is_active = true
        )
    );

-- Insert default federal holidays for current year
INSERT INTO federal_holidays (name, date, is_recurring) VALUES
    ('New Year''s Day', DATE(EXTRACT(year FROM NOW()) || '-01-01'), true),
    ('Martin Luther King Jr. Day', DATE(EXTRACT(year FROM NOW()) || '-01-15'), true),
    ('Presidents Day', DATE(EXTRACT(year FROM NOW()) || '-02-19'), true),
    ('Memorial Day', DATE(EXTRACT(year FROM NOW()) || '-05-27'), true),
    ('Independence Day', DATE(EXTRACT(year FROM NOW()) || '-07-04'), true),
    ('Labor Day', DATE(EXTRACT(year FROM NOW()) || '-09-02'), true),
    ('Columbus Day', DATE(EXTRACT(year FROM NOW()) || '-10-14'), true),
    ('Veterans Day', DATE(EXTRACT(year FROM NOW()) || '-11-11'), true),
    ('Thanksgiving Day', DATE(EXTRACT(year FROM NOW()) || '-11-28'), true),
    ('Christmas Day', DATE(EXTRACT(year FROM NOW()) || '-12-25'), true);

-- Create a default admin user (password: admin123!)
-- Note: In production, this should be created through a secure process
INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES 
    ('admin@achprocessing.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeAdvpK34Z8bR4QWG', 'System', 'Administrator', 'admin');