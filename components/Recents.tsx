import Link from "next/link"
import { MessageCircle, User } from "lucide-react"

// Mock data for recent listings
const recentListings = [
  {
    id: 5,
    title: "Dining Table with 4 Chairs",
    price: 200,
    image: "https://placehold.co/400x300?text=Furniture",
    location: "Hyde Park",
    category: "Furniture",
    timePosted: "2 hours ago",
    seller: {
      name: "Jamie L.",
      avatar: "https://i.pravatar.cc/40?img=5",
    },
  },
  {
    id: 6,
    title: "Fall Semester Sublease - Studio",
    price: 950,
    image: "https://placehold.co/400x300?text=Sublease",
    location: "West Campus",
    category: "Subleases",
    timePosted: "5 hours ago",
    seller: {
      name: "Casey R.",
      avatar: "https://i.pravatar.cc/40?img=6",
    },
  },
  {
    id: 7,
    title: 'iPad Pro 12.9" (2021)',
    price: 650,
    image: "https://placehold.co/400x300?text=Tech",
    location: "Dobie Center",
    category: "Tech",
    timePosted: "Yesterday",
    seller: {
      name: "Morgan B.",
      avatar: "https://i.pravatar.cc/40?img=7",
    },
  },
  {
    id: 8,
    title: "Longhorn Game Day Outfit",
    price: 45,
    image: "https://placehold.co/400x300?text=Clothing",
    location: "UT Campus",
    category: "Clothing",
    timePosted: "Yesterday",
    seller: {
      name: "Riley W.",
      avatar: "https://i.pravatar.cc/40?img=8",
    },
  },
  {
    id: 9,
    title: "Mini Fridge - Like New",
    price: 80,
    image: "https://placehold.co/400x300?text=Kitchen",
    location: "Jester Center",
    category: "Kitchen",
    timePosted: "2 days ago",
    seller: {
      name: "Drew H.",
      avatar: "https://i.pravatar.cc/40?img=9",
    },
  },
  {
    id: 10,
    title: "Calculus & Physics Textbooks",
    price: 90,
    image: "https://placehold.co/400x300?text=Textbooks",
    location: "PCL Library",
    category: "Textbooks",
    timePosted: "3 days ago",
    seller: {
      name: "Avery M.",
      avatar: "https://i.pravatar.cc/40?img=10",
    },
  },
]

const RecentListings = () => {
  return (
    <section className="py-12 px-4 md:px-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Recent Listings</h2>
        <Link href="/browse" className="text-orange-600 hover:text-orange-700 font-medium">
          View All
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {recentListings.map((listing) => (
          <Link key={listing.id} href={`/listing/${listing.id}`}>
            <div className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-md transition-shadow flex">
              <div className="w-1/3 relative">
                <img
                  src={listing.image || "/placeholder.svg"}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 w-2/3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                      {listing.category}
                    </span>
                    <h3 className="font-medium text-gray-900 mt-1 line-clamp-1">{listing.title}</h3>
                  </div>
                  <span className="font-bold text-orange-600">${listing.price}</span>
                </div>
                <p className="text-gray-500 text-xs mt-1">{listing.location}</p>
                <div className="flex justify-between items-center mt-3">
                  <div className="flex items-center gap-2">
                    {listing.seller.avatar ? (
                      <img
                        src={listing.seller.avatar}
                        alt={listing.seller.name}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-5 h-5 flex items-center justify-center rounded-full bg-orange-100 text-orange-600">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                    <span className="text-xs text-gray-600">{listing.timePosted}</span>
                  </div>
                  <button className="text-orange-600 hover:text-orange-700">
                    <MessageCircle className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default RecentListings