"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useOnboarding } from "../context/OnboardingContext";
import { toast } from "react-toastify";

// Separate the main content into a client component
function ProfileContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { completeOnboarding } = useOnboarding();
  const isOnboarding = searchParams.get("onboarding") === "true";

  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [currentSettings, setCurrentSettings] = useState<any>(null);

  useEffect(() => {
    if (!user?.email) {
      router.push("/auth/signin");
      return;
    }

    const fetchCurrentSettings = async () => {
      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("email", user.email)
        .single();

      if (error) {
        console.error("Error fetching settings:", error);
        return;
      }

      setCurrentSettings(data);
      setBio(data?.bio || "");
      setPreviewUrl(data?.profile_image_url || "");
    };

    fetchCurrentSettings();
  }, [user, router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;

    try {
      setSaving(true);

      let profileImageUrl = currentSettings?.profile_image_url;

      if (profileImage) {
        const fileName = `${user.email}-${Date.now()}-profile`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("profile-images")
          .upload(fileName, profileImage);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("profile-images")
          .getPublicUrl(fileName);

        profileImageUrl = publicUrlData.publicUrl;
      }

      const { error: updateError } = await supabase
        .from("user_settings")
        .upsert({
          email: user.email,
          bio,
          profile_image_url: profileImageUrl,
          display_name: user.email.split("@")[0],
        });

      if (updateError) throw updateError;

      if (isOnboarding) {
        await completeOnboarding();
        router.push("/browse");
      }

      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            {isOnboarding ? "Complete Your Profile" : "Edit Profile"}
          </h2>
          {isOnboarding && (
            <p className="mt-2 text-gray-600">
              Let&apos;s set up your profile to help others get to know you better.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-center">
            <div className="relative inline-block">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 mb-4 mx-auto">
                {previewUrl ? (
                  <div className="relative w-32 h-32">
                    <Image
                      src={previewUrl}
                      alt="Profile preview"
                      fill
                      className="object-cover"
                      sizes="128px"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg
                      className="w-12 h-12"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="profile-image"
              />
              <label
                htmlFor="profile-image"
                className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#bf5700] hover:bg-[#a54700] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#bf5700]"
              >
                Choose Photo
              </label>
            </div>
          </div>

          <div>
            <label
              htmlFor="bio"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Bio
            </label>
            <textarea
              id="bio"
              rows={4}
              className="shadow-sm focus:ring-[#bf5700] focus:border-[#bf5700] block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="Tell others about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              required={isOnboarding}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={saving || (isOnboarding && (!bio || !profileImage))}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#bf5700] hover:bg-[#a54700] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#bf5700] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving
                ? "Saving..."
                : isOnboarding
                ? "Complete Profile"
                : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

// Main page component with Suspense boundary
export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#bf5700]"></div>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
