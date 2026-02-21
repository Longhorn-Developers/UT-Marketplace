import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaPlus, FaSearch, FaStoreAlt, FaShieldAlt, FaUserGraduate, FaMoneyBillWave } from 'react-icons/fa';
import { motion, Variants } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import Logo from '../../public/icons/utmplogo.png';
import Image from 'next/image';

const tagData = [
  { icon: <FaUserGraduate />, label: 'Student-Only', color: 'bg-[#fbeee0] text-[#bf5700]' },
  { icon: <FaShieldAlt />, label: 'Safe & Verified', color: 'bg-green-100 text-green-700' },
  { icon: <FaMoneyBillWave />, label: 'No Fees', color: 'bg-blue-100 text-blue-700' },
];

const taglines = [
  "Where Longhorns trade with Longhorns",
  "Your campus marketplace, simplified",
  "Buy, sell, connect - UT style",
  "The smart way to shop on campus"
];

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
};

const tagVariants: Variants = {
  hidden: { opacity: 0, scale: 0.7, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { delay: 0.5 + i * 0.12, type: 'spring', stiffness: 400, damping: 20 },
  }),
};

const Hero = () => {
  const [currentTaglineIndex, setCurrentTaglineIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(100);

  useEffect(() => {
    const currentTagline = taglines[currentTaglineIndex];
    
    if (!isDeleting) {
      if (currentText.length < currentTagline.length) {
        const timeout = setTimeout(() => {
          setCurrentText(currentTagline.slice(0, currentText.length + 1));
        }, typingSpeed);
        return () => clearTimeout(timeout);
      } else {
        // Pause before deleting
        const timeout = setTimeout(() => {
          setIsDeleting(true);
          setTypingSpeed(50);
        }, 2000);
        return () => clearTimeout(timeout);
      }
    } else {
      if (currentText.length > 0) {
        const timeout = setTimeout(() => {
          setCurrentText(currentText.slice(0, -1));
        }, typingSpeed);
        return () => clearTimeout(timeout);
      } else {
        // Move to next tagline
        setIsDeleting(false);
        setTypingSpeed(100);
        setCurrentTaglineIndex((prev) => (prev + 1) % taglines.length);
      }
    }
  }, [currentText, isDeleting, typingSpeed, currentTaglineIndex]);

  return (
    <motion.section
      className="relative overflow-hidden py-16 px-4 md:px-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Decorative background blob */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.12, scale: 1 }}
        transition={{ duration: 1.2, delay: 0.2 }}
        className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-[#bf5700] rounded-full blur-3xl z-0"
      />
      <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10 text-center md:text-left">
        {/* Left: Text & CTAs */}
        <div className="md:w-1/2 flex flex-col items-center md:items-start">
          <motion.div
            variants={itemVariants}
            className="text-2xl md:text-4xl font-extrabold text-gray-800 mb-6 h-12 md:h-14 flex items-center"
          >
            <span className="text-[#bf5700]">
              {currentText}
              <span className="animate-pulse">|</span>
            </span>
          </motion.div>
          <motion.p
            variants={itemVariants}
            className="text-gray-700 text-lg md:text-xl mb-6 leading-relaxed"
          >
            Buy, sell, and connect with fellow Longhorns. <span className="font-bold text-[#bf5700]">100% student-powered</span> for a safer, smarter campus marketplace.
          </motion.p>
          {/* Animated poppy tags */}
          <div className="flex flex-wrap gap-3 mb-8 justify-center md:justify-start">
            {tagData.map((tag, i) => (
              <motion.span
                key={tag.label}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={tagVariants}
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full font-semibold text-sm shadow-sm ring-1 ring-black/5 ${tag.color}`}
              >
                {tag.icon}
                {tag.label}
              </motion.span>
            ))}
          </div>
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center md:justify-start">
            <Link
              href="/create"
              className="flex items-center justify-center bg-ut-orange text-white px-6 py-3 rounded-lg font-semibold text-lg transition-all duration-300 hover:scale-105 hover:-translate-y-1"
            >
              <FaPlus className="mr-2" />
              Create Listing
            </Link>
            <Link
              href="/browse"
              className="flex items-center justify-center px-6 py-3 rounded-lg font-semibold text-lg transition-all duration-300 border-2 border-ut-orange bg-white text-ut-orange shadow-md hover:scale-105 hover:-translate-y-1"
            >
              <FaSearch className="mr-2" /> Browse Items
            </Link>
          </motion.div>
        </div>
        <motion.div
          variants={itemVariants}
          className="md:w-1/2 flex justify-center items-center"
        >
          <motion.div
            initial={{ scale: 0.8, rotate: -8 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 180, damping: 12 }}
            className="relative"
          >
            <Image src={Logo} alt="UTM Logo" className="text-[180px] md:text-[240px] text-ut-orange drop-shadow-xl animate-pop" />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7, duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
              className="absolute top-0 right-0 text-ut-orange"
            >
              <Sparkles className="h-10 w-10" />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default Hero;