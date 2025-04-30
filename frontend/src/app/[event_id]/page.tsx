"use client";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Header from ".././components/Header";
import Graph from ".././components/Graph";
import DataPanel from ".././components/DataPanel";
import LoadingPage from ".././components/LoadingPage"; // Import the new component

export default function EventPage() {
  const { event_id } = useParams() ?? {}; // Get the event ID from the URL
  const eventId = Array.isArray(event_id) ? event_id[0] : event_id ?? ""; // Ensure event_id is a string
  const [labels, setLabels] = useState<string[]>([]);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleHomeClick = () => {
    window.location.href = "/"; // Navigate back to the home page
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`http://localhost:5000/${event_id}/manifold`);
        if (!response.ok) {
          throw new Error("Failed to fetch manifold data");
        }
        const result = await response.json();

        // Process the data for Chart.js
        const labels = result.data.map((point: any) => (point.Time).toFixed(2)); // Convert nanoseconds to seconds
        const manifoldData = result.data.map((point: any) => point.Manifold);
        console.log("Labels:", labels); // Debugging
        setLabels(labels);
        setDatasets([
          {
            label: "Manifold",
            data: manifoldData,
            borderColor: "#1c2f50",
            backgroundColor: "rgba(28, 47, 80, 0.2)",
          },
        ]);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
        setLoading(false);
      }
    };

    fetchData();
  }, [event_id]);

  if (loading) return <LoadingPage />; // Use the new LoadingPage component
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <Header onHomeClick={handleHomeClick} />

      {/* Event Content */}
      <div className="p-6">
        <h1 className="text-3xl font-bold text-rp-blue mb-4">{event_id}</h1>
        <p className="text-gray-600 mb-6">Below is the graph for the event data:</p>

        {/* Layout for Graph and Data Panel */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Graph Panel */}
          <div className="flex-1 p-4 border border-gray-300 rounded shadow-sm bg-white">
            <Graph
              labels={labels}
              datasets={datasets}
              xAxisLabel="Time (s)"
              yAxisLabel="Manifold (PSI)"
            />
          </div>

          {/* Data Panel */}
          <div className="w-full lg:w-1/3 p-4 border border-gray-300 rounded shadow-sm bg-white">
            <DataPanel />
          </div>
        </div>
      </div>
    </div>
  );
}