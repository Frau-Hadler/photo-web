import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { syncToGitHub } from "./github-sync";

const DATA_DIR = join(import.meta.dir, "..", "data");

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

function filePath(name: string): string {
  return join(DATA_DIR, `${name}.json`);
}

export function load<T>(name: string, fallback: T): T {
  const p = filePath(name);
  if (!existsSync(p)) {
    save(name, fallback, true);
    return fallback;
  }
  try {
    return JSON.parse(readFileSync(p, "utf-8")) as T;
  } catch {
    save(name, fallback, true);
    return fallback;
  }
}

export function save<T>(name: string, data: T, skipSync = false): void {
  writeFileSync(filePath(name), JSON.stringify(data, null, 2), "utf-8");
  if (!skipSync) {
    syncToGitHub(`Aktualisiert: ${name}`);
  }
}

export interface SiteSettings {
  siteName: string;
  siteTagline: string;
  logo: string;
  heroTitle: string;
  heroSubtitle: string;
  heroButtonText: string;
  heroButtonLink: string;
  aboutTitle: string;
  aboutText: string;
  aboutImage: string;
  galleryTitle: string;
  gallerySubtitle: string;
  contactTitle: string;
  contactSubtitle: string;
  contactEmail: string;
  commissionTitle: string;
  commissionText: string;
  footerText: string;
  socialLinks: { platform: string; url: string; icon: string }[];
  customLinks: { title: string; url: string }[];
  impressum: {
    name: string;
    address: string;
    zip: string;
    city: string;
    country: string;
    email: string;
    phone: string;
    taxId: string;
    extra: string;
  };
  datenschutzExtra: string;
  metaDescription: string;
  primaryColor: string;
  accentColor: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  order: number;
  createdAt: string;
}

export interface GalleryImage {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  filename: string;
  originalName: string;
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  read: boolean;
  privacyAccepted: boolean;
}

export interface Credentials {
  email: string;
  passwordHash: string;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "Natis Fine Creation",
  siteTagline: "Kunst & Kreativität",
  logo: "",
  heroTitle: "Willkommen bei Natis Fine Creation",
  heroSubtitle: "Einzigartige Kunstwerke und kreative Designs — handgefertigt mit Leidenschaft",
  heroButtonText: "Galerie entdecken",
  heroButtonLink: "/galerie",
  aboutTitle: "Über mich",
  aboutText: "Ich bin eine leidenschaftliche Künstlerin und erschaffe einzigartige Werke, die Geschichten erzählen. Jedes Stück wird mit Hingabe und Liebe zum Detail gefertigt. Entdecke meine Welt der Kunst und lass dich inspirieren.",
  aboutImage: "",
  galleryTitle: "Galerie",
  gallerySubtitle: "Entdecke meine neuesten Kreationen",
  contactTitle: "Kontakt",
  contactSubtitle: "Hast du eine Idee für ein Projekt? Schreib mir gerne!",
  contactEmail: process.env.CONTACT_EMAIL || "kontakt@natisfinecreation.de",
  commissionTitle: "Auftragsarbeiten",
  commissionText: "Du möchtest ein individuelles Kunstwerk? Ich freue mich auf deine Anfrage! Beschreibe mir deine Vorstellung und ich erstelle dir ein unverbindliches Angebot.",
  footerText: "© 2026 Natis Fine Creation. Alle Rechte vorbehalten.",
  socialLinks: [
    { platform: "Instagram", url: "https://www.instagram.com/natisfinecreation/", icon: "instagram" }
  ],
  customLinks: [],
  impressum: {
    name: "Vorname Nachname",
    address: "Musterstraße 1",
    zip: "12345",
    city: "Musterstadt",
    country: "Deutschland",
    email: "kontakt@natisfinecreation.de",
    phone: "",
    taxId: "",
    extra: ""
  },
  datenschutzExtra: "",
  metaDescription: "Natis Fine Creation — Einzigartige Kunstwerke und kreative Designs. Portfolio und Auftragsarbeiten.",
  primaryColor: "#c8a97e",
  accentColor: "#a07850"
};

export function getSettings(): SiteSettings {
  return load<SiteSettings>("settings", DEFAULT_SETTINGS);
}

export function saveSettings(s: SiteSettings): void {
  save("settings", s);
}

export function getCategories(): Category[] {
  return load<Category[]>("categories", []);
}

export function saveCategories(c: Category[]): void {
  save("categories", c);
}

export function getImages(): GalleryImage[] {
  return load<GalleryImage[]>("gallery", []);
}

export function saveImages(imgs: GalleryImage[]): void {
  save("gallery", imgs);
}

export function getMessages(): ContactMessage[] {
  return load<ContactMessage[]>("messages", []);
}

export function saveMessages(msgs: ContactMessage[]): void {
  save("messages", msgs, true);
}

export function getCredentials(): Credentials {
  return load<Credentials>("credentials", { email: "", passwordHash: "" });
}

export function saveCredentials(c: Credentials): void {
  save("credentials", c, true);
}

export async function initCredentials(): Promise<void> {
  const creds = getCredentials();
  if (!creds.email || !creds.passwordHash) {
    const email = process.env.OWNER_EMAIL || "admin@natisfinecreation.de";
    const password = process.env.OWNER_PASSWORD || "Admin123!";
    const hash = await Bun.password.hash(password, { algorithm: "bcrypt", cost: 12 });
    saveCredentials({ email, passwordHash: hash });
    console.log(`✓ Initiale Zugangsdaten erstellt: ${email}`);
  }
}
