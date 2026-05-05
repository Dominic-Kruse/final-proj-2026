import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Inventory } from "./pages/Inventory";
import { StockIn } from "./pages/StockIn";
import { Dispense } from "./pages/Dispense";
import { AuditLogs } from "./pages/AuditLogs";
import { NotificationProvider } from "./contexts/NotificationContext";
import { NotificationContainer } from "./components/NotificationContainer";

export default function App() {
  return (
    <NotificationProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="stockin" element={<StockIn />} />
            <Route path="dispense" element={<Dispense />} />
            <Route path="customer" element={<AuditLogs />} />
          </Route>
        </Routes>
        <NotificationContainer />
      </BrowserRouter>
    </NotificationProvider>
  );
}
