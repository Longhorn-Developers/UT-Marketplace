import Link from "next/link";
import { FaUser, FaPlusCircle } from "react-icons/fa";
import NavSearch from "./NavSearch";

const Navbar = () => {
  return (
    <div className="bg-ut-orange text-white px-6 py-5 flex justify-between items-center shadow-md relative">
      <Link href="/" className="text-3xl font-extrabold tracking-tight hover:bg-white/5 p-2 rounded-full transition duration-200 hover:scale-110">
        UT Marketplace
      </Link>
      <div className="flex space-x-6 items-center text-white text-2xl relative">
        <NavSearch />
        <Link
          href="/create"
          title="Sell"
          className="hover:bg-white/20 p-2 rounded-full transition duration-200 hover:scale-110"
        >
          <FaPlusCircle />
        </Link>
        <Link
          href="/profile"
          title="Profile"
          className="hover:bg-white/20 p-2 rounded-full transition duration-200 hover:scale-110"
        >
          <FaUser />
        </Link>
      </div>
    </div>
  );
};

export default Navbar;
