import { Router } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { tasks } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

/** GET /api/tasks — lista tarefas do tenant (query: contactId, assignedToId, limit, offset) */
router.get("/", async (req, res) => {
  try {
    const auth = req.auth!;
    const { contactId, assignedToId, limit, offset } = req.query;
    const conditions = [eq(tasks.tenantId, auth.tenantId)];
    if (contactId && typeof contactId === "string" && !Number.isNaN(Number(contactId))) {
      conditions.push(eq(tasks.contactId, Number(contactId)));
    }
    if (assignedToId && typeof assignedToId === "string" && !Number.isNaN(Number(assignedToId))) {
      conditions.push(eq(tasks.assignedToId, Number(assignedToId)));
    }
    const list = await db
      .select()
      .from(tasks)
      .where(and(...conditions))
      .orderBy(desc(tasks.dueAt), desc(tasks.createdAt))
      .limit(Math.min(Number(limit) || 50, 100))
      .offset(Number(offset) || 0);
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao listar tarefas" });
  }
});

/** GET /api/tasks/:id */
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }
    const auth = req.auth!;
    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.tenantId, auth.tenantId)))
      .limit(1);
    if (!task) {
      res.status(404).json({ error: "Tarefa não encontrada" });
      return;
    }
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar tarefa" });
  }
});

/** POST /api/tasks */
router.post("/", async (req, res) => {
  try {
    const auth = req.auth!;
    const body = req.body as Record<string, unknown>;
    const [task] = await db
      .insert(tasks)
      .values({
        tenantId: auth.tenantId,
        contactId: (body.contactId as number) ?? null,
        propertyId: (body.propertyId as number) ?? null,
        assignedToId: (body.assignedToId as number) ?? null,
        title: (body.title as string) ?? "Tarefa",
        type: (body.type as string) ?? null,
        dueAt: (body.dueAt as string) ? new Date(body.dueAt as string) : null,
        notes: (body.notes as string) ?? null,
      })
      .returning();
    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar tarefa" });
  }
});

/** PATCH /api/tasks/:id */
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
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.tenantId, auth.tenantId)))
      .limit(1);
    if (!existing) {
      res.status(404).json({ error: "Tarefa não encontrada" });
      return;
    }
    const body = req.body as Record<string, unknown>;
    const update: Record<string, unknown> = { updatedAt: new Date() };
    const allowed = ["contactId", "propertyId", "assignedToId", "title", "type", "dueAt", "completedAt", "notes"] as const;
    for (const k of allowed) {
      if (body[k] !== undefined) {
        if (k === "dueAt" || k === "completedAt") {
          update[k] = body[k] === null ? null : new Date(body[k] as string);
        } else {
          update[k] = body[k];
        }
      }
    }
    const [task] = await db
      .update(tasks)
      .set(update as typeof tasks.$inferInsert)
      .where(eq(tasks.id, id))
      .returning();
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao atualizar tarefa" });
  }
});

/** DELETE /api/tasks/:id */
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }
    const auth = req.auth!;
    const [deleted] = await db
      .delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.tenantId, auth.tenantId)))
      .returning({ id: tasks.id });
    if (!deleted) {
      res.status(404).json({ error: "Tarefa não encontrada" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao excluir tarefa" });
  }
});

export default router;
