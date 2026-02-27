import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { tenants, users } from "../db/schema.js";
import { hashPassword, comparePassword, signToken } from "../auth.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

/** POST /api/auth/login — email + password, retorna token e user */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ error: "Email e senha obrigatórios" });
      return;
    }
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (!user || !user.isActive) {
      res.status(401).json({ error: "Credenciais inválidas" });
      return;
    }
    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) {
      res.status(401).json({ error: "Credenciais inválidas" });
      return;
    }
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, user.tenantId)).limit(1);
    const token = signToken({
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email,
    });
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        tenant: tenant ? { id: tenant.id, companyName: tenant.companyName } : null,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao fazer login" });
  }
});

/** POST /api/auth/register — cria tenant + primeiro usuário (admin) */
router.post("/register", async (req, res) => {
  try {
    const { companyName, email, password, planId } = req.body as {
      companyName?: string;
      email?: string;
      password?: string;
      planId?: number;
    };
    if (!companyName || !email || !password) {
      res.status(400).json({ error: "companyName, email e senha obrigatórios" });
      return;
    }
    const plan = planId ?? 1;
    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing) {
      res.status(409).json({ error: "Email já cadastrado" });
      return;
    }
    const passwordHash = await hashPassword(password);
    const [tenant] = await db
      .insert(tenants)
      .values({
        planId: plan,
        companyName,
        email,
        status: "active",
        isActivated: true,
      })
      .returning({ id: tenants.id });
    if (!tenant) {
      res.status(500).json({ error: "Erro ao criar conta" });
      return;
    }
    await db.insert(users).values({
      tenantId: tenant.id,
      email,
      name: companyName,
      passwordHash,
      role: "admin",
    });
    res.status(201).json({
      message: "Conta criada. Faça login em POST /api/auth/login.",
      tenantId: tenant.id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao registrar" });
  }
});

/** GET /api/auth/me — usuário logado (requer Bearer token) */
router.get("/me", requireAuth, async (req, res) => {
  try {
    const auth = req.auth!;
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        tenantId: users.tenantId,
      })
      .from(users)
      .where(eq(users.id, auth.userId))
      .limit(1);
    if (!user) {
      res.status(404).json({ error: "Usuário não encontrado" });
      return;
    }
    const [tenant] = await db
      .select({ id: tenants.id, companyName: tenants.companyName, status: tenants.status })
      .from(tenants)
      .where(eq(tenants.id, auth.tenantId))
      .limit(1);
    res.json({ user, tenant: tenant ?? null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar usuário" });
  }
});

export default router;
