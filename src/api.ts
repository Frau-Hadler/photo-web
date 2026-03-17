import { Hono } from "hono";
import { join } from "path";
import { unlinkSync, existsSync, mkdirSync } from "fs";
import { login, setAuthCookie, clearAuthCookie, apiAuthMiddleware, createToken } from "./auth";
import {
  getSettings, saveSettings, getCategories, saveCategories,
  getImages, saveImages, getMessages, saveMessages,
  getCredentials, saveCredentials,
  type SiteSettings, type Category, type GalleryImage, type ContactMessage
} from "./storage";
import { syncToGitHub } from "./github-sync";

const UPLOAD_DIR = join(import.meta.dir, "..", "uploads");
if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

export const api = new Hono();

// --- Auth ---
api.post("/login", async (c) => {
  const ip = c.req.header("x-forwarded-for") || "unknown";
  if (!checkRateLimit(`login:${ip}`, 5, 15 * 60 * 1000)) {
    return c.json({ error: "Zu viele Anmeldeversuche. Bitte warte 15 Minuten." }, 429);
  }

  const body = await c.req.json().catch(() => null);
  if (!body?.email || !body?.password) {
    return c.json({ error: "E-Mail und Passwort sind erforderlich." }, 400);
  }

  const token = await login(body.email, body.password);
  if (!token) {
    return c.json({ error: "Ungültige Anmeldedaten." }, 401);
  }

  setAuthCookie(c, token);
  return c.json({ success: true });
});

api.post("/logout", (c) => {
  clearAuthCookie(c);
  return c.json({ success: true });
});

// --- Contact Form (public) ---
api.post("/contact", async (c) => {
  const ip = c.req.header("x-forwarded-for") || "unknown";
  if (!checkRateLimit(`contact:${ip}`, 3, 60 * 60 * 1000)) {
    return c.json({ error: "Zu viele Nachrichten. Bitte versuche es später erneut." }, 429);
  }

  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: "Ungültige Anfrage." }, 400);

  const { name, email, subject, message, privacyAccepted, honeypot, mathAnswer, mathExpected } = body;

  if (honeypot) {
    return c.json({ success: true });
  }

  if (parseInt(mathAnswer) !== parseInt(mathExpected)) {
    return c.json({ error: "Falsche Rechenaufgabe. Bitte versuche es erneut." }, 400);
  }

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return c.json({ error: "Name, E-Mail und Nachricht sind Pflichtfelder." }, 400);
  }

  if (!privacyAccepted) {
    return c.json({ error: "Bitte stimme der Datenschutzerklärung zu." }, 400);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return c.json({ error: "Bitte gib eine gültige E-Mail-Adresse ein." }, 400);
  }

  const sanitize = (s: string) => s.replace(/[<>]/g, "").trim().substring(0, 1000);

  const msg: ContactMessage = {
    id: crypto.randomUUID(),
    name: sanitize(name),
    email: sanitize(email),
    subject: sanitize(subject || "Kein Betreff"),
    message: sanitize(message).substring(0, 5000),
    createdAt: new Date().toISOString(),
    read: false,
    privacyAccepted: true
  };

  const messages = getMessages();
  messages.unshift(msg);
  if (messages.length > 500) messages.length = 500;
  saveMessages(messages);

  return c.json({ success: true, message: "Nachricht erfolgreich gesendet!" });
});

// --- Public Data ---
api.get("/public/settings", (c) => {
  const s = getSettings();
  return c.json({
    siteName: s.siteName,
    siteTagline: s.siteTagline,
    logo: s.logo,
    heroTitle: s.heroTitle,
    heroSubtitle: s.heroSubtitle,
    heroButtonText: s.heroButtonText,
    heroButtonLink: s.heroButtonLink,
    aboutTitle: s.aboutTitle,
    aboutText: s.aboutText,
    aboutImage: s.aboutImage,
    galleryTitle: s.galleryTitle,
    gallerySubtitle: s.gallerySubtitle,
    contactTitle: s.contactTitle,
    contactSubtitle: s.contactSubtitle,
    commissionTitle: s.commissionTitle,
    commissionText: s.commissionText,
    footerText: s.footerText,
    socialLinks: s.socialLinks,
    customLinks: s.customLinks,
    primaryColor: s.primaryColor,
    accentColor: s.accentColor,
    metaDescription: s.metaDescription
  });
});

