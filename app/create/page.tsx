"use client";
import React, { useRef, useState } from "react";
import {
  ImagePlus,
  UploadCloud,
  Tag,
  DollarSign,
  Text,
  MapPin,
  FileText,
  Save,
  Send,
  X
} from "lucide-react";

const Create = () => {
  const [images, setImages] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-2">Create a New Listing</h1>
      <p className="text-gray-600 mb-6">Fill out the form below to create your listing on UT Marketplace</p>

      {/* Photo Upload Section */}
      <div className="border rounded-md p-6 mb-8 bg-white shadow-sm">
        <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
          <ImagePlus className="w-5 h-5 text-[#bf5700]" />
          Photos
        </h2>
        <p className="text-sm text-gray-500 mb-4">Add up to 5 photos to showcase your item. The first photo will be your listing’s cover image.</p>
        <div className="flex items-center gap-4 mb-4">
          {images.map((file, index) => (
            <div key={index} className="w-24 h-24 bg-gray-100 rounded-md flex items-center justify-center border relative overflow-hidden">
              <img
                src={URL.createObjectURL(file)}
                alt={`Uploaded ${index}`}
                className="object-cover w-full h-full rounded-md"
              />
              <span
                onClick={() => handleRemoveImage(index)}
                className="absolute top-1 right-1 bg-white text-xs rounded-full p-1 shadow cursor-pointer"
              >
                <X size={14} />
              </span>
            </div>
          ))}
          {images.length < 5 && (
            <div
              onClick={handleAddPhotoClick}
              className="w-24 h-24 border border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-50 text-xs gap-1"
            >
              <ImagePlus size={20} />
              <span>Add Photo</span>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            multiple
            hidden
            ref={fileInputRef}
            onChange={handleFileChange}
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border rounded-md shadow-sm text-sm bg-white hover:bg-gray-100 transition">
          <UploadCloud size={16} />
          Upload Photos
        </button>
      </div>

      {/* Listing Details Section */}
      <div className="border rounded-md p-6 bg-white shadow-sm">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#bf5700]" />
          Listing Details
        </h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <Tag size={14} />
            Title
          </label>
          <input type="text" placeholder="e.g., Modern Desk Chair" className="w-full border rounded-md px-3 py-2 text-sm" />
        </div>

        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Text size={14} />
              Category
            </label>
            <select className="w-full border rounded-md px-3 py-2 text-sm">
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
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <DollarSign size={14} />
              Price ($)
            </label>
            <input type="number" className="w-full border rounded-md px-3 py-2 text-sm" defaultValue={0} />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <Text size={14} />
            Description
          </label>
          <textarea
            className="w-full border rounded-md px-3 py-2 text-sm"
            rows={5}
            placeholder="Describe your item in detail. Include condition, features, and any other relevant information."
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <MapPin size={14} />
            Location
          </label>
          <select className="w-full border rounded-md px-3 py-2 text-sm">
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
          <button className="flex items-center gap-2 px-4 py-2 border rounded-md shadow-sm text-sm bg-[#bf5700] text-white hover:bg-[#a54700] transition">
            <Send size={16} />
            Publish Listing
          </button>
        </div>
      </div>
    </div>
  );
};

export default Create;
