"use client";

import { useState } from "react";
import { Mail } from "lucide-react";

const SUBJECT_OPTIONS = [
  "General",
  "Account",
  "Report User",
  "Report Bug",
  "Feature Request",
  "Other",
];

export default function ContactPage() {
  const [name, setName] = useState("");
  const [uteid, setUteid] = useState("");
  const [subject, setSubject] = useState(SUBJECT_OPTIONS[0]);
  const [message, setMessage] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedUteid = uteid.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || !trimmedUteid || !trimmedMessage) return;

    const body = [
      `Name: ${trimmedName}`,
      `UT EID: ${trimmedUteid}`,
      `Subject: ${subject}`,
      "",
      trimmedMessage,
    ].join("\n");

    const mailto = `mailto:contact@longhorns.dev?subject=${encodeURIComponent(
      `UT Marketplace - ${subject}`
    )}&body=${encodeURIComponent(body)}`;

    window.location.href = mailto;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Contact Us</h1>
          <p className="text-gray-600">
            Have a question or feedback? Send us a message and we’ll get back to you.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 text-sm text-gray-600">
            <Mail size={16} className="text-[#bf5700]" />
            <span>
              Contact us via email at{" "}
              <span className="font-semibold text-gray-900">contact@longhorns.dev</span>
            </span>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 md:p-8 space-y-6"
        >
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#bf5700] focus:ring-2 focus:ring-[#bf5700]/20"
              placeholder="Your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              UT EID
            </label>
            <input
              type="text"
              required
              value={uteid}
              onChange={(event) => setUteid(event.target.value)}
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#bf5700] focus:ring-2 focus:ring-[#bf5700]/20"
              placeholder="e.g. ab12345"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Subject
            </label>
            <select
              required
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#bf5700] focus:ring-2 focus:ring-[#bf5700]/20 bg-white"
            >
              {SUBJECT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Message / Description
            </label>
            <textarea
              required
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={6}
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#bf5700] focus:ring-2 focus:ring-[#bf5700]/20 resize-none"
              placeholder="Tell us what you need help with..."
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-[#bf5700] text-white font-semibold py-3 text-sm hover:bg-[#a54700] transition"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}
