"use client";

interface HeaderProps {
  onHomeClick: () => void;
}

export default function Header({ onHomeClick }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-300 py-4 px-6 flex items-center">
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
    </header>
  );
}