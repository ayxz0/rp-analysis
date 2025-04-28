"use client"
import { useState } from "react";
import UploadCSV from "./components/UploadCSV";

export default function Home() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const handleNewDataClick = () => {
    setIsPanelOpen(true); // Open the panel
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false); // Close the panel
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
      {/* New Data Button */}
      <button
        onClick={handleNewDataClick}
        className="rounded bg-purple-500 text-white px-4 py-2 hover:bg-purple-600"
      >
        New Data
      </button>

      {/* Panel for New Data */}
      {isPanelOpen && <UploadCSV onClose={handleClosePanel} />}
    </div>
  );
}