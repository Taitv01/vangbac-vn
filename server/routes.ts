import type { Express, Request } from "express";
import { type Server } from "http";
import { XMLParser } from "fast-xml-parser";
import {
  registerSchema, loginSchema, updateProfileSchema, insertHoldingSchema,
} from "@shared/schema";
import {
  getUserByEmail, createUser, updateUser, getAllUsers,
  getHoldingsByUser, createHolding, updateHolding, deleteHolding, getHoldingById,
  getPriceHistory, addPriceHistory, getLatestPriceHistory,
} from "./storage";
import {
  hashPassword, verifyPassword, signToken, requireAuth,
} from "./auth";
import type { User } from "@shared/schema";

// ─── BTMC API ─────────────────────────────────────────────────────────────────
const BTMC_API = "http://api.btmc.vn/api/BTMCAPI/getpricebtmc?key=3kd8ub1llcg9t45hnoh8hmn7t5kc2v";

async function fetchBTMCPrices() {
  const res = await fetch(BTMC_API, { signal: AbortSignal.timeout(8000) });
  const xml = await res.text();
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });
  const parsed = parser.parse(xml);
  const dataList = parsed?.DataList?.Data;
  if (!dataList) return null;
  const items = Array.isArray(dataList) ? dataList : [dataList];

  const goldItems: any[] = [];
  const silverItems: any[] = [];

  items.forEach((item: any) => {
    const rowKey = Object.keys(item).find((k) => k.startsWith("n_"));
    if (!rowKey) return;
    const s = rowKey.replace("n_", "");
    const name = item[`n_${s}`];
    const karat = item[`k_${s}`];
    const buyPrice = parseFloat(item[`pb_${s}`]);
    const sellPrice = parseFloat(item[`ps_${s}`]);
    const updatedAt = item[`d_${s}`];
    if (!name || isNaN(buyPrice)) return;
    const entry = { name, buyPrice, sellPrice: sellPrice || 0, updatedAt };
    if (karat === "24k" || name.includes("VÀNG")) goldItems.push(entry);
    else if (name.includes("BẠC")) silverItems.push(entry);
  });
  return { gold: goldItems, silver: silverItems };
}

async function fetchSpotPrices() {
  try {
    const [r1, r2, r3] = await Promise.all([
      fetch("https://query1.finance.yahoo.com/v8/finance/chart/GC%3DF?interval=1d&range=1d", { signal: AbortSignal.timeout(5000) }),
      fetch("https://query1.finance.yahoo.com/v8/finance/chart/SI%3DF?interval=1d&range=1d", { signal: AbortSignal.timeout(5000) }),
      fetch("https://query1.finance.yahoo.com/v8/finance/chart/USDVND%3DX?interval=1d&range=1d", { signal: AbortSignal.timeout(5000) }),
    ]);
    const [d1, d2, d3] = await Promise.all([r1.json(), r2.json(), r3.json()]);
    return {
      goldUSD: d1?.chart?.result?.[0]?.meta?.regularMarketPrice ?? null,
      silverUSD: d2?.chart?.result?.[0]?.meta?.regularMarketPrice ?? null,
      usdvnd: d3?.chart?.result?.[0]?.meta?.regularMarketPrice ?? 25000,
    };
  } catch {
    return { goldUSD: null, silverUSD: null, usdvnd: 25000 };
  }
}

