import React from "react";
import { X, AlertCircle } from "lucide-react";
import { Notification } from "../contexts/NotificationContext";

interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClose,
}) => {
  const getBackgroundColor = (type: string) => {
    switch (type) {
      case "LOW_STOCK":
      case "ERROR":
        return "bg-red-500";
      case "EXPIRY_WARNING":
        return "bg-yellow-500";
      case "SUCCESS":
        return "bg-green-500";
      case "INFO":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div
      className={`${getBackgroundColor(
        notification.type,
      )} text-white rounded-lg shadow-lg p-3 flex gap-2 items-start animate-in slide-in-from-right`}
    >
      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <div className="flex-grow min-w-0">
        <p className="font-medium text-sm">{notification.title}</p>
        <p className="text-xs opacity-90">{notification.message}</p>
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-white hover:opacity-75 transition-opacity"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};
