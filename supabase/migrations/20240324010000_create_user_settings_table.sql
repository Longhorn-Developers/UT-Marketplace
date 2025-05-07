-- Create user_settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT,
    bio TEXT,
    notification_preferences JSONB DEFAULT '{"email_notifications": true, "browser_notifications": true}'::jsonb,
    profile_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add RLS policies
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Create an auth function to check if the user is authenticated
CREATE OR REPLACE FUNCTION auth.is_authenticated()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN current_setting('request.jwt.claims', TRUE)::jsonb ? 'email';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy to allow users to read their own settings
CREATE POLICY "Enable read access for authenticated users"
    ON public.user_settings
    FOR SELECT
    USING (
        auth.is_authenticated() AND
        email = current_setting('request.jwt.claims', TRUE)::jsonb->>'email'
    );

-- Policy to allow users to update their own settings
CREATE POLICY "Enable update access for authenticated users"
    ON public.user_settings
    FOR UPDATE
    USING (
        auth.is_authenticated() AND
        email = current_setting('request.jwt.claims', TRUE)::jsonb->>'email'
    );

-- Policy to allow users to insert their own settings
CREATE POLICY "Enable insert access for authenticated users"
    ON public.user_settings
    FOR INSERT
    WITH CHECK (
        auth.is_authenticated() AND
        email = current_setting('request.jwt.claims', TRUE)::jsonb->>'email'
    );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 