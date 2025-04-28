"use client";
import { useState } from "react";

interface DropdownProps {
  header: string;
  tags: string[];
  selectedTags: { [header: string]: string };
  onTagSelect: (header: string, tag: string) => void;
}

export default function Dropdown({ header, tags, selectedTags, onTagSelect }: DropdownProps) {
  const [selectedTag, setSelectedTag] = useState("");

  const handleSelect = (tag: string) => {
    setSelectedTag(tag);
    onTagSelect(header, tag);
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {header}
      </label>
      <select
        value={selectedTag}
        onChange={(e) => handleSelect(e.target.value)}
        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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