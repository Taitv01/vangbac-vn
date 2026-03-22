import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { getUserById } from "./storage";

const JWT_SECRET = process.env.JWT_SECRET || "vangbac-secret-key-2026-change-in-prod";
const JWT_EXPIRES = "30d";

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

// Google OAuth — verify ID token via Google's tokeninfo endpoint
export async function verifyGoogleToken(idToken: string): Promise<{ email: string; name: string; picture?: string } | null> {
  try {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.email || !data.email_verified) return null;
    return { email: data.email, name: data.name || data.email.split("@")[0], picture: data.picture };
  } catch {
    return null;
  }
}

// Facebook OAuth — verify access token via Graph API
export async function verifyFacebookToken(accessToken: string): Promise<{ email: string; name: string; picture?: string } | null> {
  try {
    const res = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${accessToken}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.email) return null;
    return { email: data.email, name: data.name || "User", picture: data.picture?.data?.url };
  } catch {
    return null;
  }
}
