"use client";
import { useRouter } from "next/navigation";

interface EventProps {
  name: string;
  author: string;
  uploadDate: string;
}

export default function Event({ name, author, uploadDate }: EventProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/${name}`); // Navigate to the event's URL
  };

  return (
    <div
      onClick={handleClick}
      className="p-4 border border-gray-300 rounded shadow-sm bg-white hover:shadow-md transition-shadow cursor-pointer"
    >
      <h2 className="text-lg font-semibold text-gray-800 mb-2">{name}</h2>
      <p className="text-sm text-gray-600">
        <strong>Author:</strong> {author}
      </p>
      <p className="text-sm text-gray-600">
        <strong>Uploaded:</strong> {new Date(uploadDate).toLocaleDateString()}
      </p>
    </div>
  );
}