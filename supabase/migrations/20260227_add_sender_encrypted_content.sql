-- Migration: Add sender_encrypted_content column to messages table
-- Purpose: Enable senders to decrypt their own sent messages across devices
--
-- Background:
-- Messages are encrypted with the receiver's public key, which means
-- the sender cannot decrypt them later (asymmetric encryption).
-- This column stores a copy encrypted with the sender's public key,
-- allowing them to view their sent messages on any device.
--
-- This migration is backwards compatible:
-- - Column is nullable (existing messages will have NULL)
-- - Application code handles NULL gracefully (falls back to cache/placeholder)

ALTER TABLE messages
ADD COLUMN sender_encrypted_content TEXT NULL;

COMMENT ON COLUMN messages.sender_encrypted_content IS
'Message content encrypted with sender''s public key. Allows sender to decrypt their own sent messages across devices. NULL for messages sent before this feature was implemented.';
