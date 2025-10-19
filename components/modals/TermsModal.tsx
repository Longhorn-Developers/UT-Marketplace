"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  FileText, 
  Clock, 
  CheckCircle, 
  Shield, 
  AlertTriangle, 
  Users, 
  Mail, 
  MapPin, 
  UserCheck, 
  Ban, 
  CreditCard, 
  Eye, 
  Trash2, 
  AlertCircle,
  Phone,
  Calendar,
  ExternalLink
} from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-blur-md backdrop-blur-lg bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-gray-100"
          onClick={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <div className="bg-ut-orange text-white">
              <div className="flex items-center justify-between p-6 border-b border-ut-orange">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Terms and Conditions</h2>
                    <p className="text-ut-orange text-sm">UT Marketplace Legal Agreement</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <div className="max-w-none">
                {/* Header Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-[#bf5700]" />
                    <div>
                      <p className="text-gray-600 text-sm">
                        <strong>Last updated:</strong> {new Date().toLocaleDateString()}
                      </p>
                      <p className="text-gray-500 text-xs">Please read these terms carefully before using our service</p>
                    </div>
                  </div>
                </div>

                <section className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-ut-orange bg-opacity-10 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Acceptance of Terms</h3>
                      <p className="text-gray-700 leading-relaxed text-sm">
                        By accessing and using UT Marketplace (&quot;the Service&quot;), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                      </p>
                    </div>
                  </div>
                </section>

                <section className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-ut-orange bg-opacity-10 rounded-lg flex items-center justify-center">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Eligibility</h3>
                      <p className="text-gray-700 leading-relaxed mb-3 text-sm">
                        This service is exclusively available to:
                      </p>
                      <ul className="list-none text-gray-700 space-y-2 ml-0 text-sm">
                        <li className="flex items-start gap-2">
                          <UserCheck className="w-3 h-3 text-ut-orange mt-1.5 flex-shrink-0" />
                          <span>Current students of The University of Texas at Austin</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <UserCheck className="w-3 h-3 text-ut-orange mt-1.5 flex-shrink-0" />
                          <span>Faculty and staff members of The University of Texas at Austin</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <UserCheck className="w-3 h-3 text-ut-orange mt-1.5 flex-shrink-0" />
                          <span>Recent graduates (within 2 years) of The University of Texas at Austin</span>
                        </li>
                      </ul>
                      <div className="mt-3 p-3 bg-orange-50 rounded border-l-2 border-ut-orange">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
                          <p className="text-gray-700 text-xs">
                            <strong>Important:</strong> You must provide a valid @utexas.edu email address to register and use this service.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-[#bf5700] bg-opacity-10 rounded-lg flex items-center justify-center">
                      <Shield className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">3. User Responsibilities</h3>
                      <p className="text-gray-700 leading-relaxed mb-3 text-sm">
                        As a user of UT Marketplace, you agree to:
                      </p>
                      <ul className="list-none text-gray-700 space-y-2 ml-0 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-3 h-3 text-ut-orange mt-1.5 flex-shrink-0" />
                          <span>Provide accurate and truthful information in all listings and communications</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-3 h-3 text-ut-orange mt-1.5 flex-shrink-0" />
                          <span>Respect other users and maintain a professional, courteous demeanor</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-3 h-3 text-ut-orange mt-1.5 flex-shrink-0" />
                          <span>Not engage in fraudulent, deceptive, or illegal activities</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-3 h-3 text-ut-orange mt-1.5 flex-shrink-0" />
                          <span>Comply with all applicable laws and university policies</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-3 h-3 text-ut-orange mt-1.5 flex-shrink-0" />
                          <span>Report suspicious or inappropriate behavior to administrators</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-ut-orange bg-opacity-10 rounded-lg flex items-center justify-center">
                      <Ban className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">4. Prohibited Items and Activities</h3>
                      <p className="text-gray-700 leading-relaxed mb-3 text-sm">
                        The following items and activities are strictly prohibited:
                      </p>
                      <ul className="list-none text-gray-700 space-y-2 ml-0 text-sm">
                        <li className="flex items-start gap-2">
                          <AlertTriangle className="w-3 h-3 text-ut-orange mt-1.5 flex-shrink-0" />
                          <span>Illegal substances, weapons, or dangerous items</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <AlertTriangle className="w-3 h-3 text-ut-orange mt-1.5 flex-shrink-0" />
                          <span>Alcohol, tobacco, or age-restricted products</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <AlertTriangle className="w-3 h-3 text-ut-orange mt-1.5 flex-shrink-0" />
                          <span>Academic materials (tests, assignments, papers) for sale</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <AlertTriangle className="w-3 h-3 text-ut-orange mt-1.5 flex-shrink-0" />
                          <span>Personal information or data of other users</span>
                        </li>
                        <li className="flex items-start gap-2">
                                        <AlertTriangle className="w-3 h-3 text-ut-orange mt-1.5 flex-shrink-0" />
                          <span>Spam, harassment, or abusive content</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <AlertTriangle className="w-3 h-3 text-ut-orange mt-1.5 flex-shrink-0" />
                          <span>Items that violate university policies or local laws</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-ut-orange bg-opacity-10 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">5. Transactions and Payments</h3>
                      <p className="text-gray-700 leading-relaxed mb-3 text-sm">
                        UT Marketplace facilitates connections between buyers and sellers but does not:
                      </p>
                      <ul className="list-none text-gray-700 space-y-2 ml-0 text-sm">
                        <li className="flex items-start gap-2">
                          <AlertCircle className="w-3 h-3 text-ut-orange mt-1.5 flex-shrink-0" />
                          <span>Process payments or handle financial transactions</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <AlertCircle className="w-3 h-3 text-ut-orange mt-1.5 flex-shrink-0" />
                          <span>Guarantee the quality, condition, or authenticity of items</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <AlertCircle className="w-3 h-3 text-ut-orange mt-1.5 flex-shrink-0" />
                          <span>Provide insurance or protection for transactions</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <AlertCircle className="w-3 h-3 text-ut-orange mt-1.5 flex-shrink-0" />
                          <span>Mediate disputes between users</span>
                        </li>
                      </ul>
                      <div className="mt-3 p-3 bg-orange-50 rounded border-l-2 border-ut-orange">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-ut-orange mt-0.5 flex-shrink-0" />
                          <p className="text-gray-700 text-xs">
                            <strong>Recommendation:</strong> All transactions are conducted directly between users. We recommend meeting in safe, public locations and using secure payment methods.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-ut-orange bg-opacity-10 rounded-lg flex items-center justify-center">
                      <Eye className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">6. Privacy and Data Protection</h3>
                      <p className="text-gray-700 leading-relaxed text-sm">
                        We are committed to protecting your privacy. Your personal information will only be used to provide and improve our services. We will not sell, trade, or share your personal information with third parties without your consent, except as required by law or university policy.
                      </p>
                    </div>
                  </div>
                </section>

                <section className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-ut-orange bg-opacity-10 rounded-lg flex items-center justify-center">
                      <Trash2 className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">7. Account Termination</h3>
                      <p className="text-gray-700 leading-relaxed text-sm">
                        We reserve the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or otherwise misuse the service. Users may also terminate their accounts at any time by contacting our support team.
                      </p>
                    </div>
                  </div>
                </section>

                <section className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-ut-orange bg-opacity-10 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">8. Limitation of Liability</h3>
                      <p className="text-gray-700 leading-relaxed text-sm">
                        UT Marketplace is provided &quot;as is&quot; without warranties of any kind. We are not liable for any damages arising from your use of the service, including but not limited to direct, indirect, incidental, or consequential damages.
                      </p>
                    </div>
                  </div>
                </section>

                <section className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-ut-orange bg-opacity-10 rounded-lg flex items-center justify-center">
                      <Clock className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">9. Changes to Terms</h3>
                      <p className="text-gray-700 leading-relaxed text-sm">
                        We reserve the right to modify these terms at any time. Users will be notified of significant changes via email or through the service. Continued use of the service after changes constitutes acceptance of the new terms.
                      </p>
                    </div>
                  </div>
                </section>

                <section className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-[#bf5700] bg-opacity-10 rounded-lg flex items-center justify-center">
                      <Phone className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">10. Contact Information</h3>
                      <p className="text-gray-700 leading-relaxed mb-3 text-sm">
                        If you have any questions about these Terms and Conditions, please contact us at:
                      </p>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Mail className="w-4 h-4 text-ut-orange" />
                            <div>
                              <span className="text-gray-700 font-medium text-sm">Email</span>
                              <p className="text-gray-600 text-xs">support@utmarketplace.com</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <MapPin className="w-4 h-4 text-ut-orange" />
                            <div>
                              <span className="text-gray-700 font-medium text-sm">Address</span>
                              <p className="text-gray-600 text-xs">The University of Texas at Austin</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Clock className="w-4 h-4 text-ut-orange" />
                            <div>
                              <span className="text-gray-700 font-medium text-sm">Office Hours</span>
                              <p className="text-gray-600 text-xs">Monday - Friday, 9:00 AM - 5:00 PM CST</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="mt-6 p-4 bg-orange-50 rounded-lg border-l-2 border-ut-orange">
                  <div className="flex items-start gap-3">
                    <Shield className="w-4 h-4 text-ut-orange mt-0.5 flex-shrink-0" />
                    <p className="text-gray-800 font-medium text-sm">
                      By using UT Marketplace, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-ut-orange" />
                <div>
                  <p className="text-ut-orange font-medium text-sm">Ready to proceed?</p>
                  <p className="text-ut-orange text-xs">Click below to acknowledge and continue</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-ut-orange text-white rounded-lg font-semibold hover:bg-ut-orange transition-colors duration-200 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                I Understand
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TermsModal;
