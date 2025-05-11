"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import { Camera, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '../context/AuthContext';

interface UserSettings {
  display_name: string;
  bio: string;
  notification_preferences: {
    email_notifications: boolean;
    browser_notifications: boolean;
  };
  profile_image_url: string | null;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [settings, setSettings] = useState<UserSettings>({
    display_name: '',
    bio: '',
    notification_preferences: {
      email_notifications: true,
      browser_notifications: true,
    },
    profile_image_url: null,
  });

  useEffect(() => {
    if (!user?.email) {
      router.push('/auth/signin');
      return;
    }
    fetchUserSettings();
  }, [user]);

  const fetchUserSettings = async () => {
    if (!user?.email) return;

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('email', user.email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // If settings don't exist, create them with default values
          const defaultSettings = {
            email: user.email,
            display_name: user.user_metadata?.name || user.email.split('@')[0],
            bio: '',
            notification_preferences: {
              email_notifications: true,
              browser_notifications: true,
            },
            profile_image_url: null,
          };

          const { error: insertError } = await supabase
            .from('user_settings')
            .insert(defaultSettings);
          
          if (insertError) {
            console.error('Error creating initial user settings:', insertError);
            return;
          }
          
          // Fetch the newly created settings
          const { data: newData } = await supabase
            .from('user_settings')
            .select('*')
            .eq('email', user.email)
            .single();
            
          if (newData) {
            setSettings(newData);
          }
        } else {
          console.error('Error fetching user settings:', error);
        }
      } else if (data) {
        // Ensure all fields have default values if they're null
        const settingsWithDefaults = {
          ...data,
          display_name: data.display_name || user.user_metadata?.name || user.email.split('@')[0],
          bio: data.bio || '',
          notification_preferences: {
            email_notifications: data.notification_preferences?.email_notifications ?? true,
            browser_notifications: data.notification_preferences?.browser_notifications ?? true,
          },
          profile_image_url: data.profile_image_url || null,
        };
        setSettings(settingsWithDefaults);
      }
    } catch (error) {
      console.error('Error in fetchUserSettings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.email) return;

    try {
      setImageUploading(true);

      // Validate file size
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('File size must be less than 10MB');
      }

      // Create a clean filename
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];
      
      if (!fileExt || !allowedExtensions.includes(fileExt)) {
        throw new Error('Invalid file type. Please upload a JPG, PNG, or GIF file.');
      }

      const fileName = `${user.email.replace('@', '-at-')}-${Date.now()}.${fileExt}`;
      
      // Upload image to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName);

      // Delete old profile image if it exists
      if (settings.profile_image_url) {
        const oldFileName = settings.profile_image_url.split('/').pop();
        if (oldFileName) {
          await supabase.storage
            .from('profile-images')
            .remove([oldFileName]);
        }
      }

      // Update user settings with new image URL
      const { error: updateError } = await supabase
        .from('user_settings')
        .upsert({
          email: user.email,
          profile_image_url: publicUrl,
          ...settings,
        });

      if (updateError) {
        throw updateError;
      }

      setSettings(prev => ({ ...prev, profile_image_url: publicUrl }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload image. Please try again.');
    } finally {
      setImageUploading(false);
    }
  };

  const saveSettings = async () => {
    if (!user?.email) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          email: user.email,
          ...settings,
        });

      if (error) throw error;
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#bf5700]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile</h2>

        {/* Profile Picture */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profile Picture
          </label>
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100">
              {settings.profile_image_url ? (
                <Image
                  src={settings.profile_image_url}
                  alt="Profile"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Camera size={32} />
                </div>
              )}
            </div>
            <div>
              <label className="block">
                <span className="sr-only">Choose profile photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={imageUploading}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-[#bf5700] file:text-white
                    hover:file:bg-[#a54700]
                    disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </label>
              <p className="mt-1 text-sm text-gray-500">
                PNG, JPG, GIF up to 10MB
              </p>
            </div>
          </div>
        </div>

        {/* Display Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Display Name
          </label>
          <input
            type="text"
            value={settings.display_name}
            onChange={(e) => setSettings(prev => ({ ...prev, display_name: e.target.value }))}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bf5700]"
            placeholder="Enter your display name"
          />
        </div>

        {/* Bio */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bio
          </label>
          <textarea
            value={settings.bio}
            onChange={(e) => setSettings(prev => ({ ...prev, bio: e.target.value }))}
            rows={4}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bf5700]"
            placeholder="Tell us about yourself"
          />
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Notifications</h2>
        
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.notification_preferences.email_notifications}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                notification_preferences: {
                  ...prev.notification_preferences,
                  email_notifications: e.target.checked,
                },
              }))}
              className="rounded border-gray-300 text-[#bf5700] focus:ring-[#bf5700]"
            />
            <span className="ml-2 text-gray-700">Email Notifications</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.notification_preferences.browser_notifications}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                notification_preferences: {
                  ...prev.notification_preferences,
                  browser_notifications: e.target.checked,
                },
              }))}
              className="rounded border-gray-300 text-[#bf5700] focus:ring-[#bf5700]"
            />
            <span className="ml-2 text-gray-700">Browser Notifications</span>
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="px-6 py-2 bg-[#bf5700] text-white rounded-lg hover:bg-[#a54700] transition
            disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
} 