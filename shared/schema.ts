import { z } from "zod";

// ─── User ────────────────────────────────────────────────────────────────────
export interface User {
  id: number;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
  phone?: string;
  address?: string;
  avatar?: string;
  provider?: "local" | "google" | "facebook";
}

export const socialLoginSchema = z.object({
  token: z.string().min(1),
});

export const registerSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  name: z.string().min(2, "Tên tối thiểu 2 ký tự"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
  phone: z.string().optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// ─── Holdings ────────────────────────────────────────────────────────────────
export interface Holding {
  id: number;
  userId: number;          // gắn theo từng user
  type: "gold" | "silver";
  brand: string;
  product: string;
  unit: "luong" | "chi" | "gram" | "kg";
  quantity: number;
  buyPrice: number;
  buyDate: string;
  note?: string;
}

export const insertHoldingSchema = z.object({
  type: z.enum(["gold", "silver"]),
  brand: z.string().min(1),
  product: z.string().min(1),
  unit: z.enum(["luong", "chi", "gram", "kg"]),
  quantity: z.number().positive(),
  buyPrice: z.number().positive(),
  buyDate: z.string(),
  note: z.string().optional(),
});
export type InsertHolding = z.infer<typeof insertHoldingSchema>;

// ─── Price History ───────────────────────────────────────────────────────────
export interface PriceHistory {
  id: number;
  type: string;
  product: string;
  buyPrice: number;
  sellPrice: number;
  recordedAt: string;
}

export type InsertPriceHistory = Omit<PriceHistory, "id">;