api.get("/public/categories", (c) => {
  return c.json(getCategories().sort((a, b) => a.order - b.order));
});

api.get("/public/gallery", (c) => {
  const categoryId = c.req.query("category");
  let images = getImages().sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  if (categoryId) images = images.filter(i => i.categoryId === categoryId);
  return c.json(images);
});

api.get("/public/impressum", (c) => {
  const s = getSettings();
  return c.json(s.impressum);
});

// ============ ADMIN ROUTES (protected) ============

const admin = new Hono();
admin.use("*", apiAuthMiddleware);

// --- Settings ---
admin.get("/settings", (c) => {
  return c.json(getSettings());
});

admin.put("/settings", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: "Ungültige Daten." }, 400);

  const current = getSettings();
  const updated: SiteSettings = { ...current, ...body };
  if (body.impressum) {
    updated.impressum = { ...current.impressum, ...body.impressum };
  }
  saveSettings(updated);
  return c.json({ success: true });
});

// --- Categories ---
admin.get("/categories", (c) => {
  return c.json(getCategories().sort((a, b) => a.order - b.order));
});

admin.post("/categories", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body?.name?.trim()) return c.json({ error: "Name ist erforderlich." }, 400);

  const categories = getCategories();
  const cat: Category = {
    id: crypto.randomUUID(),
    name: body.name.trim(),
    description: (body.description || "").trim(),
    order: categories.length,
    createdAt: new Date().toISOString()
  };
  categories.push(cat);
  saveCategories(categories);
  return c.json(cat, 201);
});

admin.put("/categories/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: "Ungültige Daten." }, 400);

  const categories = getCategories();
  const idx = categories.findIndex(cat => cat.id === id);
  if (idx === -1) return c.json({ error: "Kategorie nicht gefunden." }, 404);

  if (body.name) categories[idx].name = body.name.trim();
  if (body.description !== undefined) categories[idx].description = body.description.trim();
  if (body.order !== undefined) categories[idx].order = body.order;
  saveCategories(categories);
  return c.json(categories[idx]);
});

admin.delete("/categories/:id", (c) => {
  const id = c.req.param("id");
  let categories = getCategories();
  categories = categories.filter(cat => cat.id !== id);
  saveCategories(categories);

  let images = getImages();
  const toDelete = images.filter(img => img.categoryId === id);
  for (const img of toDelete) {
    const fp = join(UPLOAD_DIR, img.filename);
    if (existsSync(fp)) unlinkSync(fp);
  }
  images = images.filter(img => img.categoryId !== id);
  saveImages(images);

  return c.json({ success: true });
});

// --- Images ---
admin.get("/images", (c) => {
  return c.json(getImages().sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ));
});

