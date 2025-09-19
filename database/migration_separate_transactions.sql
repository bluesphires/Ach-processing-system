-- Migration: Separate Debit and Credit Transactions
-- This migration creates a new structure to store debits and credits as separate transaction entries
-- while maintaining their association and allowing different effective dates

-- Create transaction_entries table for individual debit/credit entries
CREATE TABLE IF NOT EXISTS transaction_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_transaction_id UUID NOT NULL, -- Links related DR/CR entries
    entry_type VARCHAR(2) NOT NULL CHECK (entry_type IN ('DR', 'CR')),
    
    -- Account Information (specific to this entry)
    routing_number VARCHAR(9) NOT NULL,
    account_number_encrypted TEXT NOT NULL,
    account_id VARCHAR(15) NOT NULL,
    account_name VARCHAR(22) NOT NULL,
    
    -- Transaction Details
    amount DECIMAL(12,2) NOT NULL,
    effective_date DATE NOT NULL,
    
    -- Metadata
    sender_ip INET,
    sender_details TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_amount_positive CHECK (amount > 0),
    CONSTRAINT chk_status_valid CHECK (status IN ('pending', 'processed', 'failed', 'cancelled')),
    CONSTRAINT chk_routing_number CHECK (routing_number ~ '^\d{9}$'),
    CONSTRAINT chk_entry_type CHECK (entry_type IN ('DR', 'CR'))
);

-- Create transaction_groups table to maintain the relationship between DR and CR entries
CREATE TABLE IF NOT EXISTS transaction_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dr_entry_id UUID REFERENCES transaction_entries(id),
    cr_entry_id UUID REFERENCES transaction_entries(id),
    
    -- Original transaction metadata
    sender_ip INET,
    sender_details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure both DR and CR entries exist
    CONSTRAINT chk_dr_cr_entries CHECK (dr_entry_id IS NOT NULL AND cr_entry_id IS NOT NULL),
    CONSTRAINT unique_dr_entry UNIQUE (dr_entry_id),
    CONSTRAINT unique_cr_entry UNIQUE (cr_entry_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_transaction_entries_parent_id ON transaction_entries(parent_transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_entries_effective_date ON transaction_entries(effective_date);
CREATE INDEX IF NOT EXISTS idx_transaction_entries_status ON transaction_entries(status);
CREATE INDEX IF NOT EXISTS idx_transaction_entries_entry_type ON transaction_entries(entry_type);
CREATE INDEX IF NOT EXISTS idx_transaction_entries_created_at ON transaction_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_transaction_groups_dr_entry ON transaction_groups(dr_entry_id);
CREATE INDEX IF NOT EXISTS idx_transaction_groups_cr_entry ON transaction_groups(cr_entry_id);

-- Add trigger for updating timestamps
CREATE TRIGGER update_transaction_entries_updated_at 
    BEFORE UPDATE ON transaction_entries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transaction_groups_updated_at 
    BEFORE UPDATE ON transaction_groups 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security for new tables
ALTER TABLE transaction_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_groups ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transaction_entries
CREATE POLICY "Authenticated users can view transaction entries" ON transaction_entries
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Operators can insert transaction entries" ON transaction_entries
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'operator')
            AND active = true
        )
    );

CREATE POLICY "Operators can update transaction entries" ON transaction_entries
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'operator')
            AND active = true
        )
    );

-- RLS Policies for transaction_groups
CREATE POLICY "Authenticated users can view transaction groups" ON transaction_groups
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Operators can manage transaction groups" ON transaction_groups
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'operator')
            AND active = true
        )
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON transaction_entries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON transaction_groups TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;