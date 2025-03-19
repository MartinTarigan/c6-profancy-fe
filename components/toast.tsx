"use client";

import { useEffect } from "react";
import {
  AiOutlineCheckCircle,
  AiOutlineCloseCircle,
  AiOutlineInfoCircle,
  AiOutlineWarning,
} from "react-icons/ai";

interface ToastProps {
  type?: "success" | "error" | "info" | "warning";
  message: string;
  onClose: () => void;
  duration?: number; // default 3 detik
}

const typeStyles = {
  success: {
    borderColor: "border-green-500",
    iconBg: "bg-green-500",
    icon: <AiOutlineCheckCircle size={24} />,
  },
  error: {
    borderColor: "border-red-500",
    iconBg: "bg-red-500",
    icon: <AiOutlineCloseCircle size={24} />,
  },
  info: {
    borderColor: "border-blue-500",
    iconBg: "bg-blue-500",
    icon: <AiOutlineInfoCircle size={24} />,
  },
  warning: {
    borderColor: "border-yellow-500",
    iconBg: "bg-yellow-500",
    icon: <AiOutlineWarning size={24} />,
  },
};

export default function Toast({
  type = "info",
  message,
  onClose,
  duration = 3000,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const { borderColor, iconBg, icon } = typeStyles[type];

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-4">
      <div
        className={`relative flex items-start bg-white rounded-lg shadow-md border-l-8 ${borderColor} w-[350px] max-w-full p-4`}
      >
        {/* Icon */}
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-full text-white text-lg font-bold mr-4 ${iconBg}`}
        >
          {icon}
        </div>

        {/* Message & Title */}
        <div className="flex-1">
          <p className="font-bold text-gray-800 capitalize">{type}</p>
          <p className="text-sm text-gray-600">{message}</p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-lg font-bold"
        >
          ×
        </button>
      </div>
    </div>
  );
}