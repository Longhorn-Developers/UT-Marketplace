"use client";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { MessageCircle, Settings, LogOut, Plus, X, User, Menu, Heart, Compass, List } from "lucide-react";
import { useAuth } from "../../app/context/AuthContext";
import { useRouter } from "next/navigation";
import { fetchPopularSearches } from "../../app/lib/search/popularSearches";
import { fetchSearchSuggestions } from "../../app/lib/search/suggestionsClient";
import SearchInput from "../../app/browse/components/SearchInput";
import Notifications from "./Notifications";

const recentKey = "utm_recent_searches";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [searchValue, setSearchValue] = useState("");
  const [suggestions, setSuggestions] = useState<Array<{ value: string; label: string; type?: string }>>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularSearches, setPopularSearches] = useState<string[]>([]);
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const getScrollTop = (event?: Event) => {
      const target = event?.target;
      if (target && (target as HTMLElement).scrollTop !== undefined) {
        return (target as HTMLElement).scrollTop;
      }
      return (
        document.scrollingElement?.scrollTop ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0
      );
    };
    const handleScroll = (event?: Event) => {
      const scrollTop = getScrollTop(event);
      setIsScrolled(scrollTop > 8);
    };
    handleScroll();
    document.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    return () => document.removeEventListener("scroll", handleScroll, true);
  }, []);

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

  const loadRecentSearches = () => {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(recentKey);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return [];
    }
  };

  const saveRecentSearch = (value: string) => {
    if (typeof window === "undefined") return;
    const trimmed = value.trim();
    if (!trimmed || trimmed.length < 2) return;
    const existing = loadRecentSearches();
    const updated = [trimmed, ...existing.filter((item) => item !== trimmed)].slice(0, 8);
    window.localStorage.setItem(recentKey, JSON.stringify(updated));
    setRecentSearches(updated);
  };

  const removeRecentSearch = (value: string) => {
    if (typeof window === "undefined") return;
    const existing = loadRecentSearches();
    const updated = existing.filter((item) => item !== value);
    window.localStorage.setItem(recentKey, JSON.stringify(updated));
    setRecentSearches(updated);
  };

  useEffect(() => {
    setRecentSearches(loadRecentSearches());
  }, []);

  useEffect(() => {
    const loadPopularSearches = async () => {
      const popular = await fetchPopularSearches(8);
      setPopularSearches(popular);
    };

    loadPopularSearches();
  }, []);

  const handleSearchSubmit = (event?: React.FormEvent) => {
    event?.preventDefault();
    const trimmed = searchValue.trim();
    if (!trimmed) return;
    saveRecentSearch(trimmed);
    router.push(`/browse?search=${encodeURIComponent(trimmed)}`);
  };

  useEffect(() => {
    const term = searchValue.trim().toLowerCase();
    if (!term) {
      const recent = recentSearches.map((value) => ({
        value,
        label: value,
        type: "Recent",
      }));
      const trending = popularSearches.map((value) => ({
        value,
        label: value,
        type: "Trending",
      }));
      setSuggestions([...recent, ...trending].slice(0, 8));
      return;
    }

    if (term.length < 2) {
      const recent = recentSearches
        .filter((value) => value.toLowerCase().includes(term))
        .map((value) => ({
          value,
          label: value,
          type: "Recent",
        }));
      const trending = popularSearches
        .filter((value) => value.toLowerCase().includes(term))
        .map((value) => ({
          value,
          label: value,
          type: "Trending",
        }));
      setSuggestions([...recent, ...trending].slice(0, 8));
      return;
    }

    const handle = window.setTimeout(async () => {
      try {
        const apiSuggestions = await fetchSearchSuggestions(term);
        const recent = recentSearches
          .filter((value) => value.toLowerCase().includes(term))
          .map((value) => ({
            value,
            label: value,
            type: "Recent",
          }));
        const trending = popularSearches
          .filter((value) => value.toLowerCase().includes(term))
          .map((value) => ({
            value,
            label: value,
            type: "Trending",
          }));

        const combined = [...apiSuggestions, ...recent, ...trending];
        const seen = new Set<string>();
        const deduped = combined.filter((item) => {
          const key = item.value.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        setSuggestions(deduped.slice(0, 8));
      } catch (err) {
        console.error("Search suggestions error:", err);
      }
    }, 450);

    return () => window.clearTimeout(handle);
  }, [searchValue, recentSearches, popularSearches]);

  const handleSuggestionSelect = (value: string) => {
    setSearchValue(value);
    setSuggestions([]);
    saveRecentSearch(value);
    router.push(`/browse?search=${encodeURIComponent(value)}`);
  };

  const handleClearSearch = () => {
    setSearchValue("");
    setSuggestions([]);
  };

  const navHoverExpanded =
    "border border-white/25 text-white/90 hover:text-white hover:bg-white/10 hover:border-white/40";
  const navHoverScrolled =
    "border border-gray-200 text-gray-600 hover:text-[#bf5700] hover:border-[#bf5700]/40 hover:bg-[#fff2e6]";
  const navLinkExpanded = `inline-flex items-center justify-center h-10 px-3 rounded-full text-sm font-semibold transition-colors ${navHoverExpanded}`;
  const navIconExpanded = `inline-flex items-center justify-center h-10 w-10 rounded-full transition-colors ${navHoverExpanded}`;
  const navIconScrolled = `inline-flex items-center justify-center h-9 w-9 rounded-full transition-colors ${navHoverScrolled}`;

  return (
    <header className="sticky top-0 z-50 w-full bg-transparent">
      <div
        className={`absolute inset-0 transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isScrolled ? "opacity-0" : "opacity-100"
        } bg-[#bf5700]`}
        aria-hidden="true"
      />
      <div className="relative mx-auto w-full px-4 py-3">
        <div
          className={`mx-auto w-full transform-gpu will-change-transform transition-[width,transform,box-shadow,background-color,border-color,backdrop-filter,padding,border-radius] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isScrolled
              ? "sm:w-[56rem] rounded-full border border-gray-200/70 bg-white/92 backdrop-blur-lg px-4 py-2 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.45)] translate-y-2"
              : "w-full rounded-none px-6 py-3 border border-transparent shadow-none translate-y-0"
          }`}
        >
          {/* Desktop layout */}
          <div
            className={`hidden md:grid w-full items-center grid-cols-[auto_minmax(0,1fr)_auto] ${
              isScrolled ? "gap-1" : "gap-4"
            }`}
          >
            <Link
              href="/"
              className={`text-lg font-semibold tracking-tight transition-colors ${
                isScrolled ? "text-[#bf5700]" : "text-white"
              }`}
            >
              UT Marketplace
            </Link>

            <form
              onSubmit={handleSearchSubmit}
              className={`relative w-full justify-self-center transition-[max-width,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isScrolled ? "max-w-none scale-95" : "max-w-2xl scale-100"
              }`}
            >
              <SearchInput
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                suggestions={suggestions}
                onSelectSuggestion={handleSuggestionSelect}
                onRemoveSuggestion={removeRecentSearch}
                onClear={handleClearSearch}
                onCommit={saveRecentSearch}
                compact={isScrolled}
              />
            </form>

            <div className="flex items-center justify-end gap-2 transition-all duration-300 justify-self-end">
              <Link
                href="/browse"
                className={isScrolled ? navIconScrolled : navLinkExpanded}
              >
                {isScrolled ? <Compass size={18} /> : "Browse"}
              </Link>
              <Link
                href="/my-listings"
                className={isScrolled ? navIconScrolled : navLinkExpanded}
              >
                {isScrolled ? <List size={18} /> : "My Listings"}
              </Link>
              <Link
                href="/create"
                className={isScrolled ? navIconScrolled : navLinkExpanded}
              >
                {isScrolled ? <Plus size={18} /> : "Create"}
              </Link>

              {user ? (
                <>
                  <Link
                    href="/messages"
                    className={isScrolled ? navIconScrolled : navIconExpanded}
                  >
                    <MessageCircle size={18} />
                  </Link>
                  <div className="relative">
                    <Notifications
                      buttonClassName={isScrolled ? navIconScrolled : navIconExpanded}
                    />
                  </div>
                  <div className="relative" ref={profileMenuRef}>
                    <button
                      onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                      className={isScrolled ? navIconScrolled : navIconExpanded}
                    >
                      <User size={18} />
                    </button>
                    {profileMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5 z-50">
                        <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Account</div>
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
                </>
              ) : (
                <Link
                  href="/auth/signin"
                  className={
                    isScrolled
                      ? `inline-flex items-center justify-center h-9 px-3 text-xs font-semibold rounded-full transition-colors ${navHoverScrolled}`
                      : `${navLinkExpanded} px-4`
                  }
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>

          {/* Mobile layout */}
          <div className="flex md:hidden items-center justify-between gap-4">
            <Link
              href="/"
              className={`text-base font-semibold tracking-tight transition-colors ${
                isScrolled ? "text-gray-900" : "text-white"
              }`}
            >
              UT Marketplace
            </Link>
            <button
              className={`rounded-full p-2 transition ${
                isScrolled
                  ? "border border-gray-200 text-gray-700 hover:text-[#bf5700]"
                  : "border border-white/30 text-white hover:bg-white/10"
              }`}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className={`md:hidden border-t px-4 pb-6 pt-4 shadow-lg ${
          isScrolled ? "border-gray-200 bg-white" : "border-white/20 bg-[#bf5700]"
        }`}>
          <div className="flex flex-col space-y-4">
            <form onSubmit={handleSearchSubmit} className="relative">
              <SearchInput
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                suggestions={suggestions}
                onSelectSuggestion={handleSuggestionSelect}
                onClear={handleClearSearch}
                onCommit={saveRecentSearch}
              />
            </form>
            <div className="flex flex-col gap-2">
              <Link
                href="/browse"
                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                  isScrolled
                    ? "border-gray-200 text-gray-700 hover:text-[#bf5700]"
                    : "border-white/30 text-white hover:bg-white/10"
                }`}
                onClick={() => setMenuOpen(false)}
              >
                Browse
              </Link>
              <Link
                href="/my-listings"
                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                  isScrolled
                    ? "border-gray-200 text-gray-700 hover:text-[#bf5700]"
                    : "border-white/30 text-white hover:bg-white/10"
                }`}
                onClick={() => setMenuOpen(false)}
              >
                My Listings
              </Link>
              <Link
                href="/create"
                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                  isScrolled
                    ? "border-[#bf5700]/40 text-[#bf5700] hover:bg-[#fff2e6]"
                    : "border-white/30 text-white hover:bg-white/10"
                }`}
                onClick={() => setMenuOpen(false)}
              >
                Create <Plus size={16} className="ml-1 inline-block" />
              </Link>
            </div>
            {user ? (
              <>
                <div className={`flex items-center gap-3 border-t pt-4 ${
                  isScrolled ? "border-gray-200" : "border-white/20"
                }`}>
                  <Link
                    href="/messages"
                    className={`inline-flex items-center justify-center h-9 w-9 rounded-full border transition ${
                      isScrolled
                        ? "border-gray-200 text-gray-600 hover:text-[#bf5700] hover:border-[#bf5700]/40 hover:bg-[#fff2e6]"
                        : "border-white/30 text-white hover:bg-white/10 hover:border-white/40"
                    }`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <MessageCircle size={18} />
                  </Link>
                  <div onClick={() => setMenuOpen(false)} className="flex items-center">
                    <Notifications
                      buttonClassName={`inline-flex items-center justify-center h-9 w-9 rounded-full border transition ${
                        isScrolled
                          ? "border-gray-200 text-gray-600 hover:text-[#bf5700] hover:border-[#bf5700]/40 hover:bg-[#fff2e6]"
                          : "border-white/30 text-white hover:bg-white/10 hover:border-white/40"
                      }`}
                    />
                  </div>
                  <Link
                    href="/profile"
                    className={`inline-flex items-center justify-center h-9 w-9 rounded-full border transition ${
                      isScrolled
                        ? "border-gray-200 text-gray-600 hover:text-[#bf5700] hover:border-[#bf5700]/40 hover:bg-[#fff2e6]"
                        : "border-white/30 text-white hover:bg-white/10 hover:border-white/40"
                    }`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <User size={18} />
                  </Link>
                </div>
                <div className="pt-2 flex flex-col gap-2">
                  <Link
                    href="/profile"
                    className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                      isScrolled
                        ? "border-gray-200 text-gray-700 hover:text-[#bf5700]"
                        : "border-white/30 text-white hover:bg-white/10"
                    }`}
                    onClick={() => setMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    href="/favorites"
                    className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                      isScrolled
                        ? "border-gray-200 text-gray-700 hover:text-[#bf5700]"
                        : "border-white/30 text-white hover:bg-white/10"
                    }`}
                    onClick={() => setMenuOpen(false)}
                  >
                    Favorites & Watchlist
                  </Link>
                  <Link
                    href="/settings"
                    className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                      isScrolled
                        ? "border-gray-200 text-gray-700 hover:text-[#bf5700]"
                        : "border-white/30 text-white hover:bg-white/10"
                    }`}
                    onClick={() => setMenuOpen(false)}
                  >
                    Settings
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className={`rounded-xl border px-4 py-2 text-left text-sm font-semibold transition ${
                      isScrolled
                        ? "border-gray-200 text-gray-700 hover:text-[#bf5700]"
                        : "border-white/30 text-white hover:bg-white/10"
                    }`}
                  >
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <Link
                href="/auth/signin"
                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                  isScrolled
                    ? "border-gray-200 text-gray-700 hover:text-[#bf5700]"
                    : "border-white/30 text-white hover:bg-white/10"
                }`}
                onClick={() => setMenuOpen(false)}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
