import { Context, Next } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { getCredentials } from "./storage";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-me";
const TOKEN_COOKIE = "nfc_session";
const TOKEN_EXPIRY = 24 * 60 * 60;
const IS_PRODUCTION = process.env.NODE_ENV === "production" || !!process.env.NETLIFY || !!process.env.RAILWAY_ENVIRONMENT || !!process.env.RENDER;

interface JwtPayload {
  email: string;
  iat: number;
  exp: number;
}

function base64url(data: string): string {
  return btoa(data).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(data: string): string {
  const padded = data.replace(/-/g, "+").replace(/_/g, "/");
  return atob(padded);
}

async function hmacSign(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return base64url(String.fromCharCode(...new Uint8Array(sig)));
}

export async function createToken(email: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify({ email, iat: now, exp: now + TOKEN_EXPIRY }));
  const signature = await hmacSign(`${header}.${payload}`);
  return `${header}.${payload}.${signature}`;
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const [header, payload, signature] = token.split(".");
    if (!header || !payload || !signature) return null;
    const expected = await hmacSign(`${header}.${payload}`);
    if (signature !== expected) return null;
    const data = JSON.parse(base64urlDecode(payload)) as JwtPayload;
    if (data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}

export async function login(email: string, password: string): Promise<string | null> {
  const creds = getCredentials();
  if (email.toLowerCase() !== creds.email.toLowerCase()) return null;
  const valid = await Bun.password.verify(password, creds.passwordHash);
  if (!valid) return null;
  return createToken(email);
}

export function setAuthCookie(c: Context, token: string): void {
  setCookie(c, TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "Lax",
    maxAge: TOKEN_EXPIRY,
    path: "/"
  });
}

export function clearAuthCookie(c: Context): void {
  deleteCookie(c, TOKEN_COOKIE, { path: "/" });
}

export async function authMiddleware(c: Context, next: Next): Promise<Response | void> {
  const token = getCookie(c, TOKEN_COOKIE);
  if (!token) {
    return c.redirect("/login");
  }
  const payload = await verifyToken(token);
  if (!payload) {
    clearAuthCookie(c);
    return c.redirect("/login");
  }
  c.set("user", payload);
  await next();
}

export async function apiAuthMiddleware(c: Context, next: Next): Promise<Response | void> {
  const token = getCookie(c, TOKEN_COOKIE);
  if (!token) {
    return c.json({ error: "Nicht autorisiert. Bitte erneut anmelden." }, 401);
  }
  const payload = await verifyToken(token);
  if (!payload) {
    clearAuthCookie(c);
    return c.json({ error: "Sitzung abgelaufen. Bitte erneut anmelden." }, 401);
  }
  c.set("user", payload);
  await next();
}

export async function isAuthenticated(c: Context): Promise<boolean> {
  const token = getCookie(c, TOKEN_COOKIE);
  if (!token) return false;
  const payload = await verifyToken(token);
  return payload !== null;
}