admin.post("/images", async (c) => {
  const formData = await c.req.formData();
  const file = formData.get("image") as File | null;
  const title = (formData.get("title") as string) || "";
  const description = (formData.get("description") as string) || "";
  const categoryId = (formData.get("categoryId") as string) || "";

  if (!file || file.size === 0) {
    return c.json({ error: "Bild ist erforderlich." }, 400);
  }

  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
  if (!allowed.includes(file.type)) {
    return c.json({ error: "Nur JPEG, PNG, WebP, GIF und AVIF sind erlaubt." }, 400);
  }

  if (file.size > 20 * 1024 * 1024) {
    return c.json({ error: "Maximale Dateigröße: 20 MB." }, 400);
  }

  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${crypto.randomUUID()}.${ext}`;
  const filepath = join(UPLOAD_DIR, filename);

  const buffer = await file.arrayBuffer();
  await Bun.write(filepath, buffer);

  const img: GalleryImage = {
    id: crypto.randomUUID(),
    categoryId,
    title: title.trim(),
    description: description.trim(),
    filename,
    originalName: file.name,
    createdAt: new Date().toISOString()
  };

  const images = getImages();
  images.unshift(img);
  saveImages(images);
  syncToGitHub(`Bild hochgeladen: ${img.title || img.originalName}`);

  return c.json(img, 201);
});

admin.put("/images/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: "Ungültige Daten." }, 400);

  const images = getImages();
  const idx = images.findIndex(img => img.id === id);
  if (idx === -1) return c.json({ error: "Bild nicht gefunden." }, 404);

  if (body.title !== undefined) images[idx].title = body.title.trim();
  if (body.description !== undefined) images[idx].description = body.description.trim();
  if (body.categoryId !== undefined) images[idx].categoryId = body.categoryId;
  saveImages(images);
  return c.json(images[idx]);
});

admin.delete("/images/:id", (c) => {
  const id = c.req.param("id");
  const images = getImages();
  const img = images.find(i => i.id === id);
  if (img) {
    const fp = join(UPLOAD_DIR, img.filename);
    if (existsSync(fp)) unlinkSync(fp);
  }
  saveImages(images.filter(i => i.id !== id));
  syncToGitHub(`Bild gelöscht: ${img?.title || id}`);
  return c.json({ success: true });
});

// --- Upload Logo / Profile Image ---
admin.post("/upload/:type", async (c) => {
  const type = c.req.param("type");
  if (!["logo", "aboutImage"].includes(type)) {
    return c.json({ error: "Ungültiger Upload-Typ." }, 400);
  }

  const formData = await c.req.formData();
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return c.json({ error: "Datei ist erforderlich." }, 400);
  }

  if (file.size > 10 * 1024 * 1024) {
    return c.json({ error: "Maximale Dateigröße: 10 MB." }, 400);
  }

  const ext = file.name.split(".").pop() || "png";
  const filename = `${type}-${crypto.randomUUID()}.${ext}`;
  const filepath = join(UPLOAD_DIR, filename);

  const buffer = await file.arrayBuffer();
  await Bun.write(filepath, buffer);

  const settings = getSettings();
  const oldFile = settings[type as keyof SiteSettings] as string;
  if (oldFile) {
    const oldPath = join(UPLOAD_DIR, oldFile.replace("/uploads/", ""));
    if (existsSync(oldPath)) unlinkSync(oldPath);
  }
  (settings as any)[type] = `/uploads/${filename}`;
  saveSettings(settings);
  syncToGitHub(`${type === "logo" ? "Logo" : "Profilbild"} aktualisiert`);

  return c.json({ success: true, path: `/uploads/${filename}` });
});

// --- Messages ---
admin.get("/messages", (c) => {
  return c.json(getMessages());
});

admin.put("/messages/:id/read", (c) => {
  const id = c.req.param("id");
  const messages = getMessages();
  const idx = messages.findIndex(m => m.id === id);
  if (idx === -1) return c.json({ error: "Nachricht nicht gefunden." }, 404);
  messages[idx].read = true;
  saveMessages(messages);
  return c.json({ success: true });
});

admin.delete("/messages/:id", (c) => {
  const id = c.req.param("id");
  saveMessages(getMessages().filter(m => m.id !== id));
  return c.json({ success: true });
});

// --- Account ---
admin.put("/account", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: "Ungültige Daten." }, 400);

  const creds = getCredentials();

  if (body.currentPassword) {
    const valid = await Bun.password.verify(body.currentPassword, creds.passwordHash);
    if (!valid) return c.json({ error: "Aktuelles Passwort ist falsch." }, 401);
  } else {
    return c.json({ error: "Aktuelles Passwort ist erforderlich." }, 400);
  }

  if (body.newEmail) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.newEmail)) {
      return c.json({ error: "Ungültige E-Mail-Adresse." }, 400);
    }
    creds.email = body.newEmail.toLowerCase();
  }

  if (body.newPassword) {
    if (body.newPassword.length < 8) {
      return c.json({ error: "Passwort muss mindestens 8 Zeichen lang sein." }, 400);
    }
    creds.passwordHash = await Bun.password.hash(body.newPassword, { algorithm: "bcrypt", cost: 12 });
  }

  saveCredentials(creds);
  const token = await createToken(creds.email);
  setAuthCookie(c, token);
  return c.json({ success: true });
});

admin.get("/stats", (c) => {
  const images = getImages();
  const categories = getCategories();
  const messages = getMessages();
  const unread = messages.filter(m => !m.read).length;

  return c.json({
    totalImages: images.length,
    totalCategories: categories.length,
    totalMessages: messages.length,
    unreadMessages: unread
  });
});

api.route("/admin", admin);
