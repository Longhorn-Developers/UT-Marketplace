"use client";

import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">
        <header className="space-y-3">
          <h1 className="text-3xl font-bold text-gray-900">About UT Marketplace</h1>
          <p className="text-gray-600">
            UT Marketplace (UTMP) is a student-run platform designed to help University of Texas students buy and sell
            items safely within the campus community. By connecting verified UT users, UTMP makes it easier to find
            affordable items nearby while promoting reuse and reducing waste. Our goal is to create a convenient,
            trustworthy marketplace built specifically for Longhorns.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">How to Use UTMP</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>
              <span className="font-semibold">Create account:</span> Sign up using your UT email (utexas domain) to
              access UT Marketplace. This helps keep the platform limited to the UT community and improves trust
              between buyers and sellers.
            </li>
            <li>
              <span className="font-semibold">Browse or list:</span> Browse items by category or search for something
              specific, or create your own listing if you have something to sell. Listings include photos,
              descriptions, and pricing to help you quickly evaluate items.
            </li>
            <li>
              <span className="font-semibold">Message:</span> Use UTMP messaging to contact buyers or sellers, ask
              questions, and agree on price and pickup details. Keeping communication within UTMP helps maintain a
              record and improves safety.
            </li>
            <li>
              <span className="font-semibold">Meet & exchange:</span> Once you agree on a transaction, meet in a busy
              public location on or near campus to complete the exchange. Inspect items and complete payment in person.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">How to Buy</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>
              <span className="font-semibold">Search & filters:</span> Use search or category, relevance, date, and
              pricing filters to find items you need. Listings include key details like condition, price, and seller
              information.
            </li>
            <li>
              <span className="font-semibold">Contact seller:</span> Message the seller through UTMP to confirm
              availability, ask questions, or arrange a meeting time and location.
            </li>
            <li>
              <span className="font-semibold">Ask questions:</span> Before meeting, clarify the condition, included
              parts, and any defects so there are no surprises during the exchange.
            </li>
            <li>
              <span className="font-semibold">Meet safely:</span> Meet in a well-lit public campus location such as
              academic buildings, libraries, or other busy areas. Avoid private residences or isolated locations.
            </li>
            <li>
              <span className="font-semibold">Inspect before paying:</span> Check that the item matches the listing and
              works as described before completing payment. Only pay after you are satisfied with the item.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">How to Sell</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>
              <span className="font-semibold">Create listing:</span> Post your item with a clear title, category,
              price, and accurate condition. Honest listings build trust and lead to faster sales.
            </li>
            <li>
              <span className="font-semibold">Photos:</span> Upload clear, well-lit photos showing the item from
              multiple angles and any wear or defects. Buyers rely heavily on photos.
            </li>
            <li>
              <span className="font-semibold">Description:</span> Include relevant details such as brand, size,
              condition, included accessories, and pickup preferences. The more specific you are, the fewer questions
              you’ll receive.
            </li>
            <li>
              <span className="font-semibold">Pricing:</span> Set a fair, realistic price based on condition and market
              value. Competitive pricing increases visibility and the likelihood of sale.
            </li>
            <li>
              <span className="font-semibold">Respond to buyers:</span> Reply promptly and communicate clearly about
              availability and meeting logistics. Reliable communication improves trust and completion rates.
            </li>
            <li>
              <span className="font-semibold">Meet safely:</span> Arrange to meet in a public campus location and
              complete payment only after the buyer has inspected the item. Do not share sensitive personal
              information.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">FAQs</h2>
          <div className="space-y-4 text-gray-700">
            <div>
              <p className="font-semibold">Do I need a UT email?</p>
              <p>
                Yes. UT Marketplace currently requires a valid UT email to create an account. This helps keep the
                community limited to UT students and improves safety.
              </p>
            </div>
            <div>
              <p className="font-semibold">Where should we meet?</p>
              <p>
                We recommend busy public campus locations such as academic buildings (GDC, McCombs, Welch, EER, etc),
                the PCL, Texas Union, WCP, or other high-traffic areas. Avoid private residences.
              </p>
            </div>
            <div>
              <p className="font-semibold">What payment methods are recommended?</p>
              <p>
                In-person payment after inspection is recommended. Common methods include cash or peer-to-peer
                payments (e.g., Venmo, Zelle). Avoid paying in advance or using gift cards or wire transfers.
              </p>
            </div>
            <div>
              <p className="font-semibold">Is UTMP free?</p>
              <p>Yes. UT Marketplace is free to use for UT students.</p>
            </div>
            <div>
              <p className="font-semibold">How do I report a user?</p>
              <p>
                You can report a listing or user directly through the Contact Us page or via email
                contact@longhorns.dev. Reports help us review suspicious behavior and maintain a safe marketplace.
              </p>
            </div>
            <div>
              <p className="font-semibold">Can UT alumni use UTMP?</p>
              <p>
                At this time, UTMP is limited to active UT students with valid UT email addresses to maintain a trusted
                campus community.
              </p>
            </div>
            <div>
              <p className="font-semibold">What items are prohibited?</p>
              <p>
                Prohibited items include illegal items, weapons, counterfeit goods, academic materials that violate
                university policy, and anything restricted by UT or local laws. Listings may be removed if they violate
                guidelines. See the{" "}
                <Link href="/terms" className="text-[#bf5700] hover:underline">
                  Terms of Service
                </Link>{" "}
                for more information.
              </p>
            </div>
            <div>
              <p className="font-semibold">What if a buyer/seller doesn’t show up?</p>
              <p>
                Missed meetups can happen. We recommend confirming the time and location shortly before the meeting.
                Repeated no-shows or abuse can be reported within UTMP.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
