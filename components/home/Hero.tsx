import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { FaPlus, FaSearch } from "react-icons/fa";

const Hero = () => {
  return (
    <section className="px-4 pb-8 pt-10 md:px-6 md:pt-14">
      <div className="mx-auto max-w-6xl rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-10">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 md:text-7xl">
          Marketplace for Longhorns.
        </h1>
        <p className="mt-5 max-w-3xl text-lg text-gray-600 md:text-2xl md:leading-[1.4]">
          Need to sell furniture before move-out, find a sublease, or grab textbooks near campus? Do it in one place.
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-gray-700 md:text-base">
          <span className="inline-flex items-center gap-2">
            <ShieldCheck size={16} className="text-[#bf5700]" />
            UT email required
          </span>
          <span className="text-gray-300">•</span>
          <span>In-app messaging</span>
          <span className="text-gray-300">•</span>
          <span>Admin-reviewed listings</span>
        </div>

        <div className="mt-8 flex items-center gap-4">
          <Link
            href="/create"
            className="inline-flex items-center justify-center rounded-xl bg-[#bf5700] px-6 py-3 text-base font-semibold text-white transition hover:bg-[#a54700]"
          >
            <FaPlus className="mr-3" />
            Create Listing
          </Link>
          <Link
            href="/browse"
            className="inline-flex items-center gap-2 text-base font-semibold text-[#bf5700] underline-offset-4 hover:underline"
          >
            <FaSearch />
            Browse items
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-gray-500">Popular now:</span>
          <Link href="/browse?category=Furniture" className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-gray-700 hover:border-[#bf5700]/40 hover:text-[#bf5700]">
            Furniture
          </Link>
          <Link href="/browse?category=Subleases" className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-gray-700 hover:border-[#bf5700]/40 hover:text-[#bf5700]">
            Subleases
          </Link>
          <Link href="/browse?category=Textbooks" className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-gray-700 hover:border-[#bf5700]/40 hover:text-[#bf5700]">
            Textbooks
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Hero;
