"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

export default function DataPanel() {
  const { event_id } = useParams(); // Get the event_id from the URL
  const [burnTime, setBurnTime] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBurnTime = async () => {
      try {
        if (!event_id) {
          throw new Error("Event ID is missing");
        }

        const response = await fetch(`http://localhost:5000/${event_id}/burntime`);
        if (!response.ok) {
          throw new Error("Failed to fetch burn time");
        }
        const result = await response.json();
        setBurnTime(result.burn_time);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
        setLoading(false);
      }
    };

    fetchBurnTime();
  }, [event_id]);

  if (loading) return <p>Loading data...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="p-4 border border-gray-300 rounded shadow-sm bg-white">
      <h2 className="text-lg font-bold text-gray-800 mb-2">Data Panel</h2>
      <p className="text-sm text-gray-600">
        <strong>Estimated Burn Time:</strong> {burnTime} seconds
      </p>
    </div>
  );
}