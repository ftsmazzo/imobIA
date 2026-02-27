import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../auth.js";

export type AuthLocals = {
  userId: number;
  tenantId: number;
  role: string;
  email: string;
};

declare global {
  namespace Express {
    interface Request {
      auth?: AuthLocals;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "Token ausente" });
    return;
  }
  try {
    const payload = verifyToken(token);
    req.auth = {
      userId: payload.sub,
      tenantId: payload.tenantId,
      role: payload.role,
      email: payload.email,
    };
    next();
  } catch {
    res.status(401).json({ error: "Token inválido ou expirado" });
  }
}
