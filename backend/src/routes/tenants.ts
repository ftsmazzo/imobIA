import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { tenants } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

/** GET /api/tenants — lista tenant do usuário (só o próprio) */
router.get("/", async (req, res) => {
  try {
    const auth = req.auth!;
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, auth.tenantId))
      .limit(1);
    if (!tenant) {
      res.status(404).json({ error: "Tenant não encontrado" });
      return;
    }
    res.json(tenant);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao listar tenant" });
  }
});

/** GET /api/tenants/:id — detalhe (só o próprio tenant) */
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }
    const auth = req.auth!;
    if (id !== auth.tenantId) {
      res.status(403).json({ error: "Acesso negado" });
      return;
    }
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
    if (!tenant) {
      res.status(404).json({ error: "Tenant não encontrado" });
      return;
    }
    res.json(tenant);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar tenant" });
  }
});

/** PATCH /api/tenants/:id — atualiza (só o próprio tenant; admin) */
router.patch("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }
    const auth = req.auth!;
    if (id !== auth.tenantId) {
      res.status(403).json({ error: "Acesso negado" });
      return;
    }
    const body = req.body as Record<string, unknown>;
    const allowed = [
      "companyName",
      "email",
      "subdomain",
      "evolutionInstanceName",
      "evolutionApiKey",
      "chatwootAgentId",
      "chatwootAgentBotId",
      "chatwootAgentBotToken",
    ] as const;
    const update: Record<string, unknown> = { updatedAt: new Date() };
    for (const key of allowed) {
      if (body[key] !== undefined) update[key] = body[key];
    }
    const [tenant] = await db
      .update(tenants)
      .set(update as typeof tenants.$inferInsert)
      .where(eq(tenants.id, id))
      .returning();
    if (!tenant) {
      res.status(404).json({ error: "Tenant não encontrado" });
      return;
    }
    res.json(tenant);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao atualizar tenant" });
  }
});

export default router;
