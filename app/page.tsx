import React from "react";
import Hero from "../components/Hero";
import Testomonials from "../components/Testomonials";
import RecentListings from "../components/Recents";
import CategorySection from "../components/CategorySection";

const Home = () => {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-orange-100 via-white overflow-hidden">
      {/* Background Pattern or Overlay */}
      <div
        className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10 pointer-events-none"
        aria-hidden="true"
      />
      <div className="relative z-10">
        <Hero />
        <CategorySection />
        <Testomonials />
        <RecentListings />
      </div>
    </div>
  );
};

export default Home;