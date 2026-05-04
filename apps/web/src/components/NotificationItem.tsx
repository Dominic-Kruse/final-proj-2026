import React from "react";
import { X, AlertCircle } from "lucide-react";
import { Notification } from "../contexts/NotificationContext";

interface NotificationItemProps {
  notification: Notification;
  onClose: () => void;
  onToggleRead: () => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onClose,
  onToggleRead,
}) => {
  const getBackgroundColor = (type: string) => {
    switch (type) {
      case "LOW_STOCK":
      case "ERROR":
        return "bg-red-50 border-l-4 border-red-500";
      case "EXPIRY_WARNING":
        return "bg-yellow-50 border-l-4 border-yellow-500";
      case "SUCCESS":
        return "bg-green-50 border-l-4 border-green-500";
      case "INFO":
        return "bg-blue-50 border-l-4 border-blue-500";
      default:
        return "bg-gray-50 border-l-4 border-gray-500";
    }
  };

  const getTextColor = (type: string) => {
    switch (type) {
      case "LOW_STOCK":
      case "ERROR":
        return "text-red-900";
      case "EXPIRY_WARNING":
        return "text-yellow-900";
      case "SUCCESS":
        return "text-green-900";
      case "INFO":
        return "text-blue-900";
      default:
        return "text-gray-900";
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case "LOW_STOCK":
      case "ERROR":
        return "text-red-500";
      case "EXPIRY_WARNING":
        return "text-yellow-600";
      case "SUCCESS":
        return "text-green-600";
      case "INFO":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div
      className={`p-4 rounded-lg ${getBackgroundColor(
        notification.type,
      )} flex gap-3 hover:shadow-md transition-shadow relative`}
      onClick={onToggleRead}
    >
      {!notification.read && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"></div>
      )}
      <AlertCircle
        className={`w-5 h-5 flex-shrink-0 mt-0.5 ${getIconColor(notification.type)}`}
      />
      <div className="flex-grow min-w-0">
        <h4 className={`font-semibold ${getTextColor(notification.type)}`}>
          {notification.title}
        </h4>
        <p className={`text-sm mt-1 ${getTextColor(notification.type)}`}>
          {notification.message}
        </p>
        <p
          className={`text-xs mt-2 opacity-70 ${getTextColor(
            notification.type,
          )}`}
        >
          {new Date(notification.timestamp).toLocaleTimeString()}
        </p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className={`flex-shrink-0 mt-0.5 ${getTextColor(
          notification.type,
        )} hover:opacity-70 transition-opacity`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
