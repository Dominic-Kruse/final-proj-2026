import express from "express";
import cors from "cors";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { db } from "./db";
import productsRoutes from "./routes/productsRoutes";
import inventoryRoutes from "./routes/inventoryRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import auditLogsRoutes from "./routes/auditLogsRoutes";

const app = express();
const port = process.env.PORT || 3001;

// WebSocket clients
const wsClients = new Set<any>();

// WebSocket manager for broadcasting
export const broadcastNotification = (notification: any) => {
  const message = JSON.stringify(notification);
  wsClients.forEach((client) => {
    if (client.readyState === 1) {
      // OPEN
      client.send(message);
    }
  });
};

async function ensureAuditLogsTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS "audit_logs" (
      "id" serial PRIMARY KEY,
      "action" varchar(50) NOT NULL,
      "entity_type" varchar(100) NOT NULL,
      "entity_id" integer NOT NULL,
      "performed_by" varchar(255),
      "old_values" text,
      "new_values" text,
      "ip_address" varchar(100),
      "user_agent" text,
      "created_at" timestamp DEFAULT now()
    );
  `);
}

app.use(cors());
app.use(express.json());
app.use("/products", productsRoutes);
app.use("/inventory", inventoryRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/audit-logs", auditLogsRoutes);

app.get("/", (_req, res) => {
  res.json({ message: "Hello from API!" });
});

app.get("/db-test", async (_req, res) => {
  const result = await db.execute("SELECT 1");
  res.json({ result: result });
});

async function startServer() {
  await ensureAuditLogsTable();

  const server = createServer(app);
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    console.log("New WebSocket client connected");
    wsClients.add(ws);

    ws.on("close", () => {
      console.log("WebSocket client disconnected");
      wsClients.delete(ws);
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
      wsClients.delete(ws);
    });
  });

  server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

void startServer();
