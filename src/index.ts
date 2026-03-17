import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { api } from "./api";
import { authMiddleware, isAuthenticated } from "./auth";
import { initCredentials } from "./storage";
import { initGitRepo } from "./github-sync";
import { homePage, galleryPage, contactPage, impressumPage, datenschutzPage, loginPage } from "./pages";
import { dashboardPage, inhaltePage, galeriePage, nachrichtenPage, einstellungenPage } from "./admin-pages";

await initGitRepo();
await initCredentials();

const app = new Hono();

app.use("*", async (c, next) => {
  const path = c.req.path.toLowerCase();

  const blocked = [
    "/.git", "/.env", "/data/", "/.gitignore",
    "/tsconfig", "/src/", "/node_modules/",
    "/package.json", "/bun.lock", "/.git/",
    "/credentials", "/askpass"
  ];

  for (const b of blocked) {
    if (path.startsWith(b) || path.includes("/.git/") || path.includes("/..")) {
      return c.text("403 Forbidden", 403);
    }
  }

  await next();

  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "SAMEORIGIN");
  c.header("X-XSS-Protection", "1; mode=block");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  c.header("Content-Security-Policy",
    "default-src 'self'; " +
    "script-src 'self'; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: blob: https://www.it-recht-kanzlei.de; " +
    "connect-src 'self'; " +
    "frame-ancestors 'self'"
  );
});

app.use("/uploads/*", serveStatic({ root: "./" }));
app.use("/css/*", serveStatic({ root: "./public" }));
app.use("/js/*", serveStatic({ root: "./public" }));
app.use("/img/*", serveStatic({ root: "./public" }));
app.use("/favicon.ico", serveStatic({ root: "./public" }));

app.route("/api", api);

app.get("/", (c) => c.html(homePage()));
app.get("/galerie", (c) => c.html(galleryPage()));
app.get("/kontakt", (c) => c.html(contactPage()));
app.get("/impressum", (c) => c.html(impressumPage()));
app.get("/datenschutz", (c) => c.html(datenschutzPage()));

app.get("/login", async (c) => {
  if (await isAuthenticated(c)) return c.redirect("/admin");
  return c.html(loginPage());
});

app.get("/admin", authMiddleware, (c) => c.html(dashboardPage()));
app.get("/admin/inhalte", authMiddleware, (c) => c.html(inhaltePage()));
app.get("/admin/galerie", authMiddleware, (c) => c.html(galeriePage()));
app.get("/admin/nachrichten", authMiddleware, (c) => c.html(nachrichtenPage()));
app.get("/admin/einstellungen", authMiddleware, (c) => c.html(einstellungenPage()));

const port = parseInt(process.env.PORT || "3000");

export default {
  port,
  fetch: app.fetch,
};

console.log(`\n🎨 Natis Fine Creation läuft auf http://localhost:${port}\n`);
