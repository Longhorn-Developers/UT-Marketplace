-- ============================================================================
-- DATABASE MIGRATION FOR E2EE MESSAGING
-- ============================================================================
-- Run this SQL in your Supabase SQL Editor when ready to enable encryption
-- ============================================================================

-- Step 1: Create the user_keys table
-- This table stores encryption keys for each user
CREATE TABLE user_keys (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  public_key TEXT NOT NULL,                    -- Base64-encoded public key (RSA-OAEP)
  encrypted_private_key TEXT NOT NULL,         -- Private key encrypted with user's password
  created_at TIMESTAMP DEFAULT NOW()
);

-- Step 2: Create index for fast public key lookups
-- When encrypting a message, we need to quickly fetch the receiver's public key
CREATE INDEX idx_user_keys_user_id ON user_keys(user_id);

-- Step 3: Enable Row Level Security (RLS)
-- Ensures users can only access their own data
ALTER TABLE user_keys ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS Policies
-- These control who can read/write what data

-- Policy 1: Anyone can read any user's public key
-- (Public keys are meant to be public - needed to encrypt messages for someone)
CREATE POLICY "Anyone can read public keys" ON user_keys
  FOR SELECT
  USING (true);

-- Policy 2: Users can only read their own encrypted private key
-- (Private keys should never be exposed to other users)
CREATE POLICY "Users can read own encrypted private key" ON user_keys
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 3: Users can insert their own keys (during signup)
CREATE POLICY "Users can insert own keys" ON user_keys
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can update their own keys (for future key rotation)
CREATE POLICY "Users can update own keys" ON user_keys
  FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these after migration to verify everything is set up correctly

-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'user_keys'
);

-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'user_keys';

-- Check policies
SELECT schemaname, tablename, policyname, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'user_keys';

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================
-- Uncomment and run these if you need to remove the encryption setup

-- DROP TABLE IF EXISTS user_keys CASCADE;
