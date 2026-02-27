import { Router } from "express";
import { eq, and, desc, asc } from "drizzle-orm";
import { db } from "../db/index.js";
import { properties, propertyPhotos } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

/** GET /api/properties — lista imóveis do tenant (query: status, type, limit, offset) */
router.get("/", async (req, res) => {
  try {
    const auth = req.auth!;
    const { status, type, limit, offset } = req.query;
    const list = await db
      .select()
      .from(properties)
      .where(
        and(
          eq(properties.tenantId, auth.tenantId),
          ...(status && typeof status === "string" ? [eq(properties.status, status)] : []),
          ...(type && typeof type === "string" ? [eq(properties.type, type)] : [])
        )
      )
      .orderBy(desc(properties.createdAt))
      .limit(Math.min(Number(limit) || 50, 100))
      .offset(Number(offset) || 0);
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao listar imóveis" });
  }
});

/** GET /api/properties/:id — detalhe com fotos */
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }
    const auth = req.auth!;
    const [property] = await db
      .select()
      .from(properties)
      .where(and(eq(properties.id, id), eq(properties.tenantId, auth.tenantId)))
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
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar imóvel" });
  }
});

/** POST /api/properties */
router.post("/", async (req, res) => {
  try {
    const auth = req.auth!;
    const body = req.body as Record<string, unknown>;
    const [property] = await db
      .insert(properties)
      .values({
        tenantId: auth.tenantId,
        type: (body.type as string) ?? "apartment",
        title: (body.title as string) ?? null,
        addressStreet: (body.addressStreet as string) ?? null,
        addressNumber: (body.addressNumber as string) ?? null,
        addressComplement: (body.addressComplement as string) ?? null,
        addressNeighborhood: (body.addressNeighborhood as string) ?? null,
        addressCity: (body.addressCity as string) ?? null,
        addressState: (body.addressState as string) ?? null,
        addressZip: (body.addressZip as string) ?? null,
        valueSale: (body.valueSale as string) ?? null,
        valueRent: (body.valueRent as string) ?? null,
        status: (body.status as string) ?? "available",
        description: (body.description as string) ?? null,
        bedrooms: (body.bedrooms as number) ?? null,
        bathrooms: (body.bathrooms as number) ?? null,
        parkingSpaces: (body.parkingSpaces as number) ?? null,
        areaM2: (body.areaM2 as string) ?? null,
        code: (body.code as string) ?? null,
        isHighlight: (body.isHighlight as boolean) ?? false,
        metadata: (body.metadata as object) ?? null,
      })
      .returning();
    res.status(201).json(property);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar imóvel" });
  }
});

/** PATCH /api/properties/:id */
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
      .from(properties)
      .where(and(eq(properties.id, id), eq(properties.tenantId, auth.tenantId)))
      .limit(1);
    if (!existing) {
      res.status(404).json({ error: "Imóvel não encontrado" });
      return;
    }
    const body = req.body as Record<string, unknown>;
    const allowed = [
      "type", "title", "addressStreet", "addressNumber", "addressComplement",
      "addressNeighborhood", "addressCity", "addressState", "addressZip",
      "valueSale", "valueRent", "status", "description", "bedrooms", "bathrooms",
      "parkingSpaces", "areaM2", "code", "isHighlight", "metadata",
    ] as const;
    const update: Record<string, unknown> = { updatedAt: new Date() };
    for (const k of allowed) {
      if (body[k] !== undefined) update[k] = body[k];
    }
    const [property] = await db
      .update(properties)
      .set(update as typeof properties.$inferInsert)
      .where(eq(properties.id, id))
      .returning();
    res.json(property);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao atualizar imóvel" });
  }
});

/** DELETE /api/properties/:id */
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }
    const auth = req.auth!;
    const [existing] = await db
      .select()
      .from(properties)
      .where(and(eq(properties.id, id), eq(properties.tenantId, auth.tenantId)))
      .limit(1);
    if (!existing) {
      res.status(404).json({ error: "Imóvel não encontrado" });
      return;
    }
    await db.delete(propertyPhotos).where(eq(propertyPhotos.propertyId, id));
    await db.delete(properties).where(eq(properties.id, id));
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao excluir imóvel" });
  }
});

/** GET /api/properties/:id/photos — fotos do imóvel */
router.get("/:id/photos", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }
    const auth = req.auth!;
    const [property] = await db
      .select({ id: properties.id })
      .from(properties)
      .where(and(eq(properties.id, id), eq(properties.tenantId, auth.tenantId)))
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
    res.json(photos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao listar fotos" });
  }
});

/** POST /api/properties/:id/photos */
router.post("/:id/photos", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }
    const auth = req.auth!;
    const [property] = await db
      .select({ id: properties.id })
      .from(properties)
      .where(and(eq(properties.id, id), eq(properties.tenantId, auth.tenantId)))
      .limit(1);
    if (!property) {
      res.status(404).json({ error: "Imóvel não encontrado" });
      return;
    }
    const { url, sortOrder } = req.body as { url?: string; sortOrder?: number };
    if (!url) {
      res.status(400).json({ error: "url obrigatória" });
      return;
    }
    const [photo] = await db
      .insert(propertyPhotos)
      .values({ propertyId: id, url, sortOrder: sortOrder ?? 0 })
      .returning();
    res.status(201).json(photo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao adicionar foto" });
  }
});

/** DELETE /api/properties/:propertyId/photos/:photoId */
router.delete("/:propertyId/photos/:photoId", async (req, res) => {
  try {
    const propertyId = Number(req.params.propertyId);
    const photoId = Number(req.params.photoId);
    if (Number.isNaN(propertyId) || Number.isNaN(photoId)) {
      res.status(400).json({ error: "IDs inválidos" });
      return;
    }
    const auth = req.auth!;
    const [property] = await db
      .select({ id: properties.id })
      .from(properties)
      .where(and(eq(properties.id, propertyId), eq(properties.tenantId, auth.tenantId)))
      .limit(1);
    if (!property) {
      res.status(404).json({ error: "Imóvel não encontrado" });
      return;
    }
    const [deleted] = await db
      .delete(propertyPhotos)
      .where(and(eq(propertyPhotos.id, photoId), eq(propertyPhotos.propertyId, propertyId)))
      .returning({ id: propertyPhotos.id });
    if (!deleted) {
      res.status(404).json({ error: "Foto não encontrada" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao excluir foto" });
  }
});

export default router;
