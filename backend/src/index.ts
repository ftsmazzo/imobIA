import "dotenv/config";
import express from "express";
import { eq } from "drizzle-orm";
import { db } from "./db/index.js";
import { plans } from "./db/schema.js";
import authRoutes from "./routes/auth.js";
import tenantsRoutes from "./routes/tenants.js";
import usersRoutes from "./routes/users.js";
import pipelineStagesRoutes from "./routes/pipeline-stages.js";
import propertiesRoutes from "./routes/properties.js";
import tagsRoutes from "./routes/tags.js";
import contactsRoutes from "./routes/contacts.js";
import tasksRoutes from "./routes/tasks.js";
import webhookRoutes from "./routes/webhook.js";
import internalRoutes from "./routes/internal.js";
import dashboardRoutes from "./routes/dashboard.js";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  console.warn("JWT_SECRET não definido em produção. Defina a variável no EasyPanel.");
}

// CORS: frontend (outro domínio) precisa chamar a API pelo navegador
app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
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

app.use("/api/auth", authRoutes);
app.use("/api/tenants", tenantsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/pipeline-stages", pipelineStagesRoutes);
app.use("/api/properties", propertiesRoutes);
app.use("/api/tags", tagsRoutes);
app.use("/api/contacts", contactsRoutes);
app.use("/api/tasks", tasksRoutes);
app.use("/api/webhook", webhookRoutes);
app.use("/api/internal", internalRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend rodando em http://0.0.0.0:${PORT}`);
  console.log("Webhook: POST /api/webhook/message (Evolution/ChatWoot → MCP)");
});
