-- Update schema to support ORGANIZATION role
-- This file contains the necessary database changes to support the new organization role

-- Add CHECK constraint to ensure only valid roles are allowed
ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('admin', 'operator', 'viewer', 'organization'));

-- Update RLS policies to allow organizations to insert transactions
DROP POLICY IF EXISTS "Operators can insert transactions" ON ach_transactions;
CREATE POLICY "Authorized users can insert transactions" ON ach_transactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'operator', 'organization')
            AND active = true
        )
    );

-- Keep the update policy restricted to admin/operator only
DROP POLICY IF EXISTS "Operators can update transactions" ON ach_transactions;
CREATE POLICY "Internal users can update transactions" ON ach_transactions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'operator')
            AND active = true
        )
    );

-- Organizations should only be able to view their own submitted transactions
-- First drop existing select policy and create more granular ones
DROP POLICY IF EXISTS "Authenticated users can view transactions" ON ach_transactions;

-- Internal users (admin/operator) can view all transactions
CREATE POLICY "Internal users can view all transactions" ON ach_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'operator')
            AND active = true
        )
    );

-- Organizations can only view transactions they created
-- Note: This assumes we add a created_by column to track who created each transaction
-- For now, organizations will not have view access via database policies
-- This will be handled at the API level

-- Keep NACHA files restricted to internal users only
-- (No changes needed - already restricted to admin/operator)

-- Keep federal holidays and system config restricted to internal users only  
-- (No changes needed - already restricted to admin/operator)

-- Add comment to document the new role
COMMENT ON COLUMN users.role IS 'User role: admin, operator, viewer, or organization. Organizations can only submit transactions via API.';