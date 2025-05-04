import React, { useState, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'react-toastify';
import { Tag, DollarSign, Text, MapPin, FileText, Save, X } from 'lucide-react';

interface OwnerPageProps {
  title: string;
  price: number;
  location: string;
  category: string;
  timePosted: string;
  images?: string[];
  condition: string;
  description: string;
  id?: string;
}

const categoryOptions = [
  'Furniture',
  'Subleases',
  'Tech',
  'Vehicles',
  'Textbooks',
  'Clothing',
  'Kitchen',
  'Other',
];

const conditionOptions = [
  'New',
  'Like New',
  'Good',
  'Fair',
  'Poor',
];

const leaseOptions = [
  '6 months',
  '12 months',
  'Summer',
  'Flexible',
];

const OwnerPage: React.FC<OwnerPageProps> = ({
  title,
  price,
  location,
  category,
  timePosted,
  images,
  condition,
  description,
  id,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [form, setForm] = useState({
    title,
    price,
    location,
    category,
    condition,
    description,
    images: images || [],
  });

  const handleDelete = async () => {
    if (!id) return toast.error('Listing ID not found.');
    setIsDeleting(true);
    const { error } = await supabase.from('listings').delete().eq('id', id);
    setIsDeleting(false);
    if (error) {
      toast.error('Error deleting listing.');
    } else {
      toast.success('Listing deleted!');
      window.location.href = '/my-listings';
    }
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return toast.error('Listing ID not found.');
    const { error } = await supabase.from('listings').update({
      ...form,
    }).eq('id', id);
    if (error) {
      toast.error('Error updating listing.');
    } else {
      toast.success('Listing updated!');
      setIsEditing(false);
    }
  };

  // Inline edit form, styled like create page
  if (isEditing) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden border border-[#bf5700]/10 mt-8 p-6 relative">
        <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" onClick={() => setIsEditing(false)}><X size={20} /></button>
        <h2 className="text-2xl font-bold mb-4 text-[#bf5700] flex items-center gap-2"><FileText className="w-6 h-6" /> Edit Listing</h2>
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Tag size={14} /> Title</label>
            <input type="text" name="title" value={form.title} onChange={handleEditChange} className="w-full border rounded-md px-3 py-2 text-sm" />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Text size={14} /> Category</label>
              <select name="category" value={form.category} onChange={handleEditChange} className="w-full border rounded-md px-3 py-2 text-sm">
                <option value="">Select a category</option>
                {categoryOptions.map(opt => <option key={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="w-1/3">
              <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><DollarSign size={14} /> Price ($)</label>
              <input type="number" name="price" value={form.price} onChange={handleEditChange} className="w-full border rounded-md px-3 py-2 text-sm" />
            </div>
            <div className="w-1/3">
              <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Tag size={14} />{form.category === 'Subleases' ? 'Lease Duration' : 'Condition'}</label>
              <select name="condition" value={form.condition} onChange={handleEditChange} className="w-full border rounded-md px-3 py-2 text-sm">
                <option value="">{form.category === 'Subleases' ? 'Select lease duration' : 'Select condition'}</option>
                {(form.category === 'Subleases' ? leaseOptions : conditionOptions).map(opt => <option key={opt}>{opt}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><MapPin size={14} /> Location</label>
            <input type="text" name="location" value={form.location} onChange={handleEditChange} className="w-full border rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Text size={14} /> Description</label>
            <textarea name="description" value={form.description} onChange={handleEditChange} className="w-full border rounded-md px-3 py-2 text-sm min-h-[80px]" />
          </div>
          <button type="submit" className="w-full mt-2 px-6 py-2 rounded-lg bg-[#bf5700] text-white font-semibold shadow hover:bg-[#a54700] transition flex items-center justify-center gap-2"><Save size={16} /> Save Changes</button>
        </form>
      </div>
    );
  }

  // Main owner view
  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden border border-[#bf5700]/10 mt-8">
      <div className="relative aspect-[4/3] bg-gray-100">
        {images && images.length > 0 ? (
          <img src={images[0]} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">No Image</div>
        )}
        <div className="absolute top-2 left-2 bg-[#bf5700] text-white text-xs font-semibold px-3 py-1 rounded-full shadow">{category}</div>
      </div>
      <div className="p-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <span className="text-2xl font-bold text-[#bf5700]">${price}</span>
        </div>
        <div className="flex items-center gap-4 mb-4 text-gray-500 text-sm">
          <div className="flex items-center gap-1"><span className="material-icons text-[#bf5700]">location_on</span>{location}</div>
          <div className="flex items-center gap-1"><span className="material-icons text-[#bf5700]">schedule</span>{timePosted}</div>
          <div className="flex items-center gap-1"><span className="material-icons text-[#bf5700]">category</span>{category}</div>
        </div>
        <div className="mb-4">
          <span className="inline-block bg-[#bf5700]/10 text-[#bf5700] px-3 py-1 rounded-full text-xs font-semibold mr-2">{category === "Subleases" ? `Lease Duration: ${condition}` : `Condition: ${condition}`}</span>
        </div>
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">Description</h3>
          <p className="text-gray-700 text-base leading-relaxed whitespace-pre-line">{description}</p>
        </div>
        <div className="flex justify-end gap-2">
          <button className="px-6 py-2 rounded-lg bg-[#bf5700] text-white font-semibold shadow hover:bg-[#a54700] transition" onClick={() => setIsEditing(true)}>Edit Listing</button>
          <button className="px-6 py-2 rounded-lg bg-red-500 text-white font-semibold shadow hover:bg-red-600 transition" onClick={handleDelete} disabled={isDeleting}>{isDeleting ? 'Deleting...' : 'Delete Listing'}</button>
        </div>
      </div>
    </div>
  );
};

export default OwnerPage;
