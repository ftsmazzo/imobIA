import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { hashPassword } from "../auth.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

/** GET /api/users — lista usuários do tenant */
router.get("/", async (req, res) => {
  try {
    const auth = req.auth!;
    const list = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.tenantId, auth.tenantId));
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao listar usuários" });
  }
});

/** GET /api/users/:id — detalhe (só do mesmo tenant) */
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }
    const auth = req.auth!;
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.tenantId, auth.tenantId)))
      .limit(1);
    if (!user) {
      res.status(404).json({ error: "Usuário não encontrado" });
      return;
    }
    const { passwordHash: _, ...rest } = user;
    res.json(rest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar usuário" });
  }
});

/** POST /api/users — cria usuário no tenant (admin) */
router.post("/", async (req, res) => {
  try {
    const auth = req.auth!;
    if (auth.role !== "admin" && auth.role !== "gestor") {
      res.status(403).json({ error: "Sem permissão para criar usuário" });
      return;
    }
    const { email, name, password, role } = req.body as {
      email?: string;
      name?: string;
      password?: string;
      role?: string;
    };
    if (!email || !password) {
      res.status(400).json({ error: "Email e senha obrigatórios" });
      return;
    }
    const [existing] = await db
      .select()
      .from(users)
      .where(and(eq(users.tenantId, auth.tenantId), eq(users.email, email)))
      .limit(1);
    if (existing) {
      res.status(409).json({ error: "Email já existe neste tenant" });
      return;
    }
    const passwordHash = await hashPassword(password);
    const [user] = await db
      .insert(users)
      .values({
        tenantId: auth.tenantId,
        email,
        name: name ?? null,
        passwordHash,
        role: role ?? "corretor",
      })
      .returning();
    if (!user) {
      res.status(500).json({ error: "Erro ao criar usuário" });
      return;
    }
    const { passwordHash: _, ...rest } = user;
    res.status(201).json(rest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar usuário" });
  }
});

/** PATCH /api/users/:id — atualiza usuário (só do mesmo tenant) */
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
      .from(users)
      .where(and(eq(users.id, id), eq(users.tenantId, auth.tenantId)))
      .limit(1);
    if (!existing) {
      res.status(404).json({ error: "Usuário não encontrado" });
      return;
    }
    const body = req.body as Record<string, unknown>;
    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (body.name !== undefined) update.name = body.name;
    if (body.role !== undefined && (auth.role === "admin" || auth.role === "gestor")) update.role = body.role;
    if (body.isActive !== undefined && (auth.role === "admin" || auth.role === "gestor")) update.isActive = body.isActive;
    if (body.password !== undefined && body.password !== "") {
      update.passwordHash = await hashPassword(String(body.password));
    }
    const [user] = await db
      .update(users)
      .set(update as typeof users.$inferInsert)
      .where(eq(users.id, id))
      .returning();
    if (!user) {
      res.status(500).json({ error: "Erro ao atualizar" });
      return;
    }
    const { passwordHash: _, ...rest } = user;
    res.json(rest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao atualizar usuário" });
  }
});

export default router;
