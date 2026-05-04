import React, { createContext, useState, useCallback, ReactNode } from "react";

export interface Notification {
  id: string;
  type: "LOW_STOCK" | "EXPIRY_WARNING" | "SUCCESS" | "ERROR" | "INFO";
  title: string;
  message: string;
  timestamp: string;
  productId?: number;
  productName?: string;
  read?: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp">,
  ) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  toggleRead: (id: string) => void;
  clearAll: () => void;
}

export const NotificationContext = createContext<
  NotificationContextType | undefined
>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "timestamp">) => {
      const id = `${Date.now()}-${Math.random()}`;
      const newNotification: Notification = {
        ...notification,
        id,
        timestamp: new Date().toISOString(),
        read: false,
      };

      setNotifications((prev) => {
        // Deduplicate: don't add if an identical notification was added within the last 500ms
        const lastNotif = prev[0];
        if (
          lastNotif &&
          lastNotif.type === newNotification.type &&
          lastNotif.message === newNotification.message &&
          lastNotif.productId === newNotification.productId
        ) {
          const lastTime = new Date(lastNotif.timestamp).getTime();
          const newTime = new Date(newNotification.timestamp).getTime();
          if (newTime - lastTime < 500) {
            console.log("Skipping duplicate notification");
            return prev; // Skip duplicate
          }
        }
        return [newNotification, ...prev];
      });

      // Auto-remove non-alert notifications after 5 seconds
      if (
        notification.type !== "LOW_STOCK" &&
        notification.type !== "EXPIRY_WARNING"
      ) {
        setTimeout(() => {
          removeNotification(id);
        }, 5000);
      }
    },
    [],
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const toggleRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n)),
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        markAsRead,
        toggleRead,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
