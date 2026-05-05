import React, { useEffect, useState } from "react";
import { useNotifications } from "../hooks/useNotifications";
import { NotificationToast } from "./NotificationToast";
import { Notification } from "../contexts/NotificationContext";

export const NotificationContainer: React.FC = () => {
  const { addNotification } = useNotifications();
  const [toasts, setToasts] = useState<Notification[]>([]);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
    const wsUrl = apiUrl
      .replace("http://", "ws://")
      .replace("https://", "wss://");

    const ws = new WebSocket(wsUrl);
    let isConnected = true;

    ws.onopen = () => {
      console.log("WebSocket connected to", wsUrl);
    };

    ws.onmessage = (event) => {
      if (!isConnected) return;
      try {
        const data = JSON.parse(event.data);

        // Add to context for persistent dropdown notifications
        addNotification({
          type: data.type,
          title: data.title,
          message: data.message,
          productId: data.productId,
          productName: data.productName,
        });

        // Add to local toasts state for temporary toast display
        const toastId = `${Date.now()}-${Math.random()}`;
        const newToast: Notification = {
          id: toastId,
          type: data.type,
          title: data.title,
          message: data.message,
          productId: data.productId,
          productName: data.productName,
          timestamp: new Date().toISOString(),
          read: false,
        };
        setToasts((prev) => [newToast, ...prev]);

        // Auto-dismiss toast after 5 seconds
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== toastId));
        }, 5000);
      } catch (error) {
        console.error("Failed to parse notification:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      isConnected = false;
    };

    return () => {
      isConnected = false;
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [addNotification]);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 max-w-sm space-y-2 z-40">
      {toasts.map((toast) => (
        <NotificationToast
          key={toast.id}
          notification={toast}
          onClose={() =>
            setToasts((prev) => prev.filter((t) => t.id !== toast.id))
          }
        />
      ))}
    </div>
  );
};
