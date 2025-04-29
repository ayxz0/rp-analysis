"use client";
import { useState, useRef } from "react";
import Dropdown from "./mapping/Dropdown";
import Tags from "./mapping/Tags";

interface UploadCSVProps {
  onClose: () => void;
}

export default function UploadCSV({ onClose }: UploadCSVProps) {
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<{ [header: string]: string }>(
    {}
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const tags = ["Tank", "Chamber", "Manifold", "Fill", "Cross", "Pneumatics", "Disconnected", "Time"];

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      setFile(selectedFile);

      // Read the file and extract headers
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split("\n");
        if (lines.length > 0) {
          const detectedHeaders = lines[0].split(",").map((header) => header.trim());
          setHeaders(detectedHeaders);
        }
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleTagSelect = (header: string, tag: string) => {
    // Allow "Disconnected" to be assigned multiple times
    if (tag !== "Disconnected" && Object.values(selectedTags).includes(tag)) {
      alert(`The tag "${tag}" is already assigned to another header.`);
      return;
    }
  
    setSelectedTags((prev) => ({ ...prev, [header]: tag }));
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first.");
      return;
    }
  
    const formData = new FormData();
    formData.append("file", file); // Add the CSV file
    formData.append("tags", JSON.stringify(selectedTags)); // Add the tags/mapping as JSON
  
    try {
      const response = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });
  
      if (response.ok) {
        alert("File uploaded successfully!");
        resetState(); // Reset state after successful upload
        onClose(); // Close the popup
      } else {
        alert("Failed to upload file.");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("An error occurred while uploading the file.");
    }
  };

  const resetState = () => {
    setFile(null);
    setHeaders([]);
    setSelectedTags({});
  };

  // Check if all headers have been assigned a tag
  const allHeadersTagged = headers.every((header) => selectedTags[header]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div
        className="bg-white p-8 rounded-lg shadow-lg w-[70%] h-[70%] flex flex-col overflow-y-auto text-black"
        style={{ maxWidth: "1200px", maxHeight: "800px" }}
      >
        <h2 className="text-2xl font-bold mb-6 text-black">Upload New Data</h2>

        {/* Hidden file input */}
        <input
          type="file"
          accept=".csv"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: "none" }}
        />

        {/* Select File Button */}
        {!file && (
          <button
            onClick={handleButtonClick}
            className="rounded bg-blue-500 text-white px-4 py-2 hover:bg-blue-600 mb-6"
          >
            Select File
          </button>
        )}

        {/* Display selected file */}
        {file && <p className="text-black mb-6">Selected File: {file.name}</p>}

        {/* Dropdowns for headers */}
        {headers.length > 0 && (
          <div className="flex flex-col space-y-4">
            <h3 className="text-lg font-semibold mb-4">Available Headers:</h3>
            {headers.map((header, index) => (
              <Dropdown
                key={index}
                header={header}
                tags={tags}
                selectedTags={selectedTags}
                onTagSelect={handleTagSelect}
              />
            ))}
          </div>
        )}

        {/* Display selected tags */}
        {Object.keys(selectedTags).length > 0 && (
          <Tags headers={headers} selectedTags={selectedTags} />
        )}

        {/* Upload Button */}
        {file && headers.length > 0 && (
          <button
            onClick={handleUpload}
            className={`rounded px-4 py-2 mt-6 ${
              allHeadersTagged
                ? "bg-green-500 text-white hover:bg-green-600"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            disabled={!allHeadersTagged} // Disable button if not all headers are tagged
          >
            Upload
          </button>
        )}

        {/* Close Button */}
        <button
          onClick={() => {
            resetState(); // Reset state when closing
            onClose();
          }}
          className="rounded bg-red-500 text-white px-4 py-2 hover:bg-red-600 mt-6"
        >
          Close
        </button>
      </div>
    </div>
  );
}