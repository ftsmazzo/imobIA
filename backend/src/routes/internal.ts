import { Router, Request, Response } from "express";
import { eq, and, desc, asc, ilike, or, lte } from "drizzle-orm";
import { db } from "../db/index.js";
import { properties, propertyPhotos, contacts, tasks } from "../db/schema.js";

const router = Router();

/** Exige header X-Internal-Key igual a BACKEND_INTERNAL_KEY (server-to-server, ex.: MCP). */
function requireInternalKey(req: Request, res: Response, next: () => void) {
  const key = process.env.BACKEND_INTERNAL_KEY;
  const sent = req.headers["x-internal-key"];
  if (!key || sent !== key) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

router.use(requireInternalKey);

/**
 * GET /api/internal/properties
 * Query: tenant_id (obrigatório), neighborhood, type, max_value, limit, offset
 * Lista imóveis do tenant para uso pelo MCP.
 */
router.get("/properties", async (req, res) => {
  try {
    const tenantId = Number(req.query.tenant_id);
    if (!Number.isInteger(tenantId) || tenantId < 1) {
      res.status(400).json({ error: "tenant_id obrigatório e deve ser inteiro positivo" });
      return;
    }
    const neighborhood = typeof req.query.neighborhood === "string" ? req.query.neighborhood.trim() : "";
    const type = typeof req.query.type === "string" ? req.query.type.trim() : "";
    const maxValue = typeof req.query.max_value === "string" ? Number(req.query.max_value) : NaN;
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const offset = Number(req.query.offset) || 0;

    const conditions = [eq(properties.tenantId, tenantId)];
    if (neighborhood) {
      conditions.push(ilike(properties.addressNeighborhood, `%${neighborhood}%`));
    }
    if (type) {
      conditions.push(eq(properties.type, type));
    }
    if (Number.isFinite(maxValue) && maxValue > 0) {
      const maxStr = String(maxValue);
      conditions.push(or(lte(properties.valueSale, maxStr), lte(properties.valueRent, maxStr))!);
    }

    const list = await db
      .select()
      .from(properties)
      .where(and(...conditions))
      .orderBy(desc(properties.createdAt))
      .limit(limit)
      .offset(offset);

    res.json(list);
  } catch (err) {
    console.error("[internal/properties]", err);
    res.status(500).json({ error: "Erro ao listar imóveis" });
  }
});

/**
 * GET /api/internal/properties/:id
 * Query: tenant_id (obrigatório)
 * Detalhe do imóvel com fotos para uso pelo MCP.
 */
router.get("/properties/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }
    const tenantId = Number(req.query.tenant_id);
    if (!Number.isInteger(tenantId) || tenantId < 1) {
      res.status(400).json({ error: "tenant_id obrigatório e deve ser inteiro positivo" });
      return;
    }

    const [property] = await db
      .select()
      .from(properties)
      .where(and(eq(properties.id, id), eq(properties.tenantId, tenantId)))
      .limit(1);

    if (!property) {
      res.status(404).json({ error: "Imóvel não encontrado" });
      return;
    }

    const photos = await db
      .select()
      .from(propertyPhotos)
      .where(eq(propertyPhotos.propertyId, id))
      .orderBy(asc(propertyPhotos.sortOrder), asc(propertyPhotos.id));

    res.json({ ...property, photos });
  } catch (err) {
    console.error("[internal/properties/:id]", err);
    res.status(500).json({ error: "Erro ao buscar imóvel" });
  }
});

/**
 * GET /api/internal/contacts
 * Query: tenant_id (obrigatório), limit, offset
 * Lista contatos do tenant para uso pelo MCP.
 */
router.get("/contacts", async (req, res) => {
  try {
    const tenantId = Number(req.query.tenant_id);
    if (!Number.isInteger(tenantId) || tenantId < 1) {
      res.status(400).json({ error: "tenant_id obrigatório e deve ser inteiro positivo" });
      return;
    }
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const offset = Number(req.query.offset) || 0;

    const list = await db
      .select()
      .from(contacts)
      .where(eq(contacts.tenantId, tenantId))
      .orderBy(desc(contacts.createdAt))
      .limit(limit)
      .offset(offset);

    res.json(list);
  } catch (err) {
    console.error("[internal/contacts]", err);
    res.status(500).json({ error: "Erro ao listar contatos" });
  }
});

