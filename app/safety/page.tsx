"use client";

import Link from "next/link";

export default function SafetyTipsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Safety Tips</h1>
          <p className="text-gray-600">
            Your safety matters to us. UT Marketplace is built for the UT community, but it’s still important to take
            precautions when buying, selling, or meeting others.
          </p>
        </header>

        <section className="space-y-4 text-gray-700">
          <ul className="list-disc pl-6 space-y-3">
            <li>
              <span className="font-semibold">Meet in safe, public places:</span> Always meet in busy, well-lit public
              locations on or near campus, like academic buildings, libraries, or cafés. Avoid private residences or
              isolated areas, especially for first-time exchanges. Some locations we suggest:
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Perry-Castañeda Library (PCL)</li>
                <li>Student Union</li>
                <li>UT Tower Plaza</li>
                <li>Student Activity Center (WCP)</li>
                <li>Littlefield Fountain</li>
              </ul>
            </li>
            <li>
              <span className="font-semibold">Inspect items before paying:</span> Check that the item matches the
              listing and works as described before completing payment.
            </li>
            <li>
              <span className="font-semibold">Use secure payment methods:</span> Avoid wire transfers, gift cards, or
              payment requests from strangers. Prefer in-person payment after inspection or trusted platforms.
            </li>
            <li>
              <span className="font-semibold">Keep communication on UT Marketplace:</span> Staying within UTMP messages
              helps maintain a record and reduces scams. Be cautious if someone pushes to move immediately to text or
              external apps.
            </li>
            <li>
              <span className="font-semibold">Watch for common scam signs:</span> Be cautious if someone exhibits
              suspicious behavior, including but not limited to refusing to meet in person, asking for deposits or
              shipping fees, offering prices that seem too good to be true, using urgent pressure (“must sell today”),
              avoiding or refusing to answer basic questions, or requesting payment before you see the item.
            </li>
            <li>
              <span className="font-semibold">Trust your instincts:</span> If something feels off, it probably is.
              You’re never obligated to complete a transaction.
            </li>
            <li>
              <span className="font-semibold">Report suspicious behavior:</span> If you encounter scams, harassment, or
              unsafe situations, report the listing or user through the{" "}
              <Link href="/contact" className="text-[#bf5700] hover:underline">
                Contact Us
              </Link>{" "}
              page or by email contact@longhorns.dev so we can take action.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
