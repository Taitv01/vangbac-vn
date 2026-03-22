import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  createdAt: string;
  provider?: "local" | "google" | "facebook";
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
}

const STORAGE_KEY = "vangbac_auth";

function loadFromStorage(): { token: string; user: AuthUser } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.token && parsed?.user) return parsed;
  } catch {}
  return null;
}

function saveToStorage(token: string, user: AuthUser) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
}

function clearStorage() {
  localStorage.removeItem(STORAGE_KEY);
}

// Initialize from localStorage
const saved = loadFromStorage();
let globalAuth: AuthState = saved
  ? { user: saved.user, token: saved.token, loading: false }
  : { user: null, token: null, loading: true };

let listeners: Array<() => void> = [];

function notify() { listeners.forEach((fn) => fn()); }

export function getToken(): string | null { return globalAuth.token; }

export function setAuth(token: string, user: AuthUser) {
  globalAuth = { user, token, loading: false };
  saveToStorage(token, user);
  notify();
}

export function clearAuth() {
  globalAuth = { user: null, token: null, loading: false };
  clearStorage();
  notify();
}

export function initAuth() {
  const saved = loadFromStorage();
  if (saved) {
    globalAuth = { user: saved.user, token: saved.token, loading: false };
  } else {
    globalAuth = { ...globalAuth, loading: false };
  }
  notify();
}

export function useAuth() {
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const fn = () => forceUpdate((n) => n + 1);
    listeners.push(fn);
    return () => { listeners = listeners.filter((l) => l !== fn); };
  }, []);
  return globalAuth;
}

export async function loginApi(email: string, password: string) {
  const res = await apiRequest("POST", "/api/auth/login", { email, password });
  const data = await res.json();
  if (data.success) setAuth(data.token, data.user);
  return data;
}

export async function registerApi(email: string, name: string, password: string, phone?: string) {
  const res = await apiRequest("POST", "/api/auth/register", { email, name, password, phone });
  const data = await res.json();
  if (data.success) setAuth(data.token, data.user);
  return data;
}

export async function googleLoginApi(idToken: string) {
  const res = await apiRequest("POST", "/api/auth/google", { token: idToken });
  const data = await res.json();
  if (data.success) setAuth(data.token, data.user);
  return data;
}

export async function facebookLoginApi(accessToken: string) {
  const res = await apiRequest("POST", "/api/auth/facebook", { token: accessToken });
  const data = await res.json();
  if (data.success) setAuth(data.token, data.user);
  return data;
}

export async function updateProfileApi(data: { name?: string; phone?: string; address?: string }) {
  const res = await apiRequest("PATCH", "/api/auth/profile", data);
  const result = await res.json();
  if (result.success && globalAuth.user && globalAuth.token) {
    setAuth(globalAuth.token, result.user);
  }
  return result;
}
