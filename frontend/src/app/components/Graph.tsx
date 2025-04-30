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
} from "chart.js";

ChartJS.register(LineElement, PointElement, LinearScale, Title, Tooltip, Legend, CategoryScale);

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
          label: (context: any) => `${context.dataset.label}: ${context.raw}`,
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

  return (
    <div className="w-full h-[500px] p-4 border border-gray-300 rounded-lg shadow-sm bg-white">
      {/* Set a fixed height of 500px for the graph container */}
      <Line data={chartData} options={options} />
    </div>
  );
}