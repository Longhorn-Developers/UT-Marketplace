import React from 'react';

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#bf5700] to-[#a54700] text-white p-8">
            <h1 className="text-4xl font-bold mb-2">Terms and Conditions</h1>
            <p className="text-xl text-white/90">
              UT Marketplace - The official marketplace for UT Austin community
            </p>
            <p className="text-sm text-white/80 mt-2">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* Content */}
          <div className="p-8 prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing and using UT Marketplace (&quot;the Service&quot;), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Eligibility</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                This service is exclusively available to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Current students of The University of Texas at Austin</li>
                <li>Faculty and staff members of The University of Texas at Austin</li>
                <li>Recent graduates (within 2 years) of The University of Texas at Austin</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                You must provide a valid @utexas.edu email address to register and use this service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Responsibilities</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                As a user of UT Marketplace, you agree to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Provide accurate and truthful information in all listings and communications</li>
                <li>Respect other users and maintain a professional, courteous demeanor</li>
                <li>Not engage in fraudulent, deceptive, or illegal activities</li>
                <li>Comply with all applicable laws and university policies</li>
                <li>Report suspicious or inappropriate behavior to administrators</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Prohibited Items and Activities</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                The following items and activities are strictly prohibited:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Illegal substances, weapons, or dangerous items</li>
                <li>Alcohol, tobacco, or age-restricted products</li>
                <li>Academic materials (tests, assignments, papers) for sale</li>
                <li>Personal information or data of other users</li>
                <li>Spam, harassment, or abusive content</li>
                <li>Items that violate university policies or local laws</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Transactions and Payments</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                UT Marketplace facilitates connections between buyers and sellers but does not:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Process payments or handle financial transactions</li>
                <li>Guarantee the quality, condition, or authenticity of items</li>
                <li>Provide insurance or protection for transactions</li>
                <li>Mediate disputes between users</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                All transactions are conducted directly between users. We recommend meeting in safe, public locations and using secure payment methods.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Privacy and Data Protection</h2>
              <p className="text-gray-700 leading-relaxed">
                We are committed to protecting your privacy. Your personal information will only be used to provide and improve our services. We will not sell, trade, or share your personal information with third parties without your consent, except as required by law or university policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Account Termination</h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or otherwise misuse the service. Users may also terminate their accounts at any time by contacting our support team.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed">
                UT Marketplace is provided &quot;as is&quot; without warranties of any kind. We are not liable for any damages arising from your use of the service, including but not limited to direct, indirect, incidental, or consequential damages.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Changes to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to modify these terms at any time. Users will be notified of significant changes via email or through the service. Continued use of the service after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Contact Information</h2>
              <p className="text-gray-700 leading-relaxed">
                If you have any questions about these Terms and Conditions, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> support@utmarketplace.com<br />
                  <strong>Address:</strong> The University of Texas at Austin<br />
                  <strong>Office Hours:</strong> Monday - Friday, 9:00 AM - 5:00 PM CST
                </p>
              </div>
            </section>

            <div className="mt-8 p-6 bg-[#bf5700] bg-opacity-10 rounded-lg border-l-4 border-[#bf5700]">
              <p className="text-gray-800 font-medium text-lg">
                By using UT Marketplace, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;