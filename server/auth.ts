import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { getUserById } from "./storage";

const JWT_SECRET = process.env.JWT_SECRET || "vangbac-secret-key-2026-change-in-prod";
const JWT_EXPIRES = "30d"; // Token hết hạn sau 30 ngày

export interface JWTPayload {
  userId: number;
  email: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

// Express middleware — đính kèm user vào req
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "Chưa đăng nhập" });
  }
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ success: false, error: "Token không hợp lệ hoặc đã hết hạn" });
  }
  const user = getUserById(payload.userId);
  if (!user) {
    return res.status(401).json({ success: false, error: "Tài khoản không tồn tại" });
  }
  (req as any).user = user;
  next();
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const payload = verifyToken(authHeader.slice(7));
    if (payload) {
      const user = getUserById(payload.userId);
      if (user) (req as any).user = user;
    }
  }
  next();
}
