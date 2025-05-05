import React, { useState } from "react";
import { Tag, DollarSign, Text, MapPin, FileText, Save, X } from "lucide-react";

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

  return (
    <div>
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden border border-[#bf5700]/10 mt-8 p-6 relative">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (setForm && initialFormState) {
              setForm(initialFormState); // reset form if props exist
            }
            setIsEditing(false); // close the form
          }}
        >
          <X size={20} />
        </button>
        <h2 className="text-2xl font-bold mb-4 text-[#bf5700] flex items-center gap-2">
          <FileText className="w-6 h-6" /> Edit Listing
        </h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          setForm(localForm); // update parent form state
          handleEditSubmit(localForm); // proceed with submission
        }} className="space-y-4">
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
              <input
                type="number"
                name="price"
                value={localForm.price}
                onChange={(e) => setLocalForm({ ...localForm, price: e.target.value })}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
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
              value={localForm.location}
              onChange={(e) => setLocalForm({ ...localForm, location: e.target.value })}
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Text size={14} /> Description
            </label>
            <textarea
              name="description"
              value={localForm.description}
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
        </form>
      </div>
    </div>
  );
};

export default EditForm;
