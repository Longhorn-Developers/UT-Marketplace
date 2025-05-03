import React from 'react'
import Link from 'next/link'
import { FaBullhorn, FaPlus, FaSearch, FaStoreAlt } from 'react-icons/fa';

const Hero = () => {
  return (
      <section className="py-16 px-4 md:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10 text-center md:text-left">
          <div className="md:w-1/2">
            <h1 className="text-5xl md:text-6xl font-extrabold text-ut-orange mb-4 drop-shadow-sm flex items-center justify-center md:justify-start gap-3">
              <FaBullhorn className="text-ut-orange" />
              UT Marketplace
            </h1>
            <p className="text-gray-700 text-lg md:text-xl mb-8 leading-relaxed">
              Buy, sell, and connect with fellow Longhorns. Find everything from furniture to subleases, tech, and more!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link
                href="/create"
                className="bg-ut-orange text-white hover:bg-[#d95e00] px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
              >
                <FaPlus className="mr-2" />
                Create Listing
              </Link>
              <Link
                href="/browse"
                className="bg-white text-gray-800 hover:bg-gray-100 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
              >
                <FaSearch className="mr-2" />
                Browse Items
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center text-ut-orange">
            <FaStoreAlt className="text-[180px] md:text-[240px]" />
          </div>
        </div>
      </section>
  )
}

export default Hero
