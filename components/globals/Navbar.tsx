"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Compass,
  Heart,
  List,
  LogOut,
  Menu,
  MessageCircle,
  Plus,
  Settings,
  User,
  X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../../app/context/AuthContext";
import { fetchPopularSearches } from "../../app/lib/search/popularSearches";
import { fetchSearchSuggestions } from "../../app/lib/search/suggestionsClient";
import SearchInput from "../../app/browse/components/SearchInput";
import Notifications from "./Notifications";

const recentKey = "utm_recent_searches";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [suggestions, setSuggestions] = useState<Array<{ value: string; label: string; type?: string }>>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularSearches, setPopularSearches] = useState<string[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);

  const activeScrollContainerRef = useRef<HTMLElement | null>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const { user, isAdmin, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const SCROLL_ENTER = 20;
    const SCROLL_EXIT = 8;
    let rafId: number | null = null;

    const isScrollableElement = (value: unknown): value is HTMLElement => {
      if (!(value instanceof HTMLElement)) return false;
      return value.scrollHeight > value.clientHeight + 1;
    };

    const getRelevantScrollTop = (event?: Event) => {
      const target = event?.target;
      const pageScrollTop =
        window.scrollY ||
        document.scrollingElement?.scrollTop ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;

      if (isScrollableElement(target)) {
        const isDocumentScrollTarget =
          target === document.documentElement ||
          target === document.body ||
          target === document.scrollingElement;

        if (!isDocumentScrollTarget && (target.scrollTop > 0 || activeScrollContainerRef.current === target)) {
          activeScrollContainerRef.current = target;
        }
      }

      const activeContainer = activeScrollContainerRef.current;
      if (activeContainer && !document.body.contains(activeContainer)) {
        activeScrollContainerRef.current = null;
      }

      const nestedScrollTop = activeScrollContainerRef.current?.scrollTop || 0;
      return Math.max(pageScrollTop, nestedScrollTop);
    };

    const updateScrolledState = (event?: Event) => {
      const scrollTop = getRelevantScrollTop(event);
      setIsScrolled((prev) => (prev ? scrollTop > SCROLL_EXIT : scrollTop > SCROLL_ENTER));
    };

    const handleCapturedScroll = (event: Event) => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        updateScrolledState(event);
      });
    };

    const handleResize = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        updateScrolledState();
      });
    };

    updateScrolledState();
    document.addEventListener("scroll", handleCapturedScroll, { passive: true, capture: true });
    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      document.removeEventListener("scroll", handleCapturedScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setProfileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  const handleSignOut = async () => {
    await signOut();
    setProfileMenuOpen(false);
    setMenuOpen(false);
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
    const loadPopular = async () => {
      const popular = await fetchPopularSearches(8);
      setPopularSearches(popular);
    };

    loadPopular();
  }, []);

  const handleSearchSubmit = (event?: React.FormEvent) => {
    event?.preventDefault();
    const trimmed = searchValue.trim();
    if (!trimmed) return;
    saveRecentSearch(trimmed);
    setMenuOpen(false);
    router.push(`/browse?search=${encodeURIComponent(trimmed)}`);
  };

  useEffect(() => {
    const term = searchValue.trim().toLowerCase();

    if (!term) {
      const recent = recentSearches.map((value) => ({ value, label: value, type: "Recent" }));
      const trending = popularSearches.map((value) => ({ value, label: value, type: "Trending" }));
      setSuggestions([...recent, ...trending].slice(0, 8));
      return;
    }

    if (term.length < 2) {
      const recent = recentSearches
        .filter((value) => value.toLowerCase().includes(term))
        .map((value) => ({ value, label: value, type: "Recent" }));
      const trending = popularSearches
        .filter((value) => value.toLowerCase().includes(term))
        .map((value) => ({ value, label: value, type: "Trending" }));
      setSuggestions([...recent, ...trending].slice(0, 8));
      return;
    }

    const timeout = window.setTimeout(async () => {
      try {
        const apiSuggestions = await fetchSearchSuggestions(term);
        const recent = recentSearches
          .filter((value) => value.toLowerCase().includes(term))
          .map((value) => ({ value, label: value, type: "Recent" }));
        const trending = popularSearches
          .filter((value) => value.toLowerCase().includes(term))
          .map((value) => ({ value, label: value, type: "Trending" }));

        const combined = [...apiSuggestions, ...recent, ...trending];
        const seen = new Set<string>();
        const deduped = combined.filter((item) => {
          const key = item.value.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        setSuggestions(deduped.slice(0, 8));
      } catch (error) {
        console.error("Search suggestions error:", error);
      }
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [searchValue, recentSearches, popularSearches]);

  const handleSuggestionSelect = (value: string) => {
    setSearchValue(value);
    setSuggestions([]);
    saveRecentSearch(value);
    setMenuOpen(false);
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
  const navLinkExpanded = `inline-flex h-10 items-center justify-center rounded-full px-3 text-sm font-semibold transition-colors ${navHoverExpanded}`;
  const navIconExpanded = `inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors ${navHoverExpanded}`;
  const navIconScrolled = `inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors ${navHoverScrolled}`;
  const mobileItemClass =
    "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50";

  return (
    <header className="sticky top-0 z-50 w-full">
      <div
        className={`absolute inset-0 hidden bg-[#bf5700] transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:block ${
          isScrolled ? "opacity-0" : "opacity-100"
        }`}
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full px-4 py-3">
        <div
          className={`mx-auto hidden w-full transform-gpu will-change-transform transition-[width,transform,box-shadow,background-color,border-color,backdrop-filter,padding,border-radius] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:block ${
            isScrolled
              ? "sm:w-[56rem] rounded-full border border-gray-200/70 bg-white/92 px-4 py-2 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.45)] backdrop-blur-lg translate-y-2"
              : "w-full rounded-none border border-transparent px-6 py-3 shadow-none translate-y-0"
          }`}
        >
          <div className={`grid w-full items-center grid-cols-[auto_minmax(0,1fr)_auto] ${isScrolled ? "gap-1" : "gap-4"}`}>
            <Link href="/" className={`text-lg font-semibold tracking-tight transition-colors ${isScrolled ? "text-[#bf5700]" : "text-white"}`}>
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

            <div className="flex items-center justify-end gap-2 justify-self-end">
              <Link href="/browse" className={isScrolled ? navIconScrolled : navLinkExpanded}>
                {isScrolled ? <Compass size={18} /> : "Browse"}
              </Link>
              <Link href="/my-listings" className={isScrolled ? navIconScrolled : navLinkExpanded}>
                {isScrolled ? <List size={18} /> : "My Listings"}
              </Link>
              <Link href="/create" className={isScrolled ? navIconScrolled : navLinkExpanded}>
                {isScrolled ? <Plus size={18} /> : "Create"}
              </Link>

              {user ? (
                <>
                  <Link href="/messages" className={isScrolled ? navIconScrolled : navIconExpanded}>
                    <MessageCircle size={18} />
                  </Link>
                  <Notifications buttonClassName={isScrolled ? navIconScrolled : navIconExpanded} />
                  <div className="relative" ref={profileMenuRef}>
                    <button
                      type="button"
                      onClick={() => setProfileMenuOpen((prev) => !prev)}
                      className={isScrolled ? navIconScrolled : navIconExpanded}
                    >
                      <User size={18} />
                    </button>
                    {profileMenuOpen && (
                      <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5">
                        <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Account</div>
                        <Link href="/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setProfileMenuOpen(false)}>
                          <User size={16} className="mr-2" />
                          Profile
                        </Link>
                        <Link href="/favorites" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setProfileMenuOpen(false)}>
                          <Heart size={16} className="mr-2" />
                          Favorites & Watchlist
                        </Link>
                        <Link href="/settings" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setProfileMenuOpen(false)}>
                          <Settings size={16} className="mr-2" />
                          Settings
                        </Link>
                        {isAdmin && (
                          <Link href="/admin" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setProfileMenuOpen(false)}>
                            <List size={16} className="mr-2" />
                            Admin
                          </Link>
                        )}
                        <button onClick={handleSignOut} className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
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
                      ? `inline-flex h-9 items-center justify-center rounded-full px-3 text-xs font-semibold transition-colors ${navHoverScrolled}`
                      : `${navLinkExpanded} px-4`
                  }
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm md:hidden">
          <Link href="/" className="text-base font-semibold tracking-tight text-gray-900">
            UT Marketplace
          </Link>
          <div className="flex items-center gap-2">
            {user && (
              <Notifications buttonClassName="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-[#bf5700]/40 hover:bg-[#fff2e6] hover:text-[#bf5700]" />
            )}
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-700 transition hover:border-[#bf5700]/40 hover:bg-[#fff2e6] hover:text-[#bf5700]"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav-menu"
            >
              {menuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/25 md:hidden"
            onClick={() => setMenuOpen(false)}
            aria-label="Close mobile menu backdrop"
          />
          <div
            id="mobile-nav-menu"
            className="fixed inset-x-3 top-[76px] z-50 max-h-[calc(100vh-88px)] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-4 shadow-xl md:hidden"
          >
            <form onSubmit={handleSearchSubmit} className="relative">
              <SearchInput
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                suggestions={suggestions}
                onSelectSuggestion={handleSuggestionSelect}
                onRemoveSuggestion={removeRecentSearch}
                onClear={handleClearSearch}
                onCommit={saveRecentSearch}
              />
            </form>

            <nav className="mt-3 space-y-1 border-b border-gray-200 pb-3">
              <Link href="/browse" className={mobileItemClass} onClick={() => setMenuOpen(false)}>
                <Compass size={18} className="text-[#bf5700]" />
                Browse
              </Link>
              <Link href="/my-listings" className={mobileItemClass} onClick={() => setMenuOpen(false)}>
                <List size={18} className="text-[#bf5700]" />
                My Listings
              </Link>
              <Link href="/create" className={mobileItemClass} onClick={() => setMenuOpen(false)}>
                <Plus size={18} className="text-[#bf5700]" />
                Create
              </Link>
            </nav>

            {user ? (
              <div className="pt-3 space-y-1">
                <Link href="/messages" className={mobileItemClass} onClick={() => setMenuOpen(false)}>
                  <MessageCircle size={18} className="text-[#bf5700]" />
                  Messages
                </Link>
                <Link href="/profile" className={mobileItemClass} onClick={() => setMenuOpen(false)}>
                  <User size={18} className="text-[#bf5700]" />
                  Profile
                </Link>
                <Link href="/favorites" className={mobileItemClass} onClick={() => setMenuOpen(false)}>
                  <Heart size={18} className="text-[#bf5700]" />
                  Favorites & Watchlist
                </Link>
                <Link href="/settings" className={mobileItemClass} onClick={() => setMenuOpen(false)}>
                  <Settings size={18} className="text-[#bf5700]" />
                  Settings
                </Link>
                {isAdmin && (
                  <Link href="/admin" className={mobileItemClass} onClick={() => setMenuOpen(false)}>
                    <List size={18} className="text-[#bf5700]" />
                    Admin
                  </Link>
                )}
                <button type="button" onClick={handleSignOut} className={`${mobileItemClass} w-full`}>
                  <LogOut size={18} className="text-[#bf5700]" />
                  Sign out
                </button>
              </div>
            ) : (
              <div className="pt-3">
                <Link href="/auth/signin" className={mobileItemClass} onClick={() => setMenuOpen(false)}>
                  <User size={18} className="text-[#bf5700]" />
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </header>
  );
};

export default Navbar;
