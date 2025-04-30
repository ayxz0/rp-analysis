"use client";

export default function LoadingPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white text-[var(--color-rp-blue)]">
      <div className="relative w-24 h-24">
        {/* Rotating Circle */}
        <div className="absolute inset-0 border-4 border-t-transparent border-r-transparent border-[var(--color-rp-blue)] rounded-full animate-spin"></div>

        {/* Inner Dot */}
        <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-[var(--color-rp-blue)] rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>

        {/* Orbiting Dot */}
        <div className="absolute top-0 left-1/2 w-3 h-3 bg-[var(--color-rp-blue)] rounded-full animate-orbit"></div>
      </div>
      <p className="absolute bottom-10 text-sm text-gray-500">Loading data...</p>
    </div>
  );
}