// ─── Routes ───────────────────────────────────────────────────────────────────
export async function registerRoutes(httpServer: Server, app: Express): Promise<void> {

  // ── Auth ────────────────────────────────────────────────────────────────────

  // Đăng ký
  app.post("/api/auth/register", async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.flatten().fieldErrors });
    const { email, name, password, phone } = parsed.data;
    if (getUserByEmail(email)) return res.status(409).json({ success: false, error: "Email đã được sử dụng" });
    const passwordHash = await hashPassword(password);
    const user = createUser({ email, name, passwordHash, phone, createdAt: new Date().toISOString() });
    const token = signToken({ userId: user.id, email: user.email });
    const { passwordHash: _, ...safeUser } = user;
    return res.json({ success: true, token, user: safeUser });
  });

  // Đăng nhập
  app.post("/api/auth/login", async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: "Dữ liệu không hợp lệ" });
    const { email, password } = parsed.data;
    const user = getUserByEmail(email);
    if (!user) return res.status(401).json({ success: false, error: "Email hoặc mật khẩu không đúng" });
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return res.status(401).json({ success: false, error: "Email hoặc mật khẩu không đúng" });
    const token = signToken({ userId: user.id, email: user.email });
    const { passwordHash: _, ...safeUser } = user;
    return res.json({ success: true, token, user: safeUser });
  });

  // Lấy thông tin bản thân
  app.get("/api/auth/me", requireAuth, (req, res) => {
    const user = (req as any).user as User;
    const { passwordHash: _, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  });

  // Cập nhật hồ sơ
  app.patch("/api/auth/profile", requireAuth, (req, res) => {
    const user = (req as any).user as User;
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.flatten().fieldErrors });
    const updated = updateUser(user.id, parsed.data);
    if (!updated) return res.status(404).json({ success: false, error: "Không tìm thấy user" });
    const { passwordHash: _, ...safeUser } = updated;
    res.json({ success: true, user: safeUser });
  });

  // ── Prices (public) ─────────────────────────────────────────────────────────

  app.get("/api/prices", async (_req, res) => {
    try {
      const [btmc, spot] = await Promise.all([fetchBTMCPrices(), fetchSpotPrices()]);
      if (btmc) {
        const now = new Date().toISOString();
        const recent = getLatestPriceHistory();
        const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString();
        if (!recent.some((r) => r.recordedAt > oneHourAgo)) {
          const sjc = btmc.gold.find((g: any) => g.name.includes("SJC"));
          const nhan = btmc.gold.find((g: any) => g.name.includes("NHẪN") || g.name.includes("TRÒN"));
          const silver = btmc.silver[0];
          if (sjc) addPriceHistory({ type: "gold", product: "SJC", buyPrice: sjc.buyPrice, sellPrice: sjc.sellPrice, recordedAt: now });
          if (nhan) addPriceHistory({ type: "gold", product: "Nhẫn tròn trơn", buyPrice: nhan.buyPrice, sellPrice: nhan.sellPrice, recordedAt: now });
          if (silver) addPriceHistory({ type: "silver", product: "Bạc BTMC", buyPrice: silver.buyPrice, sellPrice: silver.sellPrice, recordedAt: now });
        }
      }
      res.json({ success: true, data: btmc, spot });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get("/api/prices/history", (req, res) => {
    const { type, product } = req.query;
    const history = getPriceHistory(String(type || "gold"), String(product || "SJC"), 60);
    res.json({ success: true, data: history });
  });

  // ── Holdings (protected) ────────────────────────────────────────────────────

  app.get("/api/holdings", requireAuth, (req, res) => {
    const user = (req as any).user as User;
    res.json({ success: true, data: getHoldingsByUser(user.id) });
  });

  app.post("/api/holdings", requireAuth, (req, res) => {
    const user = (req as any).user as User;
    const parsed = insertHoldingSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.flatten() });
    const holding = createHolding(user.id, parsed.data);
    res.json({ success: true, data: holding });
  });

  app.patch("/api/holdings/:id", requireAuth, (req, res) => {
    const user = (req as any).user as User;
    const id = parseInt(req.params.id);
    const existing = getHoldingById(id);
    if (!existing || existing.userId !== user.id) return res.status(404).json({ success: false, error: "Không tìm thấy" });
    const updated = updateHolding(id, req.body);
    res.json({ success: true, data: updated });
  });

  app.delete("/api/holdings/:id", requireAuth, (req, res) => {
    const user = (req as any).user as User;
    const id = parseInt(req.params.id);
    const existing = getHoldingById(id);
    if (!existing || existing.userId !== user.id) return res.status(404).json({ success: false, error: "Không tìm thấy" });
    deleteHolding(id);
    res.json({ success: true });
  });
}
