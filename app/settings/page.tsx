"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import { Camera, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useAuthGuard } from '../lib/hooks/useAuthGuard';
import BrowseLoader from "../browse/components/BrowseLoader";
import { UserService } from '../lib/database/UserService';

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
  const { user, isProtected } = useAuthGuard();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [devActionLoading, setDevActionLoading] = useState(false);
  const [settings, setSettings] = useState<UserSettings>({
    display_name: '',
    bio: '',
    notification_preferences: {
      email_notifications: true,
      browser_notifications: true,
    },
    profile_image_url: null,
  });
  const [searchHistoryCleared, setSearchHistoryCleared] = useState(false);

  const clearSearchHistory = () => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem('utm_recent_searches');
    setSearchHistoryCleared(true);
    setTimeout(() => setSearchHistoryCleared(false), 2000);
  };

  const fetchUserSettings = useCallback(async () => {
    if (!user?.id) return;

    try {
      const userData = await UserService.getUserProfile(user.id);
      
      if (userData) {
        // Ensure all fields have default values if they're null
        const settingsWithDefaults = {
          display_name: userData.display_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          bio: userData.bio || '',
          notification_preferences: {
            email_notifications: userData.notification_preferences?.email_notifications ?? true,
            browser_notifications: userData.notification_preferences?.browser_notifications ?? true,
          },
          profile_image_url: userData.profile_image_url || null,
        };
        setSettings(settingsWithDefaults);
      } else {
        // Create default settings if none exist
        const defaultSettings = {
          display_name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          bio: '',
          notification_preferences: {
            email_notifications: true,
            browser_notifications: true,
          },
          profile_image_url: null,
        };
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Error in fetchUserSettings:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.email, user?.user_metadata?.name]);

  useEffect(() => {
    if (isProtected && !user?.id) {
      router.push('/auth/signin');
      return;
    }
    fetchUserSettings();
  }, [user?.id, router, fetchUserSettings, isProtected]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

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

      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      
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

      // Update user settings with new image URL using UserService
      const updatedProfile = await UserService.upsertUserProfile({
        id: user.id,
        email: user.email || '',
        profile_image_url: publicUrl,
        display_name: settings.display_name,
        bio: settings.bio,
        notification_preferences: settings.notification_preferences,
      });

      if (updatedProfile) {
        setSettings(prev => ({ ...prev, profile_image_url: publicUrl }));
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload image. Please try again.');
    } finally {
      setImageUploading(false);
    }
  };

  const saveSettings = async () => {
    if (!user?.id) return;

    try {
      setSaving(true);
      const updatedProfile = await UserService.upsertUserProfile({
        id: user.id,
        email: user.email || '',
        display_name: settings.display_name,
        bio: settings.bio,
        profile_image_url: settings.profile_image_url,
        notification_preferences: settings.notification_preferences,
      });

      if (updatedProfile) {
        alert('Settings saved successfully!');
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const resetOnboarding = async (redirectToOnboarding: boolean) => {
    if (!user?.id) return;

    try {
      setDevActionLoading(true);
      const updatedProfile = await UserService.updateUserProfile({
        id: user.id,
        onboard_complete: false,
      });

      if (!updatedProfile) {
        throw new Error('Failed to reset onboarding status');
      }

      alert('Onboarding status cleared for this account.');

      if (redirectToOnboarding) {
        router.push('/auth/confirmation/onboard');
      }
    } catch (error) {
      console.error('Error resetting onboarding status:', error);
      alert('Failed to reset onboarding status. Please try again.');
    } finally {
      setDevActionLoading(false);
    }
  };

  if (loading) {
    return <BrowseLoader />;
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

      {/* Search History */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Search</h2>
        <p className="text-sm text-gray-500 mb-4">
          Clear your recent search history.
        </p>
        <button
          onClick={clearSearchHistory}
          className="px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition"
        >
          Clear Search History
        </button>
        {searchHistoryCleared && (
          <p className="text-sm text-green-600 mt-2">Search history cleared.</p>
        )}
      </div>

      {/* Developer Tools */}
      <div className="bg-white rounded-lg shadow p-6 mb-8 border border-dashed border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Developer Tools</h2>
        <p className="text-sm text-gray-500 mb-4">
          Temporary controls for QA. These should be removed before launch.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => resetOnboarding(true)}
            disabled={devActionLoading}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Relaunch Onboarding
          </button>
          <button
            onClick={() => resetOnboarding(false)}
            disabled={devActionLoading}
            className="px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear Onboarding Status
          </button>
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
