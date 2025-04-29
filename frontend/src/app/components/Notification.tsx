"use client";

import { useEffect } from "react";

interface NotificationProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
  autoDismiss?: boolean;
  dismissTime?: number; // Time in milliseconds
}

export default function Notification({
  message,
  type,
  onClose,
  autoDismiss = true,
  dismissTime = 3000,
}: NotificationProps) {
  useEffect(() => {
    if (autoDismiss) {
      const timer = setTimeout(() => {
        onClose();
      }, dismissTime);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, dismissTime, onClose]);

  return (
    <div
      className={`fixed bottom-4 right-4 px-4 py-2 rounded shadow-lg text-white ${
        type === "success" ? "bg-green-500" : "bg-red-500"
      }`}
    >
      {message}
      <button
        onClick={onClose}
        className="ml-4 text-sm underline hover:text-gray-200 focus:outline-none"
      >
        Close
      </button>
    </div>
  );
}