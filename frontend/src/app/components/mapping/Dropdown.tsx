"use client";
import { useState } from "react";

interface DropdownProps {
  header: string;
  tags: string[];
  selectedTags: { [header: string]: string };
  onTagSelect: (header: string, tag: string) => void;
  className?: string; // Optional className prop for custom styling
}

export default function Dropdown({
  header,
  tags,
  selectedTags,
  onTagSelect,
  className = "",
}: DropdownProps) {
  const [selectedTag, setSelectedTag] = useState("");

  const handleSelect = (tag: string) => {
    setSelectedTag(tag);
    onTagSelect(header, tag);
  };

  return (
    <div className={`w-full mb-4 ${className}`}> {/* Full width by default */}
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {header}
      </label>
      <select
        value={selectedTag}
        onChange={(e) => handleSelect(e.target.value)}
        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-rp-blue)] focus:border-[var(--color-rp-blue)] sm:text-sm transition duration-200"
      >
        <option value="" disabled>
          Select a tag
        </option>
        {tags.map((tag, index) => (
          <option
            key={index}
            value={tag}
            disabled={tag !== "Disconnected" && Object.values(selectedTags).includes(tag)} // Allow "Disconnected" multiple times
          >
            {tag}
          </option>
        ))}
      </select>
    </div>
  );
}