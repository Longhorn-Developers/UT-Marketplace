"use client";
import React, { useRef, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion, Variants } from "framer-motion";
import {
  Tag,
  DollarSign,
  Text,
  MapPin,
  FileText,
  Save,
  Send,
} from "lucide-react";
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import ImageUploader from "./components/ImageUpload";
import dynamic from "next/dynamic";
import { ListingService } from '../lib/database/ListingService';
import { UserService } from '../lib/database/UserService';
import { dbLogger } from '../lib/database/utils';
import NotLoggedIn from '../../components/globals/NotLoggedIn';


const MapPicker = dynamic(() => import("../listing/components/MapPicker"), { ssr: false });

const Create = () => {
  const [images, setImages] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState(0);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [customLocation, setCustomLocation] = useState("");
  const [showCustomLocationInput, setShowCustomLocationInput] = useState(false);
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const [condition, setCondition] = useState("");
  const [saving, setSaving] = useState(false);

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const headerVariants: Variants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files);
      setImages((prev) => [...prev, ...fileArray].slice(0, 5));
    }
  };

  const handleAddPhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    setLocation(selectedValue);
    
    if (selectedValue === "Add custom location") {
      setShowCustomLocationInput(true);
      setLocation(""); // Reset location since we'll use custom location
    } else {
      setShowCustomLocationInput(false);
      setCustomLocation(""); // Clear custom location when predefined is selected
    }
  };

  const handleSaveDraft = async () => {
    if (!user?.id) {
      toast.error("You must be logged in to save a draft.");
      return;
    }

    try {
      setSaving(true);
      
      // Upload images using the service
      let uploadedImageUrls: string[] = [];
      if (images.length > 0) {
        uploadedImageUrls = await ListingService.uploadImages(images, user.id);
      }

      const draftLocation = showCustomLocationInput ? customLocation : location;
      
      const listing = await ListingService.createListing({
        title: title || "Untitled Draft",
        price: price || 0,
        location: draftLocation || "",
        category: category || "",
        condition: condition || "",
        description: description || "",
        images: uploadedImageUrls,
        userId: user.id,
        isDraft: true,
        locationLat: locationLat || undefined,
        locationLng: locationLng || undefined,
      });

      if (listing) {
        toast.success("Draft saved successfully!");
        router.push('/my-listings');
      } else {
        throw new Error('Failed to create listing');
      }
    } catch (error) {
      dbLogger.error('Error saving draft', error);
      toast.error("Failed to save draft. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error("You must be logged in to create a listing.");
      return;
    }

    const finalLocation = showCustomLocationInput ? customLocation : location;
    
    if (!title || !category || !description || !finalLocation || price <= 0 || !condition) {
      toast.error("Please fill in all fields before publishing.");
      return;
    }

    if (showCustomLocationInput && customLocation.trim().length === 0) {
      toast.error("Please enter a custom location.");
      return;
    }

    try {
      setSaving(true);
      
      // Upload images using the service
      const uploadedImageUrls = await ListingService.uploadImages(images, user.id);

      const listing = await ListingService.createListing({
        title,
        price,
        location: finalLocation,
        category,
        condition,
        description,
        images: uploadedImageUrls,
        userId: user.id,
        isDraft: false,
        locationLat: locationLat || undefined,
        locationLng: locationLng || undefined,
      });

      if (listing) {
        toast.success("🎉 Listing created successfully! It's now pending admin approval and will be visible once approved.");
        router.push('/my-listings');
      } else {
        throw new Error('Failed to create listing');
      }
    } catch (error) {
      dbLogger.error('Error creating listing', error);
      toast.error("Failed to create listing. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <motion.div 
        className="flex items-center justify-center min-h-[60vh]"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#bf5700] mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </motion.div>
    );
  }

  // Show not logged in component if user is not authenticated
  if (!user) {
    return (
      <motion.div 
        className="bg-gray-50 min-h-screen"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <NotLoggedIn 
          message="Please log in to create a listing"
          className="py-10"
        />
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="bg-gray-50 flex-1"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-4xl mx-auto py-10 px-4">
        <motion.div variants={headerVariants}>
          <h1 className="text-3xl font-bold mb-2">Create a New Listing</h1>
          <p className="text-gray-600 mb-2">
            Fill out the form below to create your listing on UT Marketplace
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> All listings require admin approval before becoming visible to other users. You&apos;ll be notified once your listing is approved or if any changes are needed.
            </p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <ImageUploader
            images={images}
            setImages={setImages}
            fileInputRef={fileInputRef}
            handleFileChange={handleFileChange}
            handleAddPhotoClick={handleAddPhotoClick}
            handleRemoveImage={handleRemoveImage}
          />
        </motion.div>

        {/* Listing Details Section */}
        <motion.div 
          className="border rounded-md p-6 bg-white shadow-sm"
          variants={itemVariants}
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#bf5700]" />
            Listing Details
          </h2>

          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Tag size={14} />
              Title
            </label>
            <input
              type="text"
              placeholder="e.g., Modern Desk Chair"
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Text size={14} />
                Category
              </label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option>Select a category</option>
                <option>Furniture</option>
                <option>Subleases</option>
                <option>Tech</option>
                <option>Vehicles</option>
                <option>Textbooks</option>
                <option>Clothing</option>
                <option>Kitchen</option>
                <option>Other</option>
              </select>
            </div>
            <div className="w-1/3">
              <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <DollarSign size={14} />
                Price ($)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  className="w-full border rounded-md px-7 py-2 text-sm"
                  value={price === 0 ? "" : price}
                  placeholder="0.00"
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (isNaN(val) || val < 0) {
                      setPrice(0);
                    } else {
                      setPrice(val);
                    }
                  }}
                  onBlur={() => {
                    if (price < 0.01) setPrice(0.01);
                  }}
                  required
                />
              </div>
              {price < 0.01 && (
                <p className="text-xs text-red-500 mt-1">Price must be at least $0.01</p>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Text size={14} />
              Condition
            </label>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              required
            >
              <option>Select condition</option>
              <option>New</option>
              <option>Like New</option>
              <option>Good</option>
              <option>Fair</option>
              <option>Poor</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <MapPin size={14} />
              Location
            </label>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={showCustomLocationInput ? "Add custom location" : location}
              onChange={handleLocationChange}
              required
            >
              <option value="">Select a location</option>
              <option value="On Campus">On Campus</option>
              <option value="West Campus">West Campus</option>
              <option value="North Campus">North Campus</option>
              <option value="East Riverside">East Riverside</option>
              <option value="Downtown">Downtown</option>
              <option value="Hyde Park">Hyde Park</option>
              <option value="Mueller">Mueller</option>
              <option value="Add custom location">Add custom location</option>
            </select>
            {showCustomLocationInput && (
              <div className="mt-3">
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Enter custom location
                </label>
                <input
                  type="text"
                  placeholder="e.g., South Austin, Specific building name..."
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value.slice(0, 100))}
                  maxLength={100}
                  required
                />
                <div className="text-xs text-gray-500 mt-1">
                  {customLocation.length}/100 characters
                </div>
              </div>
            )}
            {/* <div className="my-2">
              <MapPicker
                value={locationLat && locationLng ? { lat: locationLat, lng: locationLng } : undefined}
                onChange={({ lat, lng }) => {
                  setLocationLat(lat);
                  setLocationLng(lng);
                }}
                height="250px"
              />
              <div className="text-xs text-gray-500 mt-1">
                Click on the map to select a location. This will help buyers see where the item is located.
                {locationLat && locationLng && (
                  <span className="ml-2 text-green-600">Location selected!</span>
                )}
              </div>
            </div> */}
          </div>

          <div className="mb-6">
            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Text size={14} />
              Description
            </label>
            <textarea
              className="w-full border rounded-md px-3 py-2 text-sm h-32"
              placeholder="Describe your item..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <button 
              onClick={handleSaveDraft}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 border rounded-md shadow-sm text-sm bg-white hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save as Draft'}
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 border rounded-md shadow-sm text-sm bg-[#bf5700] text-white hover:bg-[#a54700] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={16} />
              {saving ? 'Publishing...' : 'Publish Listing'}
            </button>
          </div>
        </motion.div>
        <ToastContainer position="top-center" autoClose={3000} />
      </div>
    </motion.div>
  );
};

export default Create;
