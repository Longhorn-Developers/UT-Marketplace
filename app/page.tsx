"use client"
import React, { useEffect, useState } from "react";
import Hero from "../components/home/Hero";
import Testomonials from "../components/home/Testomonials";
import RecentListings from "../components/home/Recents";
import CategorySection from "../components/home/CategorySection";
import { ShieldCheck, MessageCircle, Users, Star, CheckCircle } from 'lucide-react';
import BetaPopup from '../components/home/BetaPopup';
import { FaPlus, FaSearch } from "react-icons/fa";
import { motion, AnimatePresence, Variants } from "framer-motion";
import Link from "next/link";

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
};

const LiveTicker = () => {
  const [messages] = useState([
    "34 items sold in the last hour!",
    "169 new listings today!",
    "26 students browsing now!",
    "500+ positive reviews!",
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
    <span className="text-[#bf5700] font-bold text-lg mt-2">Hook&apos;em!</span>
  </motion.div>
);

const HowItWorks = () => (
  <section className="py-12 px-4 md:px-6 max-w-6xl mx-auto">
    <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
      How It Works
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
    <div className="max-w-4xl mx-auto bg-ut-orange rounded-2xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 p-8 text-white">
      <div className="flex-1">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">Ready to make a deal?</h2>
        <p className="text-lg mb-4">Create a listing or browse hundreds of items from fellow Longhorns!</p>
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center md:justify-start">
            <Link
              href="/create"
              className="flex items-center justify-center bg-ut-orange text-white px-6 py-3 rounded-lg font-semibold text-lg transition-all duration-300 hover:scale-105 hover:-translate-y-1 border-1 border-ut-white"
            >
              <FaPlus className="mr-2" />
              Create Listing
            </Link>
            <Link
              href="/browse"
              className="flex items-center justify-center px-6 py-3 rounded-lg font-semibold text-lg transition-all duration-300  bg-white text-ut-orange shadow-md hover:scale-105 hover:-translate-y-1"
            >
              <FaSearch className="mr-2" /> Browse Items
            </Link>
          </motion.div>
      </div>
      <Mascot />
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
    <div className="relative overflow-hidden">      
      <div className="relative z-10">
        <Hero />
        <LiveTicker />
        <CallToActionBanner />
        <CategorySection />
        <SafetyBadge />
        <HowItWorks />
        <Testomonials />
        <RecentListings />
        <BetaPopup />
      </div>
    </div>
  );
};

export default Home;