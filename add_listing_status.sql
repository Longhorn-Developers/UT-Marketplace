-- Add status field to listings table
-- This field will control the approval workflow for listings

-- Check if status column doesn't exist and add it
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'status') THEN
        ALTER TABLE listings 
        ADD COLUMN status VARCHAR(20) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'approved', 'denied'));
        
        -- Set existing listings to approved (maintain current functionality)
        UPDATE listings SET status = 'approved';
    END IF;
END $$;

-- Check if denial_reason column doesn't exist and add it
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'denial_reason') THEN
        ALTER TABLE listings 
        ADD COLUMN denial_reason TEXT;
    END IF;
END $$;

-- Create index for faster queries on status (only if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);

-- Create partial index for common queries (only if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_listings_approved_not_sold ON listings(status, is_sold) 
WHERE status = 'approved' AND is_sold = false;