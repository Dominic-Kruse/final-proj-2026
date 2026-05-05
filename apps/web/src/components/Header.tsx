import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { useNotifications } from "../hooks/useNotifications";
import { NotificationItem } from "./NotificationItem";

export const Header = () => {
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications, toggleRead, removeNotification } = useNotifications();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getTitleFromPath = (pathname: string) => {
    switch (pathname) {
      case "/":
        return "Dashboard";
      case "/inventory":
        return "Inventory";
      case "/stockin":
        return "Stock In";
      case "/dispense":
        return "Dispense";
      case "/customer":
        return "Audit Logs";
      default:
        return "Pharmacy";
    }
  };

  const title = getTitleFromPath(location.pathname);
  const timeString = currentTime.toLocaleTimeString();
  const dateString = currentTime.toLocaleDateString();
  const unreadCount = notifications.filter((n) => !n.read).length;
  const alertNotifications = notifications.filter(
    (n) => n.type === "LOW_STOCK" || n.type === "EXPIRY_WARNING",
  );

  return (
    <header className="h-16 bg-white flex items-center justify-between px-8 shrink-0 z-10 border-b border-slate-200">
      <h1 style={{ fontSize: "28px" }} className="font-bold text-slate-800">
        {title}
      </h1>
      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="text-sm font-medium text-slate-800">{timeString}</p>
          <p className="text-xs text-slate-500">{dateString}</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors relative"
          >
            <Bell className="w-5 h-5 text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute top-full right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-slate-200 max-h-96 overflow-y-auto z-50">
              <div className="sticky top-0 bg-white border-b border-slate-200 p-4">
                <h2 className="font-semibold text-slate-800">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="ml-2 text-xs font-normal bg-red-100 text-red-800 px-2 py-1 rounded">
                      {unreadCount} new
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-500 italic mt-1">
                  Click an item to mark as read or unread
                </p>
              </div>

              {alertNotifications.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <p className="text-sm">No alerts</p>
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {alertNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onToggleRead={() => toggleRead(notification.id)}
                      onClose={() => removeNotification(notification.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
