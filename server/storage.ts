import fs from "fs";
import path from "path";
import type {
  User, Holding, InsertHolding,
  PriceHistory, InsertPriceHistory,
} from "@shared/schema";

const DATA_FILE = path.join(process.cwd(), "data.json");

interface DataStore {
  users: User[];
  holdings: Holding[];
  priceHistory: PriceHistory[];
  nextId: number;
}

function loadData(): DataStore {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    }
  } catch {}
  return { users: [], holdings: [], priceHistory: [], nextId: 1 };
}

function saveData(data: DataStore) {
  try { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2)); }
  catch (e) { console.error("Save error:", e); }
}

let store = loadData();

// ─── User ────────────────────────────────────────────────────────────────────
export function getUserByEmail(email: string): User | undefined {
  return store.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function getUserById(id: number): User | undefined {
  return store.users.find((u) => u.id === id);
}

export function createUser(data: Omit<User, "id">): User {
  const user: User = { ...data, id: store.nextId++ };
  store.users.push(user);
  saveData(store);
  return user;
}

export function updateUser(id: number, data: Partial<Omit<User, "id" | "passwordHash">>): User | undefined {
  const idx = store.users.findIndex((u) => u.id === id);
  if (idx === -1) return undefined;
  store.users[idx] = { ...store.users[idx], ...data };
  saveData(store);
  return store.users[idx];
}

export function getAllUsers(): Omit<User, "passwordHash">[] {
  return store.users.map(({ passwordHash, ...u }) => u);
}

// ─── Holdings ────────────────────────────────────────────────────────────────
export function getHoldingsByUser(userId: number): Holding[] {
  return store.holdings.filter((h) => h.userId === userId);
}

export function getHoldingById(id: number): Holding | undefined {
  return store.holdings.find((h) => h.id === id);
}

export function createHolding(userId: number, data: InsertHolding): Holding {
  const holding: Holding = { ...data, id: store.nextId++, userId };
  store.holdings.push(holding);
  saveData(store);
  return holding;
}

export function updateHolding(id: number, data: Partial<InsertHolding>): Holding | undefined {
  const idx = store.holdings.findIndex((h) => h.id === id);
  if (idx === -1) return undefined;
  store.holdings[idx] = { ...store.holdings[idx], ...data };
  saveData(store);
  return store.holdings[idx];
}

export function deleteHolding(id: number): void {
  store.holdings = store.holdings.filter((h) => h.id !== id);
  saveData(store);
}

// ─── Price History ───────────────────────────────────────────────────────────
export function getPriceHistory(type: string, product: string, limit = 60): PriceHistory[] {
  return store.priceHistory
    .filter((r) => r.type === type && r.product === product)
    .slice(-limit);
}

export function addPriceHistory(data: InsertPriceHistory): PriceHistory {
  const record: PriceHistory = { ...data, id: store.nextId++ };
  store.priceHistory.push(record);
  if (store.priceHistory.length > 1000) store.priceHistory = store.priceHistory.slice(-1000);
  saveData(store);
  return record;
}

export function getLatestPriceHistory(): PriceHistory[] {
  return store.priceHistory.slice(-100);
}
