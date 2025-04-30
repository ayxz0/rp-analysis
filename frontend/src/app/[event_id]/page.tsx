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
    peakMdot: null, // Add peakMdot to the data panel state
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
          { key: "dp", url: `https://rp-analysis.onrender.com/${event_id}/dp`, label: "Differential Pressure (DP) vs Time", xAxis: "Time (s)", yAxis: "DP (PSI)", yField: "DP" },
          { key: "tank", url: `https://rp-analysis.onrender.com/${event_id}/tank`, label: "Tank Pressure vs Time", xAxis: "Time (s)", yAxis: "Tank Pressure (PSI)", yField: "Tank" },
          { key: "tanklc", url: `https://rp-analysis.onrender.com/${event_id}/tanklc`, label: "TankLC vs Time", xAxis: "Time (s)", yAxis: "TankLC (kg)", yField: "TankLC" },
          { key: "thrustlc", url: `https://rp-analysis.onrender.com/${event_id}/thrustlc`, label: "ThrustLC vs Time", xAxis: "Time (s)", yAxis: "ThrustLC (N)", yField: "ThrustLC" },
          { key: "pressures", url: `https://rp-analysis.onrender.com/${event_id}/pressures`, label: "Pressures (Chamber, Manifold, Tank) vs Time", xAxis: "Time (s)", yAxis: "Pressure (PSI)", yFields: ["Chamber", "Manifold", "Tank"] },
          { key: "mdot", url: `https://rp-analysis.onrender.com/${event_id}/mdot`, label: "Mass Flow Rate (Mdot) vs Time", xAxis: "Time (s)", yAxis: "Mdot (kg/s)", yField: "Mdot" },
          { key: "stiff", url: `https://rp-analysis.onrender.com/${event_id}/stiff`, label: "Injector Stiffness vs Time", xAxis: "Time (s)", yAxis: "Stiffness", yField: "Stiffness" },
        ];

        const graphData = await Promise.all(
          endpoints.map(async (endpoint) => {
            try {
              const response = await fetch(endpoint.url);
              if (!response.ok) throw new Error(`Failed to fetch ${endpoint.key} data`);
              const result = await response.json();

              // Handle multiple Y-fields (e.g., pressures)
              if (endpoint.yFields) {
                const datasets = endpoint.yFields.map((field) => ({
                  label: field,
                  data: result.data
                    .map((point: any) => ({
                      x: point.Time,
                      y: point[field],
                    }))
                    .filter((point: any) => point.y !== 500), // Exclude points with y = 500
                  borderColor: field === "Chamber" ? "#FF5733" : field === "Manifold" ? "#33C3FF" : "#33FF57", // Different colors for each field
                  backgroundColor: "rgba(0, 0, 0, 0)", // Transparent background
                }));

                // Skip the graph if all datasets are empty
                if (datasets.every((dataset) => dataset.data.length === 0)) {
                  return null;
                }

                return {
                  label: endpoint.label,
                  xAxisLabel: endpoint.xAxis,
                  yAxisLabel: endpoint.yAxis,
                  datasets,
                };
              }

              // Handle single Y-field
              const data = result.data
                .map((point: any) => ({
                  x: point.Time,
                  y: point[endpoint.yField],
                }))
                .filter((point: any) => point.y !== 500); // Exclude points with y = 500

              // Skip the graph if the dataset is empty
              if (data.length === 0) {
                return null;
              }

              return {
                label: endpoint.label,
                xAxisLabel: endpoint.xAxis,
                yAxisLabel: endpoint.yAxis,
                datasets: [
                  {
                    label: endpoint.label,
                    data,
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

        // Filter out null graphs (failed endpoints or excluded graphs)
        setGraphs(graphData.filter((graph) => graph !== null));

        // Fetch data for the data panel
        let peakThrust = null;
        let peakChamber = null;
        let dataRate = null;
        let burnTime = null;
        let peakMdot = null;

        try {
          const peakThrustResponse = await fetch(`https://rp-analysis.onrender.com/${event_id}/peakThrust`);
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
          const peakChamberResponse = await fetch(`https://rp-analysis.onrender.com/${event_id}/peakChamber`);
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
          const dataRateResponse = await fetch(`https://rp-analysis.onrender.com/${event_id}/dataRate`);
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
          const burnTimeResponse = await fetch(`https://rp-analysis.onrender.com/${event_id}/burntime`);
          if (burnTimeResponse.ok) {
            const burnTimeData = await burnTimeResponse.json();
            burnTime = burnTimeData.burn_time;
          } else {
            console.log("Failed to fetch burn time");
          }
        } catch (err) {
          console.log("Error fetching burn time:", err instanceof Error ? err.message : "Unknown error");
        }

        try {
          const peakMdotResponse = await fetch(`https://rp-analysis.onrender.com/${event_id}/peakMdot`);
          if (peakMdotResponse.ok) {
            const mdotData = await peakMdotResponse.json();
            peakMdot = mdotData.peakMdot;
          } else {
            console.log("Failed to fetch peak Mdot data");
          }
        } catch (err) {
          console.log("Error fetching peak Mdot:", err instanceof Error ? err.message : "Unknown error");
        }

        setDataPanelValues({
          peakThrust,
          peakChamber,
          dataRate,
          burnTime,
          peakMdot,
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
    <div className="bg-gray-100 min-h-screen">
      {/* Header */}
      <Header onHomeClick={handleHomeClick} />

      {/* Main Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Graphs */}
          <div className="lg:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {graphs.map((graph, index) => (
              <Graph
                key={index}
                labels={graph.datasets[0].data.map((point: any) => point.x.toFixed(2))}
                datasets={graph.datasets}
                xAxisLabel={graph.xAxisLabel}
                yAxisLabel={graph.yAxisLabel}
              />
            ))}
          </div>

            {/* Data Panel */}
            <div className="p-4 border border-gray-300 rounded-lg shadow-sm bg-white sticky top-28 h-72">
            <h2 className="text-2xl font-bold text-rp-blue mb-4">Data: {eventId}</h2>
            <ul className="space-y-4 text-lg text-rp-blue">
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
                <li>
                <strong>Peak Mdot:</strong> {dataPanelValues.peakMdot ?? "N/A"} kg/s
                </li>
            </ul>
            </div>
        </div>
      </div>
    </div>
  );
}