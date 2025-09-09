import React from 'react'

const TermsPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-orange-600 mb-2 border-b-2 border-orange-600 pb-2">
          UT Marketplace Terms of Use
        </h1>
        
        <div className="text-sm text-gray-600 mb-8 italic">
          Effective Date: September 9, 2024<br />
          Last Updated: September 9, 2024
        </div>

        <div className="space-y-6 text-gray-800 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-700 mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using UT Marketplace ("the App"), you agree to be bound by these Terms of Use. If you do not agree, please do not use the App.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-700 mb-3">2. Description of Service</h2>
            <p>UT Marketplace is a student-to-student marketplace platform that allows University of Texas students to buy, sell, and trade items within the campus community.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-700 mb-3">3. User Eligibility</h2>
            <p>You must be a current University of Texas student with a valid .utexas.edu email address to use this App. You must be at least 18 years old or have parental consent.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-700 mb-3">4. User Responsibilities</h2>
            <p>You agree to:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Provide accurate information about items you list</li>
              <li>Complete transactions in good faith</li>
              <li>Meet in safe, public locations for exchanges</li>
              <li>Not post illegal, harmful, or inappropriate content</li>
              <li>Not use the App for commercial business purposes</li>
              <li>Respect other users and follow community guidelines</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-700 mb-3">5. Prohibited Items</h2>
            <p>You may not list or sell:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Illegal items or substances</li>
              <li>Weapons or dangerous items</li>
              <li>Stolen goods</li>
              <li>Academic materials that violate academic integrity policies</li>
              <li>Items that infringe intellectual property rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-700 mb-3">6. Transactions and Disputes</h2>
            <p>UT Marketplace facilitates connections between users but is not a party to any transactions. We are not responsible for:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Quality, safety, or legality of items</li>
              <li>Payment processing or disputes</li>
              <li>Meeting arrangements or safety</li>
              <li>Resolution of disagreements between users</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-700 mb-3">7. Content and Intellectual Property</h2>
            <p>You retain ownership of content you post but grant us a license to display it on the App. You may not post content that infringes others' rights or violates these terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-700 mb-3">8. Privacy</h2>
            <p>Your privacy is important to us. Please review our <a href="/privacy" className="text-orange-600 hover:text-orange-800 underline">Privacy Policy</a> to understand how we collect and use your information.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-700 mb-3">9. Account Termination</h2>
            <p>We may suspend or terminate accounts that violate these terms. You may delete your account at any time through the App settings.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-700 mb-3">10. Disclaimers</h2>
            <p className="uppercase font-semibold">The App is provided "as is" without warranties. We disclaim all liability for damages arising from use of the App, including but not limited to issues with transactions, safety, or data loss.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-700 mb-3">11. Limitation of Liability</h2>
            <p className="uppercase font-semibold">To the maximum extent permitted by law, our liability is limited to $100 or the amount you paid to use the App, whichever is less.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-700 mb-3">12. Indemnification</h2>
            <p>You agree to indemnify and hold us harmless from claims arising from your use of the App or violation of these terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-700 mb-3">13. Governing Law</h2>
            <p>These terms are governed by Texas law. Any disputes will be resolved in Travis County, Texas courts.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-700 mb-3">14. Changes to Terms</h2>
            <p>We may update these terms at any time. Continued use of the App after changes constitutes acceptance of the new terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-700 mb-3">15. Severability</h2>
            <p>If any provision of these terms is found invalid, the remaining provisions will continue in effect.</p>
          </section>

          <section className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-700 mb-3">Contact Information</h2>
            <p>For questions about these terms, contact us at:</p>
            <p className="mt-2">
              Email: support@utmarketplace.com<br />
              Website: https://utmarketplace.com
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

export default TermsPage