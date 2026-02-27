import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { tags } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

/** GET /api/tags — lista tags do tenant */
router.get("/", async (req, res) => {
  try {
    const auth = req.auth!;
    const list = await db.select().from(tags).where(eq(tags.tenantId, auth.tenantId));
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao listar tags" });
  }
});

/** GET /api/tags/:id */
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }
    const auth = req.auth!;
    const [tag] = await db
      .select()
      .from(tags)
      .where(and(eq(tags.id, id), eq(tags.tenantId, auth.tenantId)))
      .limit(1);
    if (!tag) {
      res.status(404).json({ error: "Tag não encontrada" });
      return;
    }
    res.json(tag);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar tag" });
  }
});

/** POST /api/tags */
router.post("/", async (req, res) => {
  try {
    const auth = req.auth!;
    const { name, slug, color, category } = req.body as { name?: string; slug?: string; color?: string; category?: string };
    if (!name) {
      res.status(400).json({ error: "name obrigatório" });
      return;
    }
    const [tag] = await db
      .insert(tags)
      .values({
        tenantId: auth.tenantId,
        name,
        slug: slug ?? name.toLowerCase().replace(/\s+/g, "-"),
        color: color ?? null,
        category: category ?? null,
      })
      .returning();
    res.status(201).json(tag);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar tag" });
  }
});

/** PATCH /api/tags/:id */
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
      .from(tags)
      .where(and(eq(tags.id, id), eq(tags.tenantId, auth.tenantId)))
      .limit(1);
    if (!existing) {
      res.status(404).json({ error: "Tag não encontrada" });
      return;
    }
    const body = req.body as Record<string, unknown>;
    const update: Record<string, unknown> = {};
    if (body.name !== undefined) update.name = body.name;
    if (body.slug !== undefined) update.slug = body.slug;
    if (body.color !== undefined) update.color = body.color;
    if (body.category !== undefined) update.category = body.category;
    if (Object.keys(update).length === 0) {
      res.json(existing);
      return;
    }
    const [tag] = await db
      .update(tags)
      .set(update as typeof tags.$inferInsert)
      .where(eq(tags.id, id))
      .returning();
    res.json(tag);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao atualizar tag" });
  }
});

/** DELETE /api/tags/:id */
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }
    const auth = req.auth!;
    const [deleted] = await db
      .delete(tags)
      .where(and(eq(tags.id, id), eq(tags.tenantId, auth.tenantId)))
      .returning({ id: tags.id });
    if (!deleted) {
      res.status(404).json({ error: "Tag não encontrada" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao excluir tag" });
  }
});

export default router;
