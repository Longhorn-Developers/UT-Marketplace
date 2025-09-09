'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Plus, 
  MessageCircle, 
  Heart, 
  Star, 
  Shield,
  Users,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ArrowRight
} from 'lucide-react';

const slides = [
  {
    id: 1,
    title: "Welcome to UT Marketplace! 🤘",
    subtitle: "The safest way for Longhorns to buy & sell",
    content: (
      <div className="space-y-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <div className="text-8xl mb-4">🤘</div>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            Join thousands of UT students buying and selling everything from textbooks to dorm essentials!
          </p>
        </motion.div>
        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-ut-orange/10 rounded-full flex items-center justify-center mx-auto mb-2">
              <Shield className="w-6 h-6 text-ut-orange" />
            </div>
            <p className="text-sm font-medium">UT Students Only</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-ut-orange/10 rounded-full flex items-center justify-center mx-auto mb-2">
              <Users className="w-6 h-6 text-ut-orange" />
            </div>
            <p className="text-sm font-medium">Campus Community</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-ut-orange/10 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="w-6 h-6 text-ut-orange" />
            </div>
            <p className="text-sm font-medium">Safe & Secure</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 2,
    title: "Browse & Discover",
    subtitle: "Find exactly what you need",
    content: (
      <div className="space-y-6">
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-100"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Search className="w-8 h-8 text-ut-orange" />
            <div className="flex-1 bg-gray-100 rounded-lg px-4 py-2 text-left text-gray-500">
              Search for textbooks, furniture, electronics...
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-orange-50 rounded-lg p-3 text-center">
              <span className="text-2xl mb-1 block">📚</span>
              <p className="text-xs font-medium">Textbooks</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-3 text-center">
              <span className="text-2xl mb-1 block">🛏️</span>
              <p className="text-xs font-medium">Dorm</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-3 text-center">
              <span className="text-2xl mb-1 block">👕</span>
              <p className="text-xs font-medium">Clothing</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-3 text-center">
              <span className="text-2xl mb-1 block">📱</span>
              <p className="text-xs font-medium">Electronics</p>
            </div>
          </div>
        </motion.div>
        <p className="text-gray-600 text-center">
          Browse by category or search for specific items. Save favorites and get notified of new listings!
        </p>
      </div>
    )
  },
  {
    id: 3,
    title: "Create Listings",
    subtitle: "Sell your items in seconds",
    content: (
      <div className="space-y-6">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-ut-orange/10 to-orange-100/50 rounded-2xl p-6"
        >
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-ut-orange rounded-full flex items-center justify-center">
              <Plus className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 bg-white/80 rounded-lg p-3">
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
              <div className="flex-1">
                <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
                <div className="h-2 bg-gray-100 rounded w-1/2"></div>
              </div>
            </div>
            <div className="text-center py-2">
              <span className="text-2xl font-bold text-ut-orange">$25</span>
            </div>
            <div className="flex space-x-2">
              <button className="flex-1 bg-ut-orange text-white py-2 rounded-lg text-sm font-medium">
                Post Listing
              </button>
            </div>
          </div>
        </motion.div>
        <p className="text-gray-600 text-center">
          Take photos, set your price, and post! Your listing goes live instantly to fellow Longhorns.
        </p>
      </div>
    )
  },
  {
    id: 4,
    title: "Chat & Connect",
    subtitle: "Message buyers and sellers directly",
    content: (
      <div className="space-y-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl"
        >
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
              <div className="flex-1">
                <div className="bg-gray-100 rounded-2xl rounded-tl-sm p-3 text-sm">
                  Hey! Is this textbook still available?
                </div>
                <p className="text-xs text-gray-500 mt-1">Sarah • 2m ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 justify-end">
              <div className="flex-1">
                <div className="bg-ut-orange text-white rounded-2xl rounded-tr-sm p-3 text-sm ml-auto max-w-xs">
                  Yes! Can meet at PCL this afternoon 📚
                </div>
                <p className="text-xs text-gray-500 mt-1 text-right">You • now</p>
              </div>
              <div className="w-8 h-8 bg-ut-orange rounded-full flex items-center justify-center">
                <span className="text-white text-sm">You</span>
              </div>
            </div>
          </div>
        </motion.div>
        <p className="text-gray-600 text-center">
          Built-in messaging lets you coordinate pickups, ask questions, and negotiate prices safely.
        </p>
      </div>
    )
  },
  {
    id: 5,
    title: "You're All Set! 🎉",
    subtitle: "Start exploring the marketplace",
    content: (
      <div className="space-y-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <div className="text-6xl mb-4">🎯</div>
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-ut-orange/10 to-orange-100/30 rounded-xl p-4"
            >
              <Search className="w-8 h-8 text-ut-orange mx-auto mb-2" />
              <h4 className="font-semibold text-gray-800 mb-1">Browse Items</h4>
              <p className="text-sm text-gray-600">Find great deals from fellow students</p>
            </motion.div>
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="bg-gradient-to-br from-ut-orange/10 to-orange-100/30 rounded-xl p-4"
            >
              <Plus className="w-8 h-8 text-ut-orange mx-auto mb-2" />
              <h4 className="font-semibold text-gray-800 mb-1">Create Listing</h4>
              <p className="text-sm text-gray-600">Sell items you no longer need</p>
            </motion.div>
          </div>
        </motion.div>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-orange-50 border border-orange-200 rounded-xl p-4"
        >
          <div className="flex items-center space-x-2 text-ut-orange">
            <Star className="w-5 h-5" />
            <span className="font-semibold">Pro Tip:</span>
          </div>
          <p className="text-gray-700 mt-1 text-sm">
            Use your UT email to verify your student status and build trust with other Longhorns!
          </p>
        </motion.div>
      </div>
    )
  }
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    // If user is not authenticated, redirect to sign in
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    
    // Check if user has already completed onboarding
    const checkOnboardingStatus = async () => {
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('onboard_complete')
          .eq('id', user.id)
          .single();
          
        if (profile?.onboard_complete) {
          // User has already completed onboarding, redirect to home
          router.push('/');
          return;
        }
      }
      setIsLoading(false);
    };
    
    checkOnboardingStatus();
  }, [user, router]);

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
      // Mark onboarding as complete
      const { error } = await supabase
        .from('users')
        .update({ 
          onboard_complete: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
        
      if (error) {
        console.error('Error updating onboarding status:', error);
      }
      
      // Redirect to home page
      router.push('/');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Still redirect even if there's an error
      router.push('/');
    }
  };

  const goToSlide = (index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-ut-orange/20 border-t-ut-orange rounded-full"
        />
      </div>
    );
  }

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex flex-col">
      {/* Header with progress bar */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-ut-orange flex items-center gap-2">
              UT Marketplace
              <span className="text-lg">🤘</span>
            </h1>
            <span className="text-sm text-gray-600">
              {currentSlide + 1} of {slides.length}
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-ut-orange to-orange-400 h-2 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          
          {/* Dot indicators */}
          <div className="flex justify-center space-x-2 mt-4">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentSlide 
                    ? 'bg-ut-orange scale-125' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentSlide}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              className="text-center"
            >
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-3xl md:text-4xl font-bold text-gray-900 mb-2"
              >
                {slides[currentSlide].title}
              </motion.h2>
              
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="text-lg text-gray-600 mb-8"
              >
                {slides[currentSlide].subtitle}
              </motion.p>
              
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {slides[currentSlide].content}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white/80 backdrop-blur-sm border-t border-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrev}
              disabled={currentSlide === 0}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                currentSlide === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Previous</span>
            </button>

            {currentSlide === slides.length - 1 ? (
              <motion.button
                onClick={handleComplete}
                className="flex items-center space-x-2 bg-gradient-to-r from-ut-orange to-orange-500 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>Get Started</span>
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center space-x-2 bg-ut-orange text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-all"
              >
                <span>Next</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
