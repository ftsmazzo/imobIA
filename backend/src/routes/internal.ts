import { Router, Request, Response } from "express";
import { eq, and, desc, asc, ilike, or, lte } from "drizzle-orm";
import { db } from "../db/index.js";
import { properties, propertyPhotos, contacts } from "../db/schema.js";

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

export default router;
