'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import * as timeago from 'timeago.js';
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Plus,
  Search,
  ShieldCheck,
} from 'lucide-react';
import ListingCard from '../../../browse/components/ListingCard';

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

const conditionLabels: Record<string, string> = {
  new: 'New',
  like_new: 'Like New',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
};

const formatCategory = (value?: string | null) => {
  if (!value) return 'Other';
  const key = value.toLowerCase();
  return categoryLabels[key] || value;
};

const formatCondition = (value?: string | null) => {
  if (!value) return 'Good';
  const key = value.toLowerCase().replace(/\s+/g, '_');
  return conditionLabels[key] || value;
};

const buildSlides = (listingPreview: ReactNode) => ([
  {
    id: 1,
    step: 'Step 1',
    title: 'Welcome to UT Marketplace',
    subtitle: 'A UT-only community for safer buying and selling.',
    points: [
      'Verified @utexas.edu accounts only',
      'Listings reviewed before going live',
      'Built-in reporting and moderation tools',
    ],
    tip: {
      title: 'Privacy tip',
      body: 'Your UT email is never shown publicly. Review the Privacy Policy anytime in Settings or the Privacy page.',
    },
    preview: (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-ut-orange/10 text-ut-orange flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Verified community</p>
              <p className="text-sm font-semibold text-gray-900">UT Marketplace</p>
            </div>
          </div>
          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">Active</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {['Furniture', 'Tech', 'Textbooks', 'Subleases'].map((item) => (
            <div key={item} className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-600">
              {item}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 2,
    step: 'Step 2',
    title: 'Browse and search quickly',
    subtitle: 'Find the right listing with filters and keyword search.',
    points: [
      'Search by title and description',
      'Filter by category and price',
      'Sort newest or oldest listings',
    ],
    preview: (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500">
          <Search size={16} />
          Search “desk lamp”
        </div>
        <div className="mt-4 space-y-3">
          {['Oak desk lamp', 'Dorm desk chair', 'Desk organizer'].map((item, index) => (
            <div key={item} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
              <div>
                <p className="text-sm font-medium text-gray-900">{item}</p>
                <p className="text-xs text-gray-500">Posted {index + 1}h ago</p>
              </div>
              <span className="text-xs font-semibold text-ut-orange">$ {20 + index * 10}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 3,
    step: 'Step 3',
    title: 'Create your listing',
    subtitle: 'Upload photos, set details, and submit for approval.',
    points: [
      'Drafts are saved automatically',
      'Add up to 5 photos per listing',
      'Approval keeps quality high',
    ],
    preview: listingPreview,
  },
  {
    id: 4,
    step: 'Step 4',
    title: 'Chat and coordinate',
    subtitle: 'Keep communication inside the app for safety.',
    points: [
      'Per-listing conversations',
      'Real-time notifications',
      'Meetups around campus spots',
    ],
    preview: (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-full bg-ut-orange/10 text-ut-orange flex items-center justify-center text-xs font-semibold">JS</div>
            <div className="rounded-xl rounded-tl-sm bg-gray-100 px-3 py-2 text-sm text-gray-800">
              Can we meet at PCL at 3?
            </div>
          </div>
          <div className="flex items-start gap-3 justify-end">
            <div className="rounded-xl rounded-tr-sm bg-ut-orange px-3 py-2 text-sm text-white">
              That works. I’ll be there.
            </div>
            <div className="h-9 w-9 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-semibold">You</div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
          <Bell size={14} /> Notifications keep you updated.
        </div>
      </div>
    ),
  },
  {
    id: 5,
    step: 'Step 5',
    title: 'Stay informed and protected',
    subtitle: 'You control your profile, notifications, and privacy settings.',
    points: [
      'Manage notifications in Settings',
      'Review Terms and Privacy Policy any time',
      'Report suspicious activity directly',
    ],
    preview: (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Settings</p>
            <p className="text-sm font-semibold text-gray-900">Notifications & Privacy</p>
          </div>
          <CheckCircle2 size={18} className="text-ut-orange" />
        </div>
        <div className="mt-4 space-y-2 text-xs text-gray-600">
          <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
            <span>Email notifications</span>
            <span className="text-ut-orange font-semibold">On</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
            <span>Browser notifications</span>
            <span className="text-ut-orange font-semibold">On</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
            <span>Privacy policy</span>
            <span className="text-gray-500">View</span>
          </div>
        </div>
      </div>
    ),
  },
]);

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const [latestListing, setLatestListing] = useState<any | null>(null);

  const listingPreview = (
    <div className="max-w-sm ml-auto pointer-events-none">
      <ListingCard
        title={latestListing?.title || 'Ergonomic Desk Chair'}
        price={latestListing?.price ?? 85}
        location={latestListing?.location || 'West Campus'}
        category={latestListing?.category ? formatCategory(latestListing.category) : 'Furniture'}
        timePosted={latestListing?.created_at ? timeago.format(latestListing.created_at) : 'Just now'}
        images={
          latestListing
            ? (latestListing.images && latestListing.images.length > 0 ? latestListing.images : [])
            : ['/pattern.jpg']
        }
        user={{
          name:
            latestListing?.user?.display_name ||
            latestListing?.user?.email?.split('@')[0] ||
            'alexm',
          user_id: latestListing?.user?.id || latestListing?.user_id || 'preview',
          image: latestListing?.user?.profile_image_url || undefined,
        }}
        condition={latestListing?.condition ? formatCondition(latestListing.condition) : 'Good'}
        userRating={latestListing ? undefined : 4.8}
      />
    </div>
  );

  const slides = buildSlides(listingPreview);

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    const checkOnboardingStatus = async () => {
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('onboard_complete')
          .eq('id', user.id)
          .single();

        if (profile?.onboard_complete) {
          router.push('/');
          return;
        }
      }
      setIsLoading(false);
    };

    checkOnboardingStatus();
  }, [user, router]);

  useEffect(() => {
    if (!user?.id) return;

    let isActive = true;

    const fetchLatestListing = async () => {
      try {
        const { data, error } = await supabase
          .from('listings')
          .select(`
            id,
            title,
            price,
            location,
            category,
            condition,
            created_at,
            images,
            user_id,
            user:users!user_id(
              id,
              display_name,
              email,
              profile_image_url
            )
          `)
          .eq('is_draft', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!isActive) return;

        if (error) {
          console.error('Error fetching latest listing:', error);
          setLatestListing(null);
          return;
        }

        setLatestListing(data || null);
      } catch (error) {
        console.error('Error fetching latest listing:', error);
      }
    };

    fetchLatestListing();

    return () => {
      isActive = false;
    };
  }, [user?.id]);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setDirection(1);
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleComplete = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          onboard_complete: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating onboarding status:', error);
      }

      router.push('/');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      router.push('/');
    }
  };

  const goToSlide = (index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-4 border-gray-200 border-t-ut-orange rounded-full"
        />
      </div>
    );
  }

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 120 : -120,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 120 : -120,
      opacity: 0,
    }),
  };

  const activeSlide = slides[currentSlide];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-5xl mx-auto px-6 py-10 lg:py-14">
        <div className="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col h-[720px]">
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-ut-orange text-white flex items-center justify-center text-xs font-semibold">
                  UT
                </div>
                <div>
                  <p className="text-xs text-gray-500">Onboarding</p>
                  <p className="text-sm font-semibold">UT Marketplace</p>
                </div>
              </div>
              <span className="text-xs text-gray-500">{activeSlide.step}</span>
            </div>
          </div>

          <div className="px-6 py-8 lg:py-10 flex-1 overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={activeSlide.id}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ x: { type: 'spring', stiffness: 200, damping: 26 }, opacity: { duration: 0.2 } }}
                className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center h-full w-full"
              >
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">{activeSlide.step}</p>
                  <h1 className="mt-3 text-3xl md:text-4xl font-semibold text-gray-900">
                    {activeSlide.title}
                  </h1>
                  <p className="mt-4 text-lg text-gray-600">
                    {activeSlide.subtitle}
                  </p>
                  <div className="mt-6 space-y-3">
                    {activeSlide.points.map((point) => (
                      <div key={point} className="flex items-start gap-3 text-gray-700">
                        <CheckCircle2 className="mt-1 text-ut-orange" size={18} />
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>

                  {activeSlide.tip && (
                    <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                      <span className="font-semibold text-gray-900">{activeSlide.tip.title}: </span>
                      {activeSlide.tip.body}
                    </div>
                  )}
                </div>
                <div>{activeSlide.preview}</div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="px-6 py-4 border-t border-gray-100 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              onClick={handlePrev}
              disabled={currentSlide === 0}
              className={`flex items-center justify-center gap-2 px-4 py-2 h-11 min-w-[120px] rounded-full text-sm font-medium transition ${
                currentSlide === 0
                  ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                  : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <ChevronLeft size={18} />
              Previous
            </button>

            <div className="flex items-center gap-2 justify-center">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-2.5 rounded-full transition-all ${
                    index === currentSlide
                      ? 'w-8 bg-ut-orange'
                      : 'w-2.5 bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>

            {currentSlide === slides.length - 1 ? (
              <button
                onClick={handleComplete}
                className="flex items-center justify-center gap-2 px-5 py-2 h-11 min-w-[140px] rounded-full bg-ut-orange text-white font-semibold hover:bg-[#a54700] transition"
              >
                Get Started
                <ArrowRight size={18} />
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center justify-center gap-2 px-5 py-2 h-11 min-w-[140px] rounded-full bg-ut-orange text-white font-semibold hover:bg-[#a54700] transition"
              >
                Next
                <ChevronRight size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
