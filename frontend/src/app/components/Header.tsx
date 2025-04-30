"use client";

import { FaCode } from "react-icons/fa"; // Import a code icon from react-icons

interface HeaderProps {
  onHomeClick: () => void;
}

export default function Header({ onHomeClick }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-300 py-4 px-6 flex items-center justify-between shadow-md">
      {/* Home Button */}
      <button
        onClick={onHomeClick}
        className="flex items-center space-x-2"
      >
        <img
          src="/rp.jpg"
          alt="Home"
          className="h-16 w-16"
        />
      </button>

      {/* Code Icon */}
      <a
        href="https://github.com/ayxz0/rp-analysis"
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
        aria-label="View Source Code"
      >
        <FaCode className="h-10 w-10" />
      </a>
    </header>
  );
}