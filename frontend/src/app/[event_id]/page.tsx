"use client";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Header from ".././components/Header";
import Graph from ".././components/Graph";
import LoadingPage from ".././components/LoadingPage";

export default function EventPage() {
  const { event_id } = useParams() ?? {};
  const eventId = Array.isArray(event_id) ? event_id[0] : event_id ?? "";
  const [graphs, setGraphs] = useState<any[]>([]);
  const [dataPanelValues, setDataPanelValues] = useState({
    peakThrust: null,
    peakChamber: null,
    dataRate: null,
    burnTime: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleHomeClick = () => {
    window.location.href = "/";
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const endpoints = [
          { key: "dp", url: `http://localhost:5000/${event_id}/dp`, label: "Differential Pressure (DP) vs Time", xAxis: "Time (s)", yAxis: "DP (PSI)", yField: "DP" },
          { key: "tank", url: `http://localhost:5000/${event_id}/tank`, label: "Tank Pressure vs Time", xAxis: "Time (s)", yAxis: "Tank Pressure (PSI)", yField: "Tank" },
          { key: "tanklc", url: `http://localhost:5000/${event_id}/tanklc`, label: "TankLC vs Time", xAxis: "Time (s)", yAxis: "TankLC (kg)", yField: "TankLC" },
          { key: "thrustlc", url: `http://localhost:5000/${event_id}/thrustlc`, label: "ThrustLC vs Time", xAxis: "Time (s)", yAxis: "ThrustLC (N)", yField: "ThrustLC" },
          { key: "pressures", url: `http://localhost:5000/${event_id}/pressures`, label: "Pressures (Chamber, Manifold, Tank) vs Time", xAxis: "Time (s)", yAxis: "Pressure (PSI)", yFields: ["Chamber", "Manifold", "Tank"] },
          { key: "mdot", url: `http://localhost:5000/${event_id}/mdot`, label: "Mass Flow Rate (Mdot) vs Time", xAxis: "Time (s)", yAxis: "Mdot (kg/s)", yField: "Mdot" },
          { key: "stiff", url: `http://localhost:5000/${event_id}/stiff`, label: "Injector Stiffness vs Time", xAxis: "Time (s)", yAxis: "Stiffness", yField: "Stiffness" },
        ];

        const graphData = await Promise.all(
          endpoints.map(async (endpoint) => {
            try {
              const response = await fetch(endpoint.url);
              if (!response.ok) throw new Error(`Failed to fetch ${endpoint.key} data`);
              const result = await response.json();

              // Handle multiple Y-fields (e.g., pressures)
              if (endpoint.yFields) {
                return {
                  label: endpoint.label,
                  xAxisLabel: endpoint.xAxis,
                  yAxisLabel: endpoint.yAxis,
                  datasets: endpoint.yFields.map((field) => ({
                    label: field,
                    data: result.data.map((point: any) => ({
                      x: point.Time,
                      y: point[field],
                    })),
                    borderColor: field === "Chamber" ? "#FF5733" : field === "Manifold" ? "#33C3FF" : "#33FF57", // Different colors for each field
                    backgroundColor: "rgba(0, 0, 0, 0)", // Transparent background
                  })),
                };
              }

              // Handle single Y-field
              return {
                label: endpoint.label,
                xAxisLabel: endpoint.xAxis,
                yAxisLabel: endpoint.yAxis,
                datasets: [
                  {
                    label: endpoint.label,
                    data: result.data.map((point: any) => ({
                      x: point.Time,
                      y: point[endpoint.yField],
                    })),
                    borderColor: "#1c2f50",
                    backgroundColor: "rgba(28, 47, 80, 0.2)",
                  },
                ],
              };
            } catch (err) {
              console.log(`${endpoint.label} graph is broken: ${err instanceof Error ? err.message : "Unknown error"}`);
              return null; // Skip this graph if there's an error
            }
          })
        );

        // Filter out null graphs (failed endpoints)
        setGraphs(graphData.filter((graph) => graph !== null));

        // Fetch data for the data panel
        let peakThrust = null;
        let peakChamber = null;
        let dataRate = null;
        let burnTime = null;

        try {
          const peakThrustResponse = await fetch(`http://localhost:5000/${event_id}/peakThrust`);
          if (peakThrustResponse.ok) {
            const thrustData = await peakThrustResponse.json();
            peakThrust = thrustData.peakThrust;
          } else {
            console.log("Failed to fetch peak thrust data");
          }
        } catch (err) {
          console.log("Error fetching peak thrust:", err instanceof Error ? err.message : "Unknown error");
        }

        try {
          const peakChamberResponse = await fetch(`http://localhost:5000/${event_id}/peakChamber`);
          if (peakChamberResponse.ok) {
            const chamberData = await peakChamberResponse.json();
            peakChamber = chamberData.peakChamber;
          } else {
            console.log("Failed to fetch peak chamber data");
          }
        } catch (err) {
          console.log("Error fetching peak chamber:", err instanceof Error ? err.message : "Unknown error");
        }

        try {
          const dataRateResponse = await fetch(`http://localhost:5000/${event_id}/dataRate`);
          if (dataRateResponse.ok) {
            const rateData = await dataRateResponse.json();
            dataRate = rateData.dataRate;
          } else {
            console.log("Failed to fetch data rate");
          }
        } catch (err) {
          console.log("Error fetching data rate:", err instanceof Error ? err.message : "Unknown error");
        }

        try {
          const burnTimeResponse = await fetch(`http://localhost:5000/${event_id}/burntime`);
          if (burnTimeResponse.ok) {
            const burnTimeData = await burnTimeResponse.json();
            burnTime = burnTimeData.burn_time;
          } else {
            console.log("Failed to fetch burn time");
          }
        } catch (err) {
          console.log("Error fetching burn time:", err instanceof Error ? err.message : "Unknown error");
        }

        setDataPanelValues({
          peakThrust,
          peakChamber,
          dataRate,
          burnTime,
        });

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
        setLoading(false);
      }
    };

    fetchData();
  }, [event_id]);

  if (loading) return <LoadingPage />;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <Header onHomeClick={handleHomeClick} />

      {/* Event Content */}
      <div className="p-6">
        <h1 className="text-3xl font-bold text-rp-blue mb-4">{event_id}</h1>
        <p className="text-gray-600 mb-6">Below are the graphs for the event data:</p>

        {/* Layout for Graphs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {graphs.map((graph, index) => (
            <div key={index} className="p-4 border border-gray-300 rounded shadow-sm bg-white">
              <Graph
                labels={graph.datasets[0].data.map((point: any) => point.x.toFixed(2))} // Use the x values from the first dataset
                datasets={graph.datasets} // Pass the datasets directly
                xAxisLabel={graph.xAxisLabel}
                yAxisLabel={graph.yAxisLabel}
              />
            </div>
          ))}
        </div>

        {/* Data Panel */}
        <div className="mt-6 p-4 border border-gray-300 rounded shadow-sm bg-white">
          <h2 className="text-xl font-bold text-rp-blue mb-4">Data Panel</h2>
          <ul className="space-y-2">
            <li>
              <strong>Peak Thrust (LC):</strong> {dataPanelValues.peakThrust ?? "N/A"} N
            </li>
            <li>
              <strong>Peak Chamber Pressure:</strong> {dataPanelValues.peakChamber ?? "N/A"} PSI
            </li>
            <li>
              <strong>Data Rate:</strong> {dataPanelValues.dataRate ?? "N/A"} Hz
            </li>
            <li>
              <strong>Burn Time:</strong> {dataPanelValues.burnTime ?? "N/A"} s
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}