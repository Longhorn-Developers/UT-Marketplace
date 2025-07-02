import React from "react";

const BrowseLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="bg-white rounded-xl shadow-md p-10 flex flex-col items-center w-full max-w-xl">
      <div className="mb-6">
        <svg className="h-12 w-12 animate-spin text-[#bf5700]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="#bf5700" d="M4 12a8 8 0 018-8v8z"></path></svg>
      </div>
      <div className="w-full flex flex-col gap-4">
        <div className="h-8 bg-gray-200 rounded w-2/3 mx-auto animate-pulse" />
        <div className="h-6 bg-gray-100 rounded w-1/3 mx-auto animate-pulse" />
        <div className="h-48 bg-gray-100 rounded-xl w-full animate-pulse" />
        <div className="h-4 bg-gray-100 rounded w-1/2 mx-auto animate-pulse" />
        <div className="flex gap-2 mt-4">
          <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
      <span className="text-gray-600 mt-8 text-lg font-medium">Loading listings...</span>
    </div>
  </div>
);

export default BrowseLoader; 