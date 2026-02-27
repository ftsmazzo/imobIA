import "dotenv/config";
import express from "express";
import { eq } from "drizzle-orm";
import { db } from "./db/index.js";
import { plans } from "./db/schema.js";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// CORS: frontend (outro domínio) precisa chamar a API pelo navegador
app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (_req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "plataforma-imobiliaria-backend",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/plans", async (_req, res) => {
  try {
    const list = await db.select().from(plans).where(eq(plans.isActive, true));
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao listar planos" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend rodando em http://0.0.0.0:${PORT}`);
  console.log("Health: GET /api/health");
  console.log("Planos: GET /api/plans");
});
