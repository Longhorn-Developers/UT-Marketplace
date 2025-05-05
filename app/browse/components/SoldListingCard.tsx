import React from "react";
import { CheckCircle2 } from "lucide-react";
import ListingCard from "./ListingCard";
import { ListingCardProps } from "../../props/listing";

interface SoldListingCardProps extends ListingCardProps {
  onClick?: () => void;
}

const SoldListingCard: React.FC<SoldListingCardProps> = ({ onClick, ...props }) => {
  return (
    <div className="relative group cursor-pointer" onClick={onClick}>
      <div className="absolute inset-0 bg-gray-800/50 rounded-xl z-10 flex items-center justify-center">
        <div className="bg-white/90 text-gray-800 px-4 py-2 rounded-full flex items-center gap-2">
          <CheckCircle2 size={16} className="text-green-500" />
          <span className="font-semibold">Sold</span>
        </div>
      </div>
      <ListingCard {...props} />
    </div>
  );
};

export default SoldListingCard; 