"use client";
import { useState, useRef } from "react";
import Dropdown from "./mapping/Dropdown";
import Tags from "./mapping/Tags";
import Notification from "./Notification";

interface UploadCSVProps {
  onClose: () => void;
}

export default function UploadCSV({ onClose }: UploadCSVProps) {
  const [file, setFile] = useState<File | null>(null);
  const [csvName, setCsvName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<{ [header: string]: string }>({});
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const tags = ["Tank", "Chamber", "Manifold", "Fill", "Cross", "Pneumatics", "TankLC", "ThrustLC", "Disconnected", "Time"];

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

    if (!csvName) {
      alert("Please enter a name for the CSV.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("tags", JSON.stringify(selectedTags));
    formData.append("new_csv_name", csvName);

    try {
      const response = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setNotification({ message: `Successfully uploaded ${csvName}`, type: "success" });
        resetState();
        onClose();
      } else {
        setNotification({ message: "Unsuccessful upload", type: "error" });
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setNotification({ message: "An error occurred while uploading the file.", type: "error" });
    }
  };

  const resetState = () => {
    setFile(null);
    setCsvName("");
    setHeaders([]);
    setSelectedTags({});
  };

  const allHeadersTagged = headers.every((header) => selectedTags[header]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-[70%] max-w-3xl max-h-[80vh] flex flex-col text-black">
        {/* Fixed Header Section */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-[var(--color-rp-blue)] mb-4">Upload New Data</h2>

          {/* Select File Section */}
          <div>
            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            {!file ? (
              <button
                onClick={handleButtonClick}
                className="w-full rounded border border-[var(--color-rp-blue)] bg-[var(--color-rp-blue)] text-white px-4 py-2 hover:bg-white hover:text-[var(--color-rp-blue)] transition duration-200"
              >
                Select File
              </button>
            ) : (
              <p className="w-full text-center text-sm font-medium text-gray-700">
                Selected File: <span className="text-[var(--color-rp-blue)]">{file.name}</span>
              </p>
            )}
          </div>
        </div>

        {/* Scrollable Content Section */}
        {file && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">CSV Name</label>
              <input
                type="text"
                value={csvName}
                onChange={(e) => setCsvName(e.target.value)}
                placeholder="Enter a name for the CSV"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-rp-blue)] focus:border-[var(--color-rp-blue)] sm:text-sm"
              />
              <p className="text-sm text-gray-500">Example: id_event_MMDDYY</p>
            </div>

            {/* Dropdowns for headers */}
            {headers.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
          </div>
        )}

        {/* Fixed Footer Section */}
        <div className="p-6 border-t border-gray-200 flex justify-end gap-4">
          <button
            onClick={() => {
              resetState();
              onClose();
            }}
            className="rounded border border-[var(--color-rp-blue)] text-[var(--color-rp-blue)] px-4 py-2 hover:bg-[var(--color-rp-blue)] hover:text-white transition duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            className={`rounded px-4 py-2 border border-[var(--color-rp-blue)] ${
              file && allHeadersTagged
                ? "bg-[var(--color-rp-blue)] text-white hover:bg-white hover:text-[var(--color-rp-blue)] hover:border-[var(--color-rp-blue)] transition duration-200"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            disabled={!file || !allHeadersTagged}
          >
            Upload
          </button>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}