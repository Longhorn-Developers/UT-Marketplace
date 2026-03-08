"use client";
import React from "react";
import { ImagePlus, UploadCloud, X } from "lucide-react";
import { ImageUploadProps } from "../../props/image-upload";
import Image from "next/image";

const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  fileInputRef,
  handleFileChange,
  handleAddPhotoClick,
  handleRemoveImage,
}) => {
  return (
    <div className="border rounded-md p-6 mb-8 bg-white shadow-sm">
      <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
        <ImagePlus className="w-5 h-5 text-[#bf5700]" />
        Photos
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Add up to 5 photos to showcase your item. The first photo will be your listing&apos;s cover image.
      </p>
      <div className="flex items-center gap-4 mb-4">
        {images.map((file, index) => (
          <div
            key={index}
            className="w-24 h-24 bg-gray-100 rounded-md flex items-center justify-center border relative overflow-hidden"
          >
            <Image
              src={URL.createObjectURL(file)}
              alt={`Uploaded ${index}`}
              fill
              className="object-cover rounded-md"
              sizes="96px"
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
    </div>
  );
};

export default ImageUpload;
