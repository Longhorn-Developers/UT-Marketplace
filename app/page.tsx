"use client"
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Hero from "../components/Hero";
import Testomonials from "../components/Testomonials";
import RecentListings from "../components/Recents";
import CategorySection from "../components/CategorySection";
import { ShieldCheck, Zap, MessageCircle, Users, Star, CheckCircle, Flame, TrendingUp, Smile } from 'lucide-react';

const LiveTicker = () => {
  const [messages] = useState([
    "🔥 34 items sold in the last hour!",
    "🎉 169 new listings today!",
    "👀 26 students browsing now!",
    "⭐ 500+ positive reviews!",
  ]);
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(i => (i + 1) % messages.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [messages.length]);
  return (
    <div className="w-full flex justify-center py-2">
      <div className="bg-orange-50 border border-orange-200 rounded-full px-6 py-2 flex items-center gap-2 text-[#bf5700] font-semibold shadow-sm">
        <motion.span
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
        >
        </motion.span>
        <AnimatePresence mode="wait">
          <motion.span
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="inline-block"
          >
            {messages[index]}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
};

const Mascot = () => (
  <motion.div
    className="hidden md:flex flex-col items-center justify-center"
    initial={{ scale: 0.8, rotate: -10 }}
    animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
    transition={{ duration: 2, repeat: Infinity }}
  >
    <span className="text-[80px] md:text-[120px]">🤘</span>
    <span className="text-[#bf5700] font-bold text-lg mt-2">Hook&apos;em!</span>
  </motion.div>
);

const HowItWorks = () => (
  <section className="py-12 px-4 md:px-6 max-w-6xl mx-auto">
    <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center flex items-center justify-center gap-2">
      <Zap className="text-ut-orange" /> How It Works
    </h2>
    <div className="grid md:grid-cols-4 gap-8">
      <div className="flex flex-col items-center text-center">
        <Users className="w-12 h-12 text-[#bf5700] mb-3" />
        <h3 className="font-semibold mb-1">Sign In</h3>
        <p className="text-gray-500 text-sm">Use your UT email to join the marketplace.</p>
      </div>
      <div className="flex flex-col items-center text-center">
        <Star className="w-12 h-12 text-[#bf5700] mb-3" />
        <h3 className="font-semibold mb-1">Browse or List</h3>
        <p className="text-gray-500 text-sm">Find what you need or post your own items in seconds.</p>
      </div>
      <div className="flex flex-col items-center text-center">
        <MessageCircle className="w-12 h-12 text-[#bf5700] mb-3" />
        <h3 className="font-semibold mb-1">Chat & Meet</h3>
        <p className="text-gray-500 text-sm">Message Longhorns directly and arrange safe meetups.</p>
      </div>
      <div className="flex flex-col items-center text-center">
        <CheckCircle className="w-12 h-12 text-[#bf5700] mb-3" />
        <h3 className="font-semibold mb-1">Buy or Sell</h3>
        <p className="text-gray-500 text-sm">Complete your transaction and leave a review!</p>
      </div>
    </div>
  </section>
);

const CallToActionBanner = () => (
  <section className="relative py-8 px-4 md:px-0">
    <div className="max-w-4xl mx-auto bg-gradient-to-r from-[#bf5700] to-orange-400 rounded-2xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 p-8 text-white">
      <div className="flex-1">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">Ready to make a deal?</h2>
        <p className="text-lg mb-4">Create a listing or browse hundreds of items from fellow Longhorns!</p>
        <div className="flex gap-4">
          <a href="/create" className="bg-white text-[#bf5700] font-semibold px-6 py-2 rounded-lg shadow hover:bg-orange-100 transition">Create Listing</a>
          <a href="/browse" className="bg-[#bf5700] border border-white font-semibold px-6 py-2 rounded-lg hover:bg-orange-600 transition">Browse Items</a>
        </div>
      </div>
      <Mascot />
      <ShieldCheck className="w-24 h-24 text-white/80 hidden md:block" />
    </div>
  </section>
);

const SafetyBadge = () => (
  <div className="flex items-center justify-center gap-2 py-4">
    <ShieldCheck className="text-green-500 animate-pulse" size={28} />
    <span className="text-green-700 font-semibold text-lg">Safe & Secure: UT Students Only</span>
  </div>
);

const Home = () => {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-orange-100 via-white overflow-hidden">
      {/* Background Pattern or Overlay */}
      <div
        className="absolute inset-0 bg-[url('/pattern.jpg')] opacity-30 pointer-events-none"
        aria-hidden="true"
      />
      <div className="relative z-10">
        <Hero />
        <LiveTicker />
        <CallToActionBanner />
        <CategorySection />
        <SafetyBadge />
        <HowItWorks />
        <Testomonials />
        <RecentListings />
      </div>
    </div>
  );
};

export default Home;