import React from 'react';

const CreateButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <button
      onClick={onClick}
      className="group flex items-center h-12 w-6 bg-black rounded-full shadow-lg overflow-hidden transition-all duration-300 hover:w-36 focus:w-20 relative"
      style={{ minWidth: '3rem' }}
    >
      <span
        className="flex items-center justify-center text-white text-2xl transition-colors duration-300 group-hover:text-yellow-400 w-12 h-12"
      >
        +
      </span>
      <span
        className="ml-0 text-white text-lg font-semibold whitespace-nowrap opacity-0 w-0 group-hover:opacity-100 group-hover:w-20 group-hover:ml- transition-all duration-300"
        style={{ transitionProperty: 'opacity, width, margin', minWidth: 0 }}
      >
        Create
      </span>
    </button>
  );
};

export default CreateButton;