"use client";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { MessageCircle, Settings, LogOut, Plus, X, User, Menu, Heart } from "lucide-react";
import { useAuth } from "../../app/context/AuthContext";
import { useRouter } from "next/navigation";
import { supabase } from "../../app/lib/supabaseClient";
import SearchInput from "../../app/browse/components/SearchInput";
import Notifications from "./Notifications";

const categoryLabels: Record<string, string> = {
  furniture: 'Furniture',
  subleases: 'Subleases',
  tech: 'Tech',
  vehicles: 'Vehicles',
  textbooks: 'Textbooks',
  clothing: 'Clothing',
  kitchen: 'Kitchen',
  other: 'Other',
};

const formatCategory = (value?: string | null) => {
  if (!value) return '';
  const key = value.toLowerCase();
  return categoryLabels[key] || value;
};

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [searchValue, setSearchValue] = useState("");
  const [suggestions, setSuggestions] = useState<Array<{ value: string; label: string; type?: string }>>([]);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setProfileMenuOpen(false);
  };

  const handleSearchSubmit = (event?: React.FormEvent) => {
    event?.preventDefault();
    const trimmed = searchValue.trim();
    if (!trimmed) return;
    router.push(`/browse?search=${encodeURIComponent(trimmed)}`);
  };

  useEffect(() => {
    if (!user?.id) {
      setSuggestions([]);
      return;
    }

    const term = searchValue.trim();
    if (!term) {
      setSuggestions([]);
      return;
    }

    const handle = window.setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from("listings")
          .select("title, category, location")
          .eq("is_draft", false)
          .or(`title.ilike.%${term}%,location.ilike.%${term}%`)
          .limit(8);

        if (error) {
          console.error("Search suggestions error:", error);
          return;
        }

        const titleMatches = new Set<string>();
        const categoryMatches = new Set<string>();
        const locationMatches = new Set<string>();

        (data || []).forEach((item) => {
          if (item.title && item.title.toLowerCase().includes(term)) {
            titleMatches.add(item.title);
          }
          const categoryLabel = formatCategory(item.category);
          if (categoryLabel && categoryLabel.toLowerCase().includes(term)) {
            categoryMatches.add(categoryLabel);
          }
          if (item.location && item.location.toLowerCase().includes(term)) {
            locationMatches.add(item.location);
          }
        });

        const categoryFromInput = Object.values(categoryLabels).filter((label) =>
          label.toLowerCase().includes(term)
        );

        categoryFromInput.forEach((label) => categoryMatches.add(label));

        const combined = [
          ...Array.from(titleMatches).map((value) => ({
            value,
            label: value,
            type: 'Title',
          })),
          ...Array.from(categoryMatches).map((value) => ({
            value,
            label: value,
            type: 'Category',
          })),
          ...Array.from(locationMatches).map((value) => ({
            value,
            label: value,
            type: 'Location',
          })),
        ].slice(0, 6);

        setSuggestions(combined);
      } catch (err) {
        console.error("Search suggestions error:", err);
      }
    }, 220);

    return () => window.clearTimeout(handle);
  }, [searchValue, user?.id]);

  const handleSuggestionSelect = (value: string) => {
    setSearchValue(value);
    setSuggestions([]);
    router.push(`/browse?search=${encodeURIComponent(value)}`);
  };

  const handleClearSearch = () => {
    setSearchValue("");
    setSuggestions([]);
  };

  return (
    <div className="bg-ut-orange p-4 text-white flex justify-between items-center shadow-md sticky top-0 z-50">
      <Link
        href="/"
        className="flex items-center gap-2 text-white text-3xl tracking-tight font-bold"
      >
        UT Marketplace
      </Link>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center space-x-6 flex-1 justify-end">
        <form onSubmit={handleSearchSubmit} className="relative max-w-md w-full">
          <SearchInput
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            suggestions={suggestions}
            onSelectSuggestion={handleSuggestionSelect}
            onClear={handleClearSearch}
          />
        </form>
        <Link
          href="/browse"
          className="text-white transition duration-100 font-semibold relative group hover:scale-110"
        >
          Browse
          <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300 " />
        </Link>
        <Link
          href="/my-listings"
          className="text-white hover:text-white transition duration-100 font-semibold relative group hover:scale-110"
        >
          My Listings
          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300" />
        </Link>
        <Link
          href="/create"
          className="text-white hover:text-white transition duration-100 font-semibold relative group hover:scale-110"
        >
          <Plus size={16} className="inline-block mb-1" /> Create
          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300" />
        </Link>

        {user ? (
          <div className="flex items-center space-x-4">
            <Link
              href="/messages"
              className="relative p-2 rounded-full transition-all duration-300 group"
            >
              <MessageCircle size={20} className="text-white relative z-10 group-hover:text-white transition-colors duration-300" />
              <span className="absolute inset-0 bg-white/10 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300 origin-center" />
            </Link>
            <div className="relative">
              <Notifications/>
            </div>
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="relative p-2 rounded-full transition-all duration-300 group"
              >
                <User size={20} className="text-white relative z-10 group-hover:text-white transition-colors duration-300" />
                <span className="absolute inset-0 bg-white/10 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300 origin-center" />
              </button>
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50">
                  <Link
                    href="/profile"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    <User size={16} className="mr-2" />
                    Profile
                  </Link>
                  <Link
                    href="/favorites"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    <Heart size={16} className="mr-2" />
                    Favorites & Watchlist
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    <Settings size={16} className="mr-2" />
                    Settings
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut size={16} className="mr-2" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <Link
            href="/auth/signin"
            className="text-white hover:text-white transition duration-100 font-semibold relative group hover:scale-110"
          >
            Sign In
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300" />
          </Link>
        )}
      </div>

      {/* Mobile menu button */}
      <button
        className="md:hidden text-white"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        {menuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="absolute top-full left-0 right-0 bg-ut-orange md:hidden p-4 z-40 shadow-lg">
          <div className="flex flex-col space-y-4">
            <form onSubmit={handleSearchSubmit} className="relative">
              <SearchInput
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                suggestions={suggestions}
                onSelectSuggestion={handleSuggestionSelect}
                onClear={handleClearSearch}
              />
            </form>
            <Link
              href="/browse"
              className="text-white hover:text-white/80 transition font-semibold flex items-center"
              onClick={() => setMenuOpen(false)}
            >
              Browse
            </Link>
            <Link
              href="/my-listings"
              className="text-white hover:text-white/80 transition font-semibold flex items-center"
              onClick={() => setMenuOpen(false)}
            >
              My Listings
            </Link>
            <Link
              href="/create"
              className="text-white hover:text-white/80 transition font-semibold flex items-center"
              onClick={() => setMenuOpen(false)}
            >
              Create <Plus size={16} className="ml-1" />
            </Link>
            {user ? (
              <>
                <div className="flex items-center space-y-0 space-x-4 border-t border-white/20 pt-4">
                  <Link
                    href="/messages"
                    className="relative p-2 rounded-full transition-all duration-300 group"
                    onClick={() => setMenuOpen(false)}
                  >
                    <MessageCircle size={20} className="text-white relative z-10 group-hover:text-white transition-colors duration-300" />
                    <span className="absolute inset-0 bg-white/10 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300 origin-center" />
                  </Link>
                  <div onClick={() => setMenuOpen(false)} className="flex items-center">
                    <Notifications />
                  </div>
                  <Link
                    href="/profile"
                    className="relative p-2 rounded-full transition-all duration-300 group"
                    onClick={() => setMenuOpen(false)}
                  >
                    <User size={20} className="text-white relative z-10 group-hover:text-white transition-colors duration-300" />
                    <span className="absolute inset-0 bg-white/10 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300 origin-center" />
                  </Link>
                </div>
                <div className="pt-4 space-y-3">
                  <Link
                    href="/profile"
                    className="text-white hover:text-white/80 transition font-semibold flex items-center"
                    onClick={() => setMenuOpen(false)}
                  >
                    <User size={16} className="mr-2" /> Profile
                  </Link>
                  <Link
                    href="/favorites"
                    className="text-white hover:text-white/80 transition font-semibold flex items-center"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Heart size={16} className="mr-2" /> Favorites & Watchlist
                  </Link>
                  <Link
                    href="/settings"
                    className="text-white hover:text-white/80 transition font-semibold flex items-center"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Settings size={16} className="mr-2" /> Settings
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="text-white hover:text-white/80 transition font-semibold text-left flex items-center"
                  >
                    <LogOut size={16} className="mr-2" /> Sign out
                  </button>
                </div>
              </>
            ) : (
              <Link
                href="/auth/signin"
                className="text-white hover:text-white/80 transition font-semibold flex items-center"
                onClick={() => setMenuOpen(false)}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
