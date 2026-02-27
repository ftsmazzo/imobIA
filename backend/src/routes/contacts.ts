import { Router } from "express";
import { eq, and, desc, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { contacts, contactTagRelations, tags } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

/** GET /api/contacts — lista contatos do tenant (query: pipelineStageId, tagId, limit, offset) */
router.get("/", async (req, res) => {
  try {
    const auth = req.auth!;
    const { pipelineStageId, tagId, limit, offset } = req.query;
    const conditions = [eq(contacts.tenantId, auth.tenantId)];
    if (pipelineStageId && typeof pipelineStageId === "string" && !Number.isNaN(Number(pipelineStageId))) {
      conditions.push(eq(contacts.pipelineStageId, Number(pipelineStageId)));
    }
    if (tagId && typeof tagId === "string" && !Number.isNaN(Number(tagId))) {
      const relations = await db
        .select({ contactId: contactTagRelations.contactId })
        .from(contactTagRelations)
        .where(eq(contactTagRelations.tagId, Number(tagId)));
      const contactIds = relations.map((r) => r.contactId);
      if (contactIds.length === 0) {
        res.json([]);
        return;
      }
      conditions.push(inArray(contacts.id, contactIds));
    }
    const list = await db
      .select()
      .from(contacts)
      .where(and(...conditions))
      .orderBy(desc(contacts.createdAt))
      .limit(Math.min(Number(limit) || 50, 100))
      .offset(Number(offset) || 0);
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao listar contatos" });
  }
});

/** GET /api/contacts/:id — detalhe com tags */
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }
    const auth = req.auth!;
    const [contact] = await db
      .select()
      .from(contacts)
      .where(and(eq(contacts.id, id), eq(contacts.tenantId, auth.tenantId)))
      .limit(1);
    if (!contact) {
      res.status(404).json({ error: "Contato não encontrado" });
      return;
    }
    const relations = await db
      .select({ tagId: contactTagRelations.tagId })
      .from(contactTagRelations)
      .where(eq(contactTagRelations.contactId, id));
    const tagIds = relations.map((r) => r.tagId);
    const contactTags = tagIds.length > 0
      ? await db.select().from(tags).where(inArray(tags.id, tagIds))
      : [];
    res.json({ ...contact, tags: contactTags });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar contato" });
  }
});

/** POST /api/contacts */
router.post("/", async (req, res) => {
  try {
    const auth = req.auth!;
    const body = req.body as Record<string, unknown>;
    const [contact] = await db
      .insert(contacts)
      .values({
        tenantId: auth.tenantId,
        name: (body.name as string) ?? null,
        phone: (body.phone as string) ?? "",
        email: (body.email as string) ?? null,
        source: (body.source as string) ?? null,
        pipelineStageId: (body.pipelineStageId as number) ?? null,
        leadScore: (body.leadScore as number) ?? 0,
        optIn: (body.optIn as boolean) ?? true,
        notes: (body.notes as string) ?? null,
        metadata: (body.metadata as object) ?? null,
      })
      .returning();
    const tagIds = Array.isArray(body.tagIds) ? (body.tagIds as number[]) : [];
    if (contact && tagIds.length > 0) {
      await db.insert(contactTagRelations).values(
        tagIds.map((tagId) => ({ contactId: contact.id, tagId }))
      );
    }
    const out = contact
      ? tagIds.length > 0
        ? { ...contact, tags: await db.select().from(tags).where(inArray(tags.id, tagIds)) }
        : contact
      : null;
    if (!out) {
      res.status(500).json({ error: "Erro ao criar contato" });
      return;
    }
    res.status(201).json(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar contato" });
  }
});

/** PATCH /api/contacts/:id */
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
      .from(contacts)
      .where(and(eq(contacts.id, id), eq(contacts.tenantId, auth.tenantId)))
      .limit(1);
    if (!existing) {
      res.status(404).json({ error: "Contato não encontrado" });
      return;
    }
    const body = req.body as Record<string, unknown>;
    const allowed = [
      "name", "phone", "email", "source", "pipelineStageId", "leadScore",
      "optIn", "optInAt", "whatsappValidated", "notes", "metadata",
    ] as const;
    const update: Record<string, unknown> = { updatedAt: new Date() };
    for (const k of allowed) {
      if (body[k] !== undefined) update[k] = body[k];
    }
    if (body.tagIds !== undefined && Array.isArray(body.tagIds)) {
      await db.delete(contactTagRelations).where(eq(contactTagRelations.contactId, id));
      const tagIds = body.tagIds as number[];
      if (tagIds.length > 0) {
        await db.insert(contactTagRelations).values(
          tagIds.map((tagId) => ({ contactId: id, tagId }))
        );
      }
    }
    const [contact] = await db
      .update(contacts)
      .set(update as typeof contacts.$inferInsert)
      .where(eq(contacts.id, id))
      .returning();
    if (!contact) {
      res.status(500).json({ error: "Erro ao atualizar" });
      return;
    }
    const relations = await db
      .select({ tagId: contactTagRelations.tagId })
      .from(contactTagRelations)
      .where(eq(contactTagRelations.contactId, id));
    const tagIdList = relations.map((r) => r.tagId);
    const contactTags = tagIdList.length > 0
      ? await db.select().from(tags).where(inArray(tags.id, tagIdList))
      : [];
    res.json({ ...contact, tags: contactTags });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao atualizar contato" });
  }
});

