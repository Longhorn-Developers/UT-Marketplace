"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { Edit, Trash2, Eye, Send } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EditForm from "../listing/components/EditForm";
import Image from "next/image";
import {
  containerVariants,
  headerVariants,
  itemVariants,
  emptyStateVariants,
  overlayVariants,
  modalVariants,
} from "../props/animations";

interface Listing {
  id: number;
  title: string;
  price: number;
  category: string;
  created_at: string;
  images: string[];
  is_sold: boolean;
  is_draft: boolean;
  location: string;
  condition: string;
  description: string;
}

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

const MyListings = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any | null>(null);
  const [editId, setEditId] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/signin");
      return;
    }
    if (!authLoading && user) {
      fetchListings();
    }
    // eslint-disable-next-line
  }, [user, authLoading]);

  const fetchListings = async () => {
    try {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("user_id", user?.email)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error("Error fetching listings:", error);
      toast.error("Failed to load listings");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;

    try {
      const { error } = await supabase.from("listings").delete().eq("id", id);
      if (error) throw error;
      setListings(listings.filter((listing) => listing.id !== id));
      toast.success("Listing deleted successfully");
    } catch (error) {
      console.error("Error deleting listing:", error);
      toast.error("Failed to delete listing");
    }
  };

  const validateListing = (listing: Listing) => {
    const requiredFields = [
      "title", "category", "price", "condition", "location", "description"
    ];
    for (const field of requiredFields) {
      if (!listing[field] || (typeof listing[field] === "string" && listing[field].trim() === "")) {
        return false;
      }
    }
    if (Number(listing.price) <= 0) return false;
    return true;
  };

  const handlePublishDraft = async (listing: Listing) => {
    if (!validateListing(listing)) {
      toast.error("Please complete all required fields before publishing");
      handleEditClick(listing);
      return;
    }

    try {
      const { error } = await supabase
        .from("listings")
        .update({ is_draft: false })
        .eq("id", listing.id);

      if (error) throw error;
      
      setListings(listings.map(l => 
        l.id === listing.id ? { ...l, is_draft: false } : l
      ));
      toast.success("Listing published successfully");
    } catch (error) {
      console.error("Error publishing listing:", error);
      toast.error("Failed to publish listing");
    }
  };

  const handleEditClick = (listing: Listing) => {
    setEditForm({
      title: listing.title,
      price: listing.price,
      location: listing.location,
      category: listing.category,
      condition: listing.condition,
      description: listing.description,
      images: listing.images || [],
      is_draft: listing.is_draft,
    });
    setEditId(listing.id);
    setIsEditing(true);
  };

  const handleEditSubmit = async (formData: any) => {
    if (!editId) return toast.error("Listing ID not found.");
    
    // Find the current listing to get its draft status
    const currentListing = listings.find(listing => listing.id === editId);
    
    // Ensure is_draft status is preserved unless explicitly changed
    const updatedData = {
      ...formData,
      is_draft: formData.is_draft !== undefined ? formData.is_draft : (currentListing?.is_draft || false)
    };
    
    const { error } = await supabase
      .from("listings")
      .update(updatedData)
      .eq("id", editId);
      
    if (error) {
      toast.error("Error updating listing.");
    } else {
      toast.success("Listing updated!");
      setIsEditing(false);
      setEditId(null);
      setEditForm(null);
      fetchListings();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#bf5700]"></div>
      </div>
    );
  }

  return (
    <motion.div 
      className="bg-gray-50 py-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="flex justify-between items-center mb-6"
          variants={headerVariants}
        >
          <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
          <button
            onClick={() => router.push("/create")}
            className="bg-[#bf5700] text-white px-4 py-2 rounded-md hover:bg-[#a54700] transition"
          >
            Create New Listing
          </button>
        </motion.div>

        {listings.length === 0 ? (
          <motion.div 
            className="text-center py-12"
            variants={emptyStateVariants}
          >
            <p className="text-gray-500">You haven&apos;t created any listings yet.</p>
          </motion.div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
          >
            {listings.map((listing, index) => (
              <motion.div
                key={listing.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden group cursor-pointer"
                variants={itemVariants}
                onClick={() => router.push(`/listing/${listing.id}`)}
              >
                <div className="relative h-48">
                  {listing.images && listing.images.length > 0 ? (
                    <div className="relative w-full h-full overflow-hidden">
                      <Image
                        src={listing.images[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        width={500}
                        height={500}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center group-hover:bg-gray-300 transition-colors duration-300">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}
                  {listing.is_draft && (
                    <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-sm">
                      Draft
                    </div>
                  )}
                  {listing.is_sold && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-sm">
                      Sold
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 
                    className="font-semibold text-lg mb-1 cursor-pointer hover:text-[#bf5700] transition" 
                    onClick={() => router.push(`/listing/${listing.id}`)}
                  >
                    {listing.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-2">
                    {listing.category} • ${listing.price}
                  </p>
                  <p className="text-gray-500 text-sm mb-4">
                    Listed on
                    {new Date(listing.created_at).toLocaleDateString()}
                  </p>
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(listing);
                        }}
                        className="p-2 text-gray-600 hover:text-[#bf5700] transition cursor-pointer"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/listing/${listing.id}`);
                        }}
                        className="p-2 text-gray-600 hover:text-[#bf5700] transition cursor-pointer"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(listing.id);
                        }}
                        className="p-2 text-gray-600 hover:text-red-500 transition cursor-pointer"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    {listing.is_draft && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePublishDraft(listing);
                        }}
                        className="flex items-center gap-1 px-3 py-1 bg-[#bf5700] text-white rounded hover:bg-[#a54700] transition text-sm"
                      >
                        <Send size={14} />
                        Publish
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
      <ToastContainer position="top-center" autoClose={3000} />
      {isEditing && editForm && (
        <motion.div 
          className="fixed inset-0 z-40 flex justify-center bg-black/20 backdrop-blur-sm overflow-y-auto pt-16"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <EditForm
              setIsEditing={setIsEditing}
              handleEditChange={() => {}}
              handleEditSubmit={handleEditSubmit}
              form={editForm}
              setForm={setEditForm}
              initialFormState={editForm}
              categoryOptions={categoryOptions}
              conditionOptions={conditionOptions}
              leaseOptions={leaseOptions}
            />
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default MyListings;
