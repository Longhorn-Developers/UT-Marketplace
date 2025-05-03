"use client";
import React, { useRef, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Tag,
  DollarSign,
  Text,
  MapPin,
  FileText,
  Save,
  Send,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useSession } from "next-auth/react";
import ImageUploader from "./ImageUpload";

const Create = () => {
  const [images, setImages] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { data: session, status } = useSession();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState(0);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [condition, setCondition] = useState("");

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

  const handleSubmit = async () => {
    console.log("Form values:", {
      title,
      category,
      price,
      description,
      location,
      email: session?.user?.email,
      name: session?.user?.name,
      condition,
    });
    console.log("Session object:", session);

    if (!session || !session.user?.email || !session.user?.name) {
      toast.error("You must be logged in to create a listing.");
      if (!session) {
        console.warn("Session is null or undefined.");
      } else {
        if (!session.user?.email) console.warn("Session user email is missing.");
        if (!session.user?.name) console.warn("Session user name is missing.");
      }
      return;
    }

    if (!title || !category || !description || !location || price <= 0 || !condition) {
      toast.error("Please fill in all fields before publishing.");
      return;
    }

    // Upload images to Supabase Storage
    const uploadedImageUrls: string[] = [];
    for (const image of images) {
      const fileName = `${session.user.email}-${Date.now()}-${image.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("listing-images")
        .upload(fileName, image);

      if (uploadError) {
        console.error("Image upload failed:", uploadError?.message || uploadError);
        toast.error(`Failed to upload image: ${uploadError?.message || "Unknown error"}`);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("listing-images")
        .getPublicUrl(fileName);

      uploadedImageUrls.push(publicUrlData.publicUrl);
    }

    const payload = {
      title,
      category,
      price,
      description,
      location,
      condition,
      user_id: session.user.email,
      user_name: session.user.name,
      created_at: new Date().toISOString(),
      images: uploadedImageUrls,
    };

    console.log("Insert payload:", payload);

    const { data, error } = await supabase.from("listings").insert([payload]);

    if (error) {
      console.error("Upload error:", error);
      toast.error("Something went wrong while uploading.");
    } else {
      toast.success("🎉 Listing created successfully!");
      console.log(data);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-2">Create a New Listing</h1>
        <p className="text-gray-600 mb-6">
          Fill out the form below to create your listing on UT Marketplace
        </p>

        <ImageUploader
          images={images}
          setImages={setImages}
          fileInputRef={fileInputRef}
          handleFileChange={handleFileChange}
          handleAddPhotoClick={handleAddPhotoClick}
          handleRemoveImage={handleRemoveImage}
        />

        {/* Listing Details Section */}
        <div className="border rounded-md p-6 bg-white shadow-sm">
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
              <input
                type="number"
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
              />
            </div>
            <div className="w-1/3">
              <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Tag size={14} />
                {category === "Subleases" ? "Lease Duration" : "Condition"}
              </label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
              >
                <option value="">
                  {category === "Subleases" ? "Select lease duration" : "Select condition"}
                </option>
                {category === "Subleases" ? (
                  <>
                    <option value="Summer Only">Summer Only</option>
                    <option value="Fall Only">Fall Only</option>
                    <option value="Full Year">Full Year</option>
                    <option value="Month-to-Month">Month-to-Month</option>
                  </>
                ) : (
                  <>
                    <option value="New">New</option>
                    <option value="Like New">Like New</option>
                    <option value="Good">Good</option>
                    <option value="Used">Used</option>
                    <option value="Heavily Used">Heavily Used</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Text size={14} />
              Description
            </label>
            <textarea
              className="w-full border rounded-md px-3 py-2 text-sm"
              rows={5}
              placeholder="Describe your item in detail. Include condition, features, and any other relevant information."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="mb-6">
            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <MapPin size={14} />
              Location
            </label>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              <option>Select a location</option>
              <option>West Campus</option>
              <option>North Campus</option>
              <option>Riverside</option>
              <option>UT Campus</option>
              <option>Jester Circle</option>
              <option>PCL</option>
              <option>Union Starbucks</option>
              <option>Greg Gym</option>
              <option>Littlefield Fountain</option>
              <option>Dobie</option>
              <option>Other</option>
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border rounded-md shadow-sm text-sm bg-white hover:bg-gray-100 transition">
              <Save size={16} />
              Save as Draft
            </button>
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-4 py-2 border rounded-md shadow-sm text-sm bg-[#bf5700] text-white hover:bg-[#a54700] transition"
            >
              <Send size={16} />
              Publish Listing
            </button>
          </div>
        </div>
        <ToastContainer position="top-center" autoClose={3000} />
      </div>
    </div>
  );
};

export default Create;