/** DELETE /api/contacts/:id */
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }
    const auth = req.auth!;
    await db.delete(contactTagRelations).where(eq(contactTagRelations.contactId, id));
    const [deleted] = await db
      .delete(contacts)
      .where(and(eq(contacts.id, id), eq(contacts.tenantId, auth.tenantId)))
      .returning({ id: contacts.id });
    if (!deleted) {
      res.status(404).json({ error: "Contato não encontrado" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao excluir contato" });
  }
});

/** POST /api/contacts/:id/tags — adiciona tag ao contato (body: { tagId }) */
router.post("/:id/tags", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { tagId } = req.body as { tagId?: number };
    if (Number.isNaN(id) || tagId == null || Number.isNaN(Number(tagId))) {
      res.status(400).json({ error: "contact id e tagId obrigatórios" });
      return;
    }
    const auth = req.auth!;
    const [contact] = await db
      .select({ id: contacts.id })
      .from(contacts)
      .where(and(eq(contacts.id, id), eq(contacts.tenantId, auth.tenantId)))
      .limit(1);
    if (!contact) {
      res.status(404).json({ error: "Contato não encontrado" });
      return;
    }
    const [tag] = await db
      .select({ id: tags.id })
      .from(tags)
      .where(and(eq(tags.id, tagId), eq(tags.tenantId, auth.tenantId)))
      .limit(1);
    if (!tag) {
      res.status(404).json({ error: "Tag não encontrada" });
      return;
    }
    await db
      .insert(contactTagRelations)
      .values({ contactId: id, tagId })
      .onConflictDoNothing({ target: [contactTagRelations.contactId, contactTagRelations.tagId] });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao adicionar tag" });
  }
});

/** DELETE /api/contacts/:id/tags/:tagId */
router.delete("/:id/tags/:tagId", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const tagId = Number(req.params.tagId);
    if (Number.isNaN(id) || Number.isNaN(tagId)) {
      res.status(400).json({ error: "IDs inválidos" });
      return;
    }
    const auth = req.auth!;
    const [contact] = await db
      .select({ id: contacts.id })
      .from(contacts)
      .where(and(eq(contacts.id, id), eq(contacts.tenantId, auth.tenantId)))
      .limit(1);
    if (!contact) {
      res.status(404).json({ error: "Contato não encontrado" });
      return;
    }
    const [deleted] = await db
      .delete(contactTagRelations)
      .where(and(eq(contactTagRelations.contactId, id), eq(contactTagRelations.tagId, tagId)))
      .returning({ contactId: contactTagRelations.contactId });
    if (!deleted) {
      res.status(404).json({ error: "Relação não encontrada" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao remover tag" });
  }
});

export default router;
