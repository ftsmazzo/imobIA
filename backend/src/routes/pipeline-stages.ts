import { Router } from "express";
import { eq, and, asc } from "drizzle-orm";
import { db } from "../db/index.js";
import { pipelineStages } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

/** GET /api/pipeline-stages — lista etapas do tenant (ordenado por sortOrder) */
router.get("/", async (req, res) => {
  try {
    const auth = req.auth!;
    const list = await db
      .select()
      .from(pipelineStages)
      .where(eq(pipelineStages.tenantId, auth.tenantId))
      .orderBy(asc(pipelineStages.sortOrder), asc(pipelineStages.id));
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao listar etapas do pipeline" });
  }
});

/** GET /api/pipeline-stages/:id */
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }
    const auth = req.auth!;
    const [stage] = await db
      .select()
      .from(pipelineStages)
      .where(and(eq(pipelineStages.id, id), eq(pipelineStages.tenantId, auth.tenantId)))
      .limit(1);
    if (!stage) {
      res.status(404).json({ error: "Etapa não encontrada" });
      return;
    }
    res.json(stage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar etapa" });
  }
});

/** POST /api/pipeline-stages */
router.post("/", async (req, res) => {
  try {
    const auth = req.auth!;
    const { name, slug, sortOrder } = req.body as { name?: string; slug?: string; sortOrder?: number };
    if (!name || !slug) {
      res.status(400).json({ error: "name e slug obrigatórios" });
      return;
    }
    const [stage] = await db
      .insert(pipelineStages)
      .values({
        tenantId: auth.tenantId,
        name,
        slug,
        sortOrder: sortOrder ?? 0,
      })
      .returning();
    res.status(201).json(stage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar etapa" });
  }
});

/** PATCH /api/pipeline-stages/:id */
router.patch("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }
    const auth = req.auth!;
    const [existing] = await db
      .select()
      .from(pipelineStages)
      .where(and(eq(pipelineStages.id, id), eq(pipelineStages.tenantId, auth.tenantId)))
      .limit(1);
    if (!existing) {
      res.status(404).json({ error: "Etapa não encontrada" });
      return;
    }
    const body = req.body as Record<string, unknown>;
    const update: Record<string, unknown> = {};
    if (body.name !== undefined) update.name = body.name;
    if (body.slug !== undefined) update.slug = body.slug;
    if (body.sortOrder !== undefined) update.sortOrder = body.sortOrder;
    if (Object.keys(update).length === 0) {
      res.json(existing);
      return;
    }
    const [stage] = await db
      .update(pipelineStages)
      .set(update as typeof pipelineStages.$inferInsert)
      .where(eq(pipelineStages.id, id))
      .returning();
    res.json(stage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao atualizar etapa" });
  }
});

/** DELETE /api/pipeline-stages/:id */
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }
    const auth = req.auth!;
    const [deleted] = await db
      .delete(pipelineStages)
      .where(and(eq(pipelineStages.id, id), eq(pipelineStages.tenantId, auth.tenantId)))
      .returning({ id: pipelineStages.id });
    if (!deleted) {
      res.status(404).json({ error: "Etapa não encontrada" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao excluir etapa" });
  }
});

export default router;
