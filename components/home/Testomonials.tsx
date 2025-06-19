import { Star, User, MessageCircle } from "lucide-react"

const testimonials = [
  {
    name: "Emily R.",
    rating: 5,
    message: "I listed my couch and sold it within hours. So easy to use and great for UT students!",
  },
  {
    name: "Jordan M.",
    rating: 5,
    message: "Helped me find a sublease super fast. Feels way more secure knowing it's all UT people.",
  },
  {
    name: "Taylor S.",
    rating: 4,
    message: "I’ve bought two things on here already. Love how it’s just for Longhorns.",
  },
]

const Testomonials = () => {
  return (
    <section className="py-12 px-4 md:px-6 max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center flex items-center justify-center gap-2">
        <MessageCircle className="text-ut-orange" />
        What Students Are Saying
      </h2>
      <div className="grid gap-8 md:grid-cols-3">
        {testimonials.map((t, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-orange-100 text-orange-600 rounded-full p-2">
                <User className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{t.name}</p>
                <div className="flex text-yellow-400">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-yellow-400 stroke-yellow-400" />
                  ))}
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-700 italic">“{t.message}”</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Testomonials;
