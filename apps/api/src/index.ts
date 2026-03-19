import express from "express";
import cors from "cors";
import { db } from "./db"
import productsRoutes from "./routes/productsRoutes"

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use("/products", productsRoutes);




app.get("/", (_req, res) => {
  res.json({ message: "Hello from API!" });
});

app.get("/db-test", async (_req, res) => {
  const result = await db.execute("SELECT 1");
  res.json({result: result});
});

app.listen(port, () =>  {
  console.log(`Server running at http://localhost:${port}`)
});
   