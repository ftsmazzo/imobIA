import { Router } from "express";
import { sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

/** GET /api/dashboard — resumo do tenant (totais para o Dashboard) */
router.get("/", async (req, res) => {
  try {
    const auth = req.auth!;
    const tenantId = auth.tenantId;
    const result = await db.execute(sql`
      SELECT
        (SELECT COUNT(*)::int FROM properties WHERE tenant_id = ${tenantId}) AS properties,
        (SELECT COUNT(*)::int FROM contacts WHERE tenant_id = ${tenantId}) AS contacts,
        (SELECT COUNT(*)::int FROM tasks WHERE tenant_id = ${tenantId} AND completed_at IS NULL) AS tasks_pending
    `);
    const row = (result as { rows?: Record<string, unknown>[] }).rows?.[0];
    const properties = Number(row?.properties ?? 0);
    const contacts = Number(row?.contacts ?? 0);
    const tasksPending = Number(row?.tasks_pending ?? 0);
    res.json({ properties, contacts, tasksPending });
  } catch (err) {
    console.error("[dashboard]", err);
    res.status(500).json({ error: "Erro ao carregar resumo" });
  }
});

export default router;