/**
 * GET /api/internal/contacts/:id
 * Query: tenant_id (obrigatório)
 * Detalhe do contato para uso pelo MCP.
 */
router.get("/contacts/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }
    const tenantId = Number(req.query.tenant_id);
    if (!Number.isInteger(tenantId) || tenantId < 1) {
      res.status(400).json({ error: "tenant_id obrigatório e deve ser inteiro positivo" });
      return;
    }
    const [contact] = await db
      .select()
      .from(contacts)
      .where(and(eq(contacts.id, id), eq(contacts.tenantId, tenantId)))
      .limit(1);
    if (!contact) {
      res.status(404).json({ error: "Contato não encontrado" });
      return;
    }
    res.json(contact);
  } catch (err) {
    console.error("[internal/contacts/:id]", err);
    res.status(500).json({ error: "Erro ao buscar contato" });
  }
});

/**
 * GET /api/internal/tasks
 * Query: tenant_id (obrigatório), limit, offset
 * Lista tarefas do tenant para uso pelo MCP.
 */
router.get("/tasks", async (req, res) => {
  try {
    const tenantId = Number(req.query.tenant_id);
    if (!Number.isInteger(tenantId) || tenantId < 1) {
      res.status(400).json({ error: "tenant_id obrigatório e deve ser inteiro positivo" });
      return;
    }
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const offset = Number(req.query.offset) || 0;

    const list = await db
      .select()
      .from(tasks)
      .where(eq(tasks.tenantId, tenantId))
      .orderBy(desc(tasks.dueAt), desc(tasks.createdAt))
      .limit(limit)
      .offset(offset);

    res.json(list);
  } catch (err) {
    console.error("[internal/tasks]", err);
    res.status(500).json({ error: "Erro ao listar tarefas" });
  }
});

/**
 * POST /api/internal/tasks
 * Body: tenant_id (obrigatório), title, type?, contact_id?, property_id?, due_at?, notes?
 * Cria tarefa para uso pelo MCP (chat).
 */
router.post("/tasks", async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const tenantId = Number(body.tenant_id);
    if (!Number.isInteger(tenantId) || tenantId < 1) {
      res.status(400).json({ error: "tenant_id obrigatório e deve ser inteiro positivo" });
      return;
    }
    const title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : "Tarefa";
    const type = typeof body.type === "string" ? body.type : null;
    const contactId = Number(body.contact_id);
    const propertyId = Number(body.property_id);
    const dueAt = typeof body.due_at === "string" && body.due_at ? new Date(body.due_at) : null;
    const notes = typeof body.notes === "string" ? body.notes : null;

    const [task] = await db
      .insert(tasks)
      .values({
        tenantId,
        title: title.slice(0, 255),
        type: type || null,
        contactId: Number.isInteger(contactId) && contactId > 0 ? contactId : null,
        propertyId: Number.isInteger(propertyId) && propertyId > 0 ? propertyId : null,
        dueAt: dueAt && !Number.isNaN(dueAt.getTime()) ? dueAt : null,
        notes,
      })
      .returning();

    res.status(201).json(task);
  } catch (err) {
    console.error("[internal/tasks]", err);
    res.status(500).json({ error: "Erro ao criar tarefa" });
  }
});

/**
 * PATCH /api/internal/tasks/:id
 * Body: tenant_id (obrigatório). Conclui a tarefa (completedAt = now).
 */
router.patch("/tasks/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }
    const body = req.body as Record<string, unknown>;
    const tenantId = Number(body.tenant_id);
    if (!Number.isInteger(tenantId) || tenantId < 1) {
      res.status(400).json({ error: "tenant_id obrigatório e deve ser inteiro positivo" });
      return;
    }
    const [existing] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.tenantId, tenantId)))
      .limit(1);
    if (!existing) {
      res.status(404).json({ error: "Tarefa não encontrada" });
      return;
    }
    const [task] = await db
      .update(tasks)
      .set({ completedAt: new Date(), updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    res.json(task);
  } catch (err) {
    console.error("[internal/tasks/:id PATCH]", err);
    res.status(500).json({ error: "Erro ao concluir tarefa" });
  }
});

export default router;
