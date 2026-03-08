"use client"
import Hero from "../components/home/Hero";
import RecentListings from "../components/home/Recents";
import CategorySection from "../components/home/CategorySection";

const Home = () => {
  return (
    <div className="relative overflow-hidden bg-[#fafafa]">
      <Hero />
      <CategorySection />
      <RecentListings />
    </div>
  );
};

export default Home;
