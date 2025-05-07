-- Create storage bucket for profile images
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policy to allow authenticated users to upload their own images
CREATE POLICY "Users can upload their own profile image"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'profile-images' AND
        (storage.foldername(name))[1] = auth.jwt() ->> 'email'
    );

-- Allow public access to profile images
CREATE POLICY "Profile images are publicly accessible"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'profile-images');

-- Allow users to update/delete their own images
CREATE POLICY "Users can update their own profile image"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'profile-images' AND
        (storage.foldername(name))[1] = auth.jwt() ->> 'email'
    );

CREATE POLICY "Users can delete their own profile image"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'profile-images' AND
        (storage.foldername(name))[1] = auth.jwt() ->> 'email'
    ); 