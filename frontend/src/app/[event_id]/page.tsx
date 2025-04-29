"use client";
import { useParams } from "next/navigation";
import Header from "../components/Header";

export default function EventPage() {
  const { event_id } = useParams(); // Get the event ID from the URL

  const handleHomeClick = () => {
    window.location.href = "/"; // Navigate back to the home page
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <Header onHomeClick={handleHomeClick} />

      {/* Event Content */}
      <div className="p-6">
        <h1 className="text-3xl font-bold text-rp-blue mb-4">{event_id}</h1>
        <p className="text-gray-600">Details for event "{event_id}" will go here.</p>
      </div>
    </div>
  );
}