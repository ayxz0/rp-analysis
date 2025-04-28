"use client"
import { useState, useRef } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click(); // Programmatically trigger the file input
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
      console.log("Selected file:", event.target.files[0].name);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        alert("File uploaded successfully!");
      } else {
        alert("Failed to upload file.");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("An error occurred while uploading the file.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }} // Hide the file input
      />
      <button
        onClick={handleButtonClick}
        className="rounded bg-blue-500 text-white px-4 py-2 hover:bg-blue-600"
      >
        Select File
      </button>
      {file && (
        <p className="text-gray-700">Selected File: {file.name}</p>
      )}
      <button
        onClick={handleUpload}
        className="rounded bg-green-500 text-white px-4 py-2 hover:bg-green-600"
      >
        Upload
      </button>
    </div>
  );
}