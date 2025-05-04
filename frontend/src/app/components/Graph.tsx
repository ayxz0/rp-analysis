"use client";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  CategoryScale,
  Filler,
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import Hammer from "hammerjs"; // Import Hammer.js
import { useRef, useEffect } from "react";

ChartJS.register(LineElement, PointElement, LinearScale, Title, Tooltip, Legend, CategoryScale, zoomPlugin);

interface Dataset {
  label: string; // Label for the dataset (e.g., "Manifold")
  data: number[]; // Array of Y-axis values
  borderColor: string; // Line color
  backgroundColor?: string; // Optional background color for the line
}

interface GraphProps {
  labels: string[]; // X-axis labels (e.g., timestamps)
  datasets: Dataset[]; // Array of datasets for multiple lines
  xAxisLabel?: string; // Label for the X-axis
  yAxisLabel?: string; // Label for the Y-axis
}

export default function Graph({ labels, datasets, xAxisLabel = "X-Axis", yAxisLabel = "Y-Axis" }: GraphProps) {
  const chartRef = useRef<any>(null); // Reference to the chart instance
  const containerRef = useRef<HTMLDivElement>(null); // Reference to the graph container

  const chartData = {
    labels, // X-axis labels
    datasets: datasets.map((dataset) => ({
      ...dataset,
      borderWidth: 2,
      tension: 0.4, // Smooth curve
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, // Allow the graph to dynamically adjust its height
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const xValue = context.raw.x.toFixed(2); // Format x (time)
            const yValue = context.raw.y.toFixed(2); // Format y (value)
            return `Time: ${xValue}, Value: ${yValue}`;
          },
        },
      },
      zoom: {
        pan: {
          enabled: true, // Enable panning
          mode: "xy" as const, // Allow panning in both X and Y directions
        },
        zoom: {
          wheel: {
            enabled: true, // Enable zooming with the mouse wheel
          },
          pinch: {
            enabled: true, // Enable zooming with pinch gestures
          },
          mode: "xy" as const, // Allow zooming in both X and Y directions
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: xAxisLabel,
        },
        ticks: {
          autoSkip: true, // Automatically skip labels to avoid clutter
          maxTicksLimit: 10, // Limit the number of labels displayed
        },
      },
      y: {
        title: {
          display: true,
          text: yAxisLabel,
        },
      },
    },
  };

  // Function to reset zoom
  const resetZoom = () => {
    if (chartRef.current) {
      chartRef.current.resetZoom();
    }
  };

  // Use Hammer.js for gesture recognition
  useEffect(() => {
    if (containerRef.current) {
      const hammer = new Hammer(containerRef.current);

      // Enable pinch gestures
      hammer.get("pinch").set({ enable: true });

      // Handle pinch gestures
      hammer.on("pinch", (event) => {
        console.log("Pinch gesture detected:", event);
      });

      // Handle pan gestures
      hammer.on("pan", (event) => {
        console.log("Pan gesture detected:", event);
      });

      return () => {
        hammer.destroy(); // Clean up Hammer.js instance on unmount
      };
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[500px] p-4 border border-gray-300 rounded-lg shadow-sm bg-white"
    >
      {/* Graph */}
      <Line ref={chartRef} data={chartData} options={options} />

      {/* Reset Zoom Button */}
      <button
        onClick={resetZoom}
        className="absolute top-4 right-4 px-2 py-1 text-sm border-[var(--color-rp-blue)] bg-[var(--color-rp-blue)] text-white rounded-md shadow-sm hover:bg-white hover:text-[var(--color-rp-blue)] transition duration-200"
      >
        Reset
      </button>
    </div>
  );
}