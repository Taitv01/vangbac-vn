import { useState, useEffect, createContext, useContext } from "react";
import { apiRequest } from "@/lib/queryClient";

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
}

// Global state — tránh localStorage (bị block trong sandbox)
let globalAuth: AuthState = { user: null, token: null, loading: true };
let listeners: Array<() => void> = [];

function notify() { listeners.forEach((fn) => fn()); }

export function getToken(): string | null { return globalAuth.token; }

// In-memory token store (works in both iframe sandbox and standalone PWA)
// Note: tokens are lost on page refresh — user must log in again.
// In standalone PWA mode, the app rarely refreshes, so this is acceptable.
let _tokenStore: { token: string; user: AuthUser } | null = null;

export function setAuth(token: string, user: AuthUser) {
  globalAuth = { user, token, loading: false };
  _tokenStore = { token, user };
  notify();
}

export function clearAuth() {
  globalAuth = { user: null, token: null, loading: false };
  _tokenStore = null;
  notify();
}

// Restore from in-memory store (called on mount)
export function initAuth() {
  if (_tokenStore) {
    globalAuth = { user: _tokenStore.user, token: _tokenStore.token, loading: false };
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

// API helpers
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

export async function updateProfileApi(data: { name?: string; phone?: string; address?: string }) {
  const res = await apiRequest("PATCH", "/api/auth/profile", data);
  const result = await res.json();
  if (result.success && globalAuth.user && globalAuth.token) {
    setAuth(globalAuth.token, result.user);
  }
  return result;
}
