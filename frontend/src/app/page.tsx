"use client";
import { useState, useEffect } from "react";
import Header from "./components/Header";
import UploadCSV from "./components/UploadCSV";

interface Collection {
  name: string;
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
        const response = await fetch("http://localhost:5000/collections");
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
    <div className="bg-white min-h-screen">
      {/* Header */}
      <Header onHomeClick={handleHomeClick} />

      {/* Main Content */}
      <main className="p-6">
        {/* Page Header with "New Data" Button */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-blue-800">Events</h1>
          <button
            onClick={handleNewDataClick}
            className="px-4 py-2 bg-blue-800 text-white rounded-md shadow-sm hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            New Data
          </button>
        </div>

        <hr className="border-gray-300 mb-6" />

        {/* Collections List */}
        <div className="space-y-4">
          {collections.length > 0 ? (
            collections.map((collection, index) => (
              <div
                key={index}
                className="p-4 border border-gray-300 rounded shadow-sm"
              >
                <h2 className="text-lg font-semibold text-gray-800">
                  {collection.name}
                </h2>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No collections found.</p>
          )}
        </div>
      </main>

      {/* Upload CSV Panel */}
      {isPanelOpen && <UploadCSV onClose={handleClosePanel} />}
    </div>
  );
}