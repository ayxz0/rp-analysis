"use client";

interface TagsProps {
  headers: string[];
  selectedTags: { [header: string]: string };
}

const tagColors: { [tag: string]: string } = {
  Tank: "bg-blue-100 text-blue-800",
  Chamber: "bg-green-100 text-green-800",
  Manifold: "bg-yellow-100 text-yellow-800",
  Fill: "bg-red-100 text-red-800",
  Cross: "bg-purple-100 text-purple-800",
  Pneumatics: "bg-pink-100 text-pink-800",
  TankLC: "bg-emerald-100 text-pink-800",
  ThrustLC: "bg-amber-100 text-pink-800",
  Disconnected: "bg-gray-100 text-gray-500",
  Time: "bg-gray-100 text-black",
};

export default function Tags({ headers, selectedTags }: TagsProps) {
  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {headers.map((header, index) => {
        const tag = selectedTags[header];
        const colorClass = tagColors[tag] || "bg-gray-100 text-black"; // Default color
        return (
          <div
            key={index}
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colorClass}`}
          >
            {header}: {tag}
          </div>
        );
      })}
    </div>
  );
}