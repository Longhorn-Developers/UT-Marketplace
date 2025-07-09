import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EditForm from "./EditForm";
import { MapPin, Calendar, Tag, CheckCircle2, Send } from "lucide-react";
import ListingCard from '../../browse/components/ListingCard';
import * as timeago from 'timeago.js';
import { OwnerPageProps } from "../../props/listing";
import RelatedListings from "../../browse/components/RelatedListings";

const categoryOptions = [
  "Furniture",
  "Subleases",
  "Tech",
  "Vehicles",
  "Textbooks",
  "Clothing",
  "Kitchen",
  "Other",
];

const conditionOptions = ["New", "Like New", "Good", "Fair", "Poor"];

const leaseOptions = ["6 months", "12 months", "Summer", "Flexible"];

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
  is_sold = false,
  is_draft = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSold, setIsSold] = useState(is_sold);
  const [isDraft, setIsDraft] = useState(is_draft);
  const [form, setForm] = useState({
    title,
    price,
    location,
    category,
    condition,
    description,
    images: images || [],
  });
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);

  const [relatedListings, setRelatedListings] = useState<any[]>([]);

  const router = useRouter();

  // Update isSold state when is_sold prop changes
  useEffect(() => {
    setIsSold(is_sold);
  }, [is_sold]);

  // Update isDraft state when is_draft prop changes
  useEffect(() => {
    setIsDraft(is_draft);
  }, [is_draft]);

  const fetchListing = async () => {
    if (!id) return;
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      toast.error("Error fetching listing.");
    } else if (data) {
      setForm({
        title: data.title,
        price: data.price,
        location: data.location,
        category: data.category,
        condition: data.condition,
        description: data.description,
        images: data.images || [],
      });
      setIsSold(data.is_sold);
      setIsDraft(data.is_draft);
      setSelectedImageIdx(0);
    }
  };

  useEffect(() => {
    fetchListing();
  }, []);

  useEffect(() => {
    const fetchRelated = async () => {
      if (!form.category || !form.title) return;
      const { data, error } = await supabase
        .from("listings")
        .select("id, title, price, images")
        .eq("category", form.category)
        .neq("title", form.title)
        .limit(4);

      if (!error) {
        setRelatedListings(data || []);
      }
    };

    fetchRelated();
  }, [form.category, form.title]);

  const handleDelete = async () => {
    if (!id) return toast.error("Listing ID not found.");
    setIsDeleting(true);
    const { error } = await supabase.from("listings").delete().eq("id", id);
    setIsDeleting(false);
    if (error) {
      toast.error("Error deleting listing.");
    } else {
      toast.success("Listing deleted!");
      window.location.href = "/my-listings";
    }
  };

  const handleEditChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (formData: typeof form) => {
    if (!id) return toast.error("Listing ID not found.");
    const { error } = await supabase
      .from("listings")
      .update({
        ...formData,
      })
      .eq("id", id);
    if (error) {
      toast.error("Error updating listing.");
    } else {
      toast.success("Listing updated!");
      setIsEditing(false);
      await fetchListing();
    }
  };

  const handleToggleSold = async () => {
    if (!id) return toast.error("Listing ID not found.");
    
    try {
      const { error } = await supabase
        .from("listings")
        .update({ is_sold: !isSold })
        .eq("id", id);

      if (error) throw error;
      
      setIsSold(!isSold);
      toast.success(isSold ? "Listing marked as available" : "Listing marked as sold");
      await fetchListing(); // Refresh the listing data
    } catch (err) {
      toast.error("Error updating listing status");
    }
  };

  const handlePublishDraft = async () => {
    if (!id) return toast.error("Listing ID not found.");
    
    // Validate if all required fields are filled
    const requiredFields = [
      "title", "category", "price", "condition", "location", "description"
    ];
    
    for (const field of requiredFields) {
      if (!form[field] || (typeof form[field] === 'string' && form[field].trim() === '')) {
        toast.error(`Please fill in the ${field} field before publishing.`);
        return;
      }
    }
    
    if (Number(form.price) <= 0) {
      toast.error("Price must be greater than 0.");
      return;
    }
    
    try {
      const { error } = await supabase
        .from("listings")
        .update({ is_draft: false })
        .eq("id", id);

      if (error) throw error;
      
      setIsDraft(false);
      toast.success("Listing published successfully!");
      await fetchListing(); // Refresh the listing data
    } catch (err) {
      toast.error("Error publishing listing");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="max-w-6xl mx-auto mt-4">
          <a
            href="/browse"
            className="text-[#bf5700] text-sm hover:underline flex items-center gap-1"
          >
            ← Back to Listings
          </a>
        </div>

        <div className="max-w-6xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col gap-4">
            <div className="aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden relative">
              {form.images && form.images[selectedImageIdx] ? (
                <>
                  <img
                    src={form.images[selectedImageIdx]}
                    alt={form.title}
                    className={`w-full h-full object-cover ${isSold ? 'opacity-50' : ''}`}
                  />
                  {isSold && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-gray-800/80 text-white px-6 py-3 rounded-full flex items-center gap-2">
                        <CheckCircle2 size={20} />
                        <span className="font-semibold">Sold</span>
                      </div>
                    </div>
                  )}
                  {isDraft && (
                    <div className="absolute top-2 left-2">
                      <div className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        Draft
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
                  No Image
                </div>
              )}
            </div>

            {form.images && form.images.length > 1 && (
              <div className="grid grid-cols-5 gap-2 mb-6">
                {form.images.slice(0, 5).map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`rounded-xl overflow-hidden border-2 ${
                      selectedImageIdx === idx
                        ? "border-[#bf5700]"
                        : "border-transparent"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-[80px] object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md flex flex-col">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {form.title}
              </h2>
              <span className="text-3xl font-bold text-[#bf5700] block mb-4">
                ${form.price}
              </span>
              <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="text-[#bf5700]" size={16} />{" "}
                  {form.location}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="text-[#bf5700]" size={16} /> {timePosted}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Tag className="text-[#bf5700]" size={16} /> {form.category}
                </span>
              </div>
              <div className="mb-4">
                <span className="inline-block bg-[#bf5700]/10 text-[#bf5700] px-3 py-1 rounded-full text-xs font-semibold">
                  {form.category === "Subleases"
                    ? `Lease Duration: ${form.condition}`
                    : `Condition: ${form.condition}`}
                </span>
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  Description
                </h3>
                <p className="text-gray-700 text-base leading-relaxed whitespace-pre-line">
                  {form.description}
                </p>
              </div>
            </div>
            <div className="mt-auto flex flex-col gap-4">
              {isDraft && (
                <button
                  onClick={handlePublishDraft}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded transition flex items-center justify-center gap-2"
                >
                  <Send size={16} /> Publish Listing
                </button>
              )}
              {!isDraft && (
                <button
                  onClick={handleToggleSold}
                  className={`w-full font-semibold py-2 rounded transition ${
                    isSold 
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-[#bf5700] hover:bg-[#a54700] text-white'
                  }`}
                >
                  {isSold ? 'Mark as Available' : 'Mark as Sold'}
                </button>
              )}
              <button
                className="w-full bg-[#bf5700] hover:bg-[#a54700] text-white font-semibold py-2 rounded transition"
                onClick={() => setIsEditing(true)}
              >
                Edit Listing
              </button>
              <button
                className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded transition"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Listing"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <RelatedListings
        currentListingId={id}
        category={category}
        title={title}
        excludeSold={true}
      />

      {isEditing && (
        <div className="fixed inset-0 z-40 flex justify-center bg-black/20 backdrop-blur-sm overflow-y-auto">
          <EditForm
            setIsEditing={setIsEditing}
            handleEditChange={handleEditChange}
            handleEditSubmit={handleEditSubmit}
            form={form}
            setForm={setForm}
            initialFormState={{
              title,
              price,
              location,
              category,
              condition,
              description,
              images: images || [],
            }}
            categoryOptions={categoryOptions}
            conditionOptions={conditionOptions}
            leaseOptions={leaseOptions}
          />
        </div>
      )}
      <div className="z-50">
        <ToastContainer />
      </div>
    </div>
  );
};

export default OwnerPage;
