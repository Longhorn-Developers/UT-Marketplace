import React, { useState, useRef } from "react";
import { Tag, DollarSign, Text, MapPin, FileText, Save, X } from "lucide-react";
import { toast } from "react-toastify";
import ImageUpload from "../../create/components/ImageUpload";
import Image from "next/image";
import dynamic from "next/dynamic";

const MapPicker = dynamic(() => import("./MapPicker"), { ssr: false });

const EditForm = ({
  setIsEditing,
  handleEditChange,
  handleEditSubmit,
  form,
  setForm,
  initialFormState,
  categoryOptions,
  conditionOptions,
  leaseOptions,
}) => {
  const [localForm, setLocalForm] = useState(form);
  const [images, setImages] = useState<(File | string)[]>(form.images || []);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const hasLatLng = typeof localForm.location_lat === 'number' && typeof localForm.location_lng === 'number';

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

  const validateFields = () => {
    const requiredFields = [
      'title', 'category', 'price', 'condition', 'location', 'description'
    ];
    for (const field of requiredFields) {
      if (!localForm[field] || (typeof localForm[field] === 'string' && localForm[field].trim() === '')) {
        return false;
      }
    }
    if (Number(localForm.price) <= 0) return false;
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setForm(localForm);
    // If new images are uploaded, add them to the form (you may want to handle upload to storage in parent)
    
    // Preserve the draft status in the submission
    const dataToSubmit = { 
      ...localForm, 
      is_draft: typeof localForm.is_draft !== 'undefined' ? localForm.is_draft : form.is_draft,
      images,
      location_lat: localForm.location_lat,
      location_lng: localForm.location_lng,
    };
    
    handleEditSubmit(dataToSubmit);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 backdrop-blur-sm pt-[80px]">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl border border-[#bf5700]/10 p-0 relative max-h-[90vh] flex flex-col">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (setForm && initialFormState) {
              setForm(initialFormState);
            }
            setIsEditing(false);
          }}
        >
          <X size={20} />
        </button>
        <div className="overflow-y-auto p-6 pt-12 flex-1">
          <h2 className="text-2xl font-bold mb-4 text-[#bf5700] flex items-center gap-2">
            <FileText className="w-6 h-6" /> Edit Listing
          </h2>
          <div className="border rounded-md p-6 mb-8 bg-white shadow-sm">
            <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
              Photos
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Add up to 5 photos to showcase your item. The first photo will be your listing&apos;s cover image.
            </p>
            <div className="flex items-center gap-4 mb-4">
              {images.map((img, index) => (
                <div
                  key={index}
                  className="w-24 h-24 bg-gray-100 rounded-md flex items-center justify-center border relative overflow-hidden"
                >
                  {typeof img === "string" ? (
                    <Image
                      src={img}
                      alt={`Uploaded ${index}`}
                      fill
                      className="object-cover rounded-md"
                      sizes="96px"
                    />
                  ) : (
                    <Image
                      src={URL.createObjectURL(img)}
                      alt={`Uploaded ${index}`}
                      fill
                      className="object-cover rounded-md"
                      sizes="96px"
                    />
                  )}
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
                  <span>+</span>
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Tag size={14} /> Title
              </label>
              <input
                type="text"
                name="title"
                value={localForm.title}
                onChange={(e) => setLocalForm({ ...localForm, title: e.target.value })}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Text size={14} /> Category
                </label>
                <select
                  name="category"
                  value={localForm.category ?? ""}
                  onChange={(e) => setLocalForm({ ...localForm, category: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                >
                  <option value="">Select a category</option>
                  {categoryOptions.map((opt) => (
                    <option key={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div className="w-1/3">
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <DollarSign size={14} /> Price ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    className="w-full border rounded-md px-7 py-2 text-sm"
                    value={localForm.price === 0 ? "" : localForm.price}
                    placeholder="0.00"
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (isNaN(val) || val < 0) {
                        setLocalForm({ ...localForm, price: 0 });
                      } else {
                        setLocalForm({ ...localForm, price: val });
                      }
                    }}
                    onBlur={() => {
                      if (localForm.price < 0.01) setLocalForm({ ...localForm, price: 0.01 });
                    }}
                  />
                </div>
                {localForm.price < 0.01 && (
                  <p className="text-xs text-red-500 mt-1">Price must be at least $0.01</p>
                )}
              </div>
              <div className="w-1/3">
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Tag size={14} />
                  {localForm.category === "Subleases" ? "Lease Duration" : "Condition"}
                </label>
                <select
                  name="condition"
                  value={localForm.condition ?? ""}
                  onChange={(e) => setLocalForm({ ...localForm, condition: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                >
                  <option value="">
                    {localForm.category === "Subleases"
                      ? "Select lease duration"
                      : "Select condition"}
                  </option>
                  {(localForm.category === "Subleases"
                    ? leaseOptions
                    : conditionOptions
                  ).map((opt) => (
                    <option key={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <MapPin size={14} /> Location
              </label>
              <input
                type="text"
                name="location"
                value={localForm.location ?? ""}
                onChange={(e) => setLocalForm({ ...localForm, location: e.target.value })}
                className="w-full border rounded-md px-3 py-2 text-sm mb-2"
              />
              <div className="my-2">
                <MapPicker
                  value={hasLatLng ? { lat: localForm.location_lat, lng: localForm.location_lng } : undefined}
                  onChange={({ lat, lng }) => setLocalForm({ ...localForm, location_lat: lat, location_lng: lng })}
                  height="200px"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Click on the map to update the location. This helps buyers see where the item is located.
                  {hasLatLng && (
                    <span className="ml-2 text-green-600">Location selected!</span>
                  )}
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Text size={14} /> Description
              </label>
              <textarea
                name="description"
                value={localForm.description ?? ""}
                onChange={(e) => setLocalForm({ ...localForm, description: e.target.value })}
                className="w-full border rounded-md px-3 py-2 text-sm min-h-[80px]"
              />
            </div>
            <button
              type="submit"
              className="w-full mt-2 px-6 py-2 rounded-lg bg-[#bf5700] text-white font-semibold shadow hover:bg-[#a54700] transition flex items-center justify-center gap-2"
            >
              <Save size={16} /> Save Changes
            </button>
            {typeof localForm.is_draft !== 'undefined' && localForm.is_draft && (
              <button
                type="button"
                className="w-full mt-2 px-6 py-2 rounded-lg bg-green-600 text-white font-semibold shadow hover:bg-green-700 transition flex items-center justify-center gap-2"
                onClick={() => {
                  if (!validateFields()) {
                    toast.error('Please fill in all required fields before publishing.');
                    return;
                  }
                  handleEditSubmit({ ...localForm, is_draft: false, images });
                }}
              >
                <Save size={16} /> Publish Listing
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditForm;
