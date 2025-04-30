"use client";
import { useState, useEffect } from "react";
import Header from "./components/Header";
import UploadCSV from "./components/UploadCSV";
import Event from "./components/Event";

interface Collection {
  name: string;
  author: string;
  uploadDate: string;
}

export default function Home() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);

  const handleNewDataClick = () => {
    setIsPanelOpen(true); // Open the panel
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false); // Close the panel
  };

  const handleHomeClick = () => {
    window.location.href = "/";
  };

  // Fetch collections from the backend
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await fetch("https://rp-analysis.onrender.com/collections");
        if (response.ok) {
          const data = await response.json();
          setCollections(data.collections);
        } else {
          console.error("Failed to fetch collections");
        }
      } catch (error) {
        console.error("Error fetching collections:", error);
      }
    };

    fetchCollections();
  }, []);

  return (
    <div className="bg-white min-h-screen relative">
      {/* Header */}
      <Header onHomeClick={handleHomeClick} />

      {/* Main Content */}
      <main className="p-6">
        {/* Page Header with "New Data" Button */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-[var(--color-rp-blue)]">Events</h1>
          <button
            onClick={handleNewDataClick}
            className="px-4 py-2 border border-[var(--color-rp-blue)] bg-[var(--color-rp-blue)] text-white rounded-md shadow-sm hover:bg-white hover:text-[var(--color-rp-blue)] transition duration-200"
          >
            New Data
          </button>
        </div>

        <hr className="border-gray-300 mb-6" />

        {/* Collections List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.length > 0 ? (
            collections
              .filter((collection) => collection.name !== "system.views") // Exclude "system.views"
              .map((collection, index) => (
                <div
                  key={index}
                  className="transition-shadow duration-200 hover:shadow-lg" // Smooth shadow transition
                >
                  <Event
                    name={collection.name}
                    author={collection.author}
                    uploadDate={collection.uploadDate}
                  />
                </div>
              ))
          ) : (
            <p className="text-gray-500">No collections found.</p>
          )}
        </div>
      </main>

      {/* Upload CSV Panel */}
      {isPanelOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <UploadCSV onClose={handleClosePanel} />
        </div>
      )}
    </div>
  );
}