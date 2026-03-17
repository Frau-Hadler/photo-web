import { getSettings, getCredentials } from "./storage";

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function adminLayout(title: string, activeTab: string, content: string): string {
  const s = getSettings();
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: dashboardIcon(), href: "/admin" },
    { id: "inhalte", label: "Inhalte", icon: contentIcon(), href: "/admin/inhalte" },
    { id: "galerie", label: "Galerie", icon: galleryIcon(), href: "/admin/galerie" },
    { id: "nachrichten", label: "Nachrichten", icon: messageIcon(), href: "/admin/nachrichten" },
    { id: "einstellungen", label: "Einstellungen", icon: settingsIcon(), href: "/admin/einstellungen" }
  ];

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escHtml(title)} — Admin</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/style.css">
<link rel="stylesheet" href="/css/admin.css">
</head>
<body class="admin-body">
<aside class="admin-sidebar" id="adminSidebar">
  <div class="sidebar-header">
    ${s.logo ? `<img src="${escHtml(s.logo)}" alt="" class="sidebar-logo">` : ""}
    <span class="sidebar-brand">${escHtml(s.siteName)}</span>
    <button class="sidebar-close" id="sidebarClose">✕</button>
  </div>
  <nav class="sidebar-nav">
    ${tabs.map(t => `<a href="${t.href}" class="sidebar-link ${activeTab === t.id ? "active" : ""}">${t.icon}<span>${t.label}</span></a>`).join("")}
  </nav>
  <div class="sidebar-footer">
    <a href="/" class="sidebar-link" target="_blank">${websiteIcon()}<span>Website ansehen</span></a>
    <button class="sidebar-link" id="logoutBtn">${logoutIcon()}<span>Abmelden</span></button>
  </div>
</aside>

<main class="admin-main">
  <header class="admin-header">
    <button class="sidebar-toggle" id="sidebarToggle">☰</button>
    <h1 class="admin-page-title">${escHtml(title)}</h1>
    <div class="admin-user">${escHtml(getCredentials().email)}</div>
  </header>
  <div class="admin-content">
    ${content}
  </div>
</main>

<script src="/js/admin.js"></script>
</body></html>`;
}

export function dashboardPage(): string {
  return adminLayout("Dashboard", "dashboard", `
<div class="stats-grid" id="statsGrid">
  <div class="stat-card"><div class="stat-icon">${galleryIcon()}</div><div class="stat-info"><span class="stat-number" id="statImages">—</span><span class="stat-label">Bilder</span></div></div>
  <div class="stat-card"><div class="stat-icon">${categoryIcon()}</div><div class="stat-info"><span class="stat-number" id="statCategories">—</span><span class="stat-label">Kategorien</span></div></div>
  <div class="stat-card"><div class="stat-icon">${messageIcon()}</div><div class="stat-info"><span class="stat-number" id="statMessages">—</span><span class="stat-label">Nachrichten</span></div></div>
  <div class="stat-card highlight"><div class="stat-icon">${unreadIcon()}</div><div class="stat-info"><span class="stat-number" id="statUnread">—</span><span class="stat-label">Ungelesen</span></div></div>
</div>

<div class="dashboard-grid">
  <div class="dash-card">
    <h3>Schnellaktionen</h3>
    <div class="quick-actions">
      <a href="/admin/galerie" class="quick-btn">${galleryIcon()} Bild hochladen</a>
      <a href="/admin/inhalte" class="quick-btn">${contentIcon()} Inhalte bearbeiten</a>
      <a href="/admin/nachrichten" class="quick-btn">${messageIcon()} Nachrichten lesen</a>
      <a href="/admin/einstellungen" class="quick-btn">${settingsIcon()} Einstellungen</a>
    </div>
  </div>
  <div class="dash-card">
    <h3>Letzte Nachrichten</h3>
    <div id="recentMessages"><p class="text-muted">Wird geladen...</p></div>
  </div>
</div>`);
}

export function inhaltePage(): string {
  const s = getSettings();
  return adminLayout("Inhalte bearbeiten", "inhalte", `
<div class="admin-tabs">
  <button class="admin-tab active" data-tab="hero">Hero-Bereich</button>
  <button class="admin-tab" data-tab="about">Über mich</button>
  <button class="admin-tab" data-tab="gallery-text">Galerie-Texte</button>
  <button class="admin-tab" data-tab="contact-text">Kontakt-Texte</button>
  <button class="admin-tab" data-tab="commission">Aufträge</button>
  <button class="admin-tab" data-tab="links">Links</button>
  <button class="admin-tab" data-tab="branding">Branding</button>
</div>

<form id="contentForm" class="admin-form">
  <div class="tab-content active" id="tab-hero">
    <div class="form-card">
      <h3>Hero-Bereich</h3>
      <div class="form-group"><label>Titel</label><input type="text" name="heroTitle" value="${escHtml(s.heroTitle)}"></div>
      <div class="form-group"><label>Untertitel</label><textarea name="heroSubtitle" rows="3">${escHtml(s.heroSubtitle)}</textarea></div>
      <div class="form-group"><label>Button-Text</label><input type="text" name="heroButtonText" value="${escHtml(s.heroButtonText)}"></div>
      <div class="form-group"><label>Button-Link</label><input type="text" name="heroButtonLink" value="${escHtml(s.heroButtonLink)}"></div>
    </div>
  </div>

  <div class="tab-content" id="tab-about">
    <div class="form-card">
      <h3>Über mich</h3>
      <div class="form-group"><label>Titel</label><input type="text" name="aboutTitle" value="${escHtml(s.aboutTitle)}"></div>
      <div class="form-group"><label>Text</label><textarea name="aboutText" rows="6">${escHtml(s.aboutText)}</textarea></div>
      <div class="form-group">
        <label>Profilbild</label>
        <div class="upload-area" id="aboutImageUpload" data-type="aboutImage">
          ${s.aboutImage ? `<img src="${escHtml(s.aboutImage)}" class="upload-preview">` : `<span>Bild hierher ziehen oder klicken</span>`}
          <input type="file" accept="image/*" class="upload-input" style="display:none">
        </div>
      </div>
    </div>
  </div>

  <div class="tab-content" id="tab-gallery-text">
    <div class="form-card">
      <h3>Galerie-Texte</h3>
      <div class="form-group"><label>Titel</label><input type="text" name="galleryTitle" value="${escHtml(s.galleryTitle)}"></div>
      <div class="form-group"><label>Untertitel</label><textarea name="gallerySubtitle" rows="2">${escHtml(s.gallerySubtitle)}</textarea></div>
    </div>
  </div>

  <div class="tab-content" id="tab-contact-text">
    <div class="form-card">
      <h3>Kontakt-Texte</h3>
      <div class="form-group"><label>Titel</label><input type="text" name="contactTitle" value="${escHtml(s.contactTitle)}"></div>
      <div class="form-group"><label>Untertitel</label><textarea name="contactSubtitle" rows="2">${escHtml(s.contactSubtitle)}</textarea></div>
    </div>
  </div>

  <div class="tab-content" id="tab-commission">
    <div class="form-card">
      <h3>Auftragsarbeiten</h3>
      <div class="form-group"><label>Titel</label><input type="text" name="commissionTitle" value="${escHtml(s.commissionTitle)}"></div>
      <div class="form-group"><label>Text</label><textarea name="commissionText" rows="4">${escHtml(s.commissionText)}</textarea></div>
    </div>
  </div>

  <div class="tab-content" id="tab-links">
    <div class="form-card">
      <h3>Social Media Links</h3>
      <div id="socialLinksEditor">
        ${s.socialLinks.map((l, i) => `
        <div class="link-row" data-index="${i}">
          <select name="socialIcon_${i}">
            <option value="instagram" ${l.icon === "instagram" ? "selected" : ""}>Instagram</option>
            <option value="facebook" ${l.icon === "facebook" ? "selected" : ""}>Facebook</option>
            <option value="tiktok" ${l.icon === "tiktok" ? "selected" : ""}>TikTok</option>
            <option value="youtube" ${l.icon === "youtube" ? "selected" : ""}>YouTube</option>
            <option value="website" ${l.icon === "website" ? "selected" : ""}>Website</option>
          </select>
          <input type="text" placeholder="Plattform" value="${escHtml(l.platform)}" name="socialPlatform_${i}">
          <input type="url" placeholder="URL" value="${escHtml(l.url)}" name="socialUrl_${i}">
          <button type="button" class="btn btn-sm btn-danger remove-social" data-index="${i}">✕</button>
        </div>`).join("")}
      </div>
      <button type="button" class="btn btn-sm btn-outline" id="addSocialLink">+ Social Link hinzufügen</button>

      <h3 style="margin-top:2rem">Eigene Links (Navigation)</h3>
      <div id="customLinksEditor">
        ${s.customLinks.map((l, i) => `
        <div class="link-row" data-index="${i}">
          <input type="text" placeholder="Titel" value="${escHtml(l.title)}" name="customTitle_${i}">
          <input type="url" placeholder="URL" value="${escHtml(l.url)}" name="customUrl_${i}">
          <button type="button" class="btn btn-sm btn-danger remove-custom" data-index="${i}">✕</button>
        </div>`).join("")}
      </div>
      <button type="button" class="btn btn-sm btn-outline" id="addCustomLink">+ Link hinzufügen</button>
    </div>
  </div>

  <div class="tab-content" id="tab-branding">
    <div class="form-card">
      <h3>Branding</h3>
      <div class="form-group"><label>Website-Name</label><input type="text" name="siteName" value="${escHtml(s.siteName)}"></div>
      <div class="form-group"><label>Tagline</label><input type="text" name="siteTagline" value="${escHtml(s.siteTagline)}"></div>
      <div class="form-group">
        <label>Logo</label>
        <div class="upload-area" id="logoUpload" data-type="logo">
          ${s.logo ? `<img src="${escHtml(s.logo)}" class="upload-preview">` : `<span>Logo hierher ziehen oder klicken</span>`}
          <input type="file" accept="image/*" class="upload-input" style="display:none">
        </div>
      </div>
      <div class="form-group"><label>Primärfarbe</label><div class="color-input"><input type="color" name="primaryColor" value="${s.primaryColor}"><span>${s.primaryColor}</span></div></div>
      <div class="form-group"><label>Akzentfarbe</label><div class="color-input"><input type="color" name="accentColor" value="${s.accentColor}"><span>${s.accentColor}</span></div></div>
      <div class="form-group"><label>Footer-Text</label><input type="text" name="footerText" value="${escHtml(s.footerText)}"></div>
      <div class="form-group"><label>Meta-Beschreibung (SEO)</label><textarea name="metaDescription" rows="2">${escHtml(s.metaDescription)}</textarea></div>
    </div>
  </div>

  <div class="form-actions">
    <button type="submit" class="btn btn-primary">Änderungen speichern</button>
    <span id="contentSaveStatus" class="save-status"></span>
  </div>
</form>`);
}

export function galeriePage(): string {
  return adminLayout("Galerie verwalten", "galerie", `
<div class="admin-tabs">
  <button class="admin-tab active" data-tab="upload">Bilder hochladen</button>
  <button class="admin-tab" data-tab="manage">Bilder verwalten</button>
  <button class="admin-tab" data-tab="categories">Kategorien</button>
</div>

<div class="tab-content active" id="tab-upload">
  <div class="form-card">
    <h3>Neues Bild hochladen</h3>
    <form id="imageUploadForm" enctype="multipart/form-data">
      <div class="upload-drop-zone" id="imageDropZone">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        <p>Bild hierher ziehen oder klicken</p>
        <span class="text-muted">JPEG, PNG, WebP, GIF — max. 20 MB</span>
        <input type="file" id="imageFile" name="image" accept="image/*" style="display:none">
      </div>
      <div id="imagePreviewWrap" class="image-preview-wrap" style="display:none">
        <img id="imagePreview" alt="Vorschau">
      </div>
      <div class="form-group"><label>Titel</label><input type="text" name="title" id="imageTitle" placeholder="Bildtitel"></div>
      <div class="form-group"><label>Beschreibung</label><textarea name="description" id="imageDesc" rows="3" placeholder="Optionale Beschreibung"></textarea></div>
      <div class="form-group"><label>Kategorie</label><select name="categoryId" id="imageCategorySelect"><option value="">Keine Kategorie</option></select></div>
      <button type="submit" class="btn btn-primary">Hochladen</button>
      <div id="uploadStatus" class="form-status"></div>
    </form>
  </div>
</div>

<div class="tab-content" id="tab-manage">
  <div class="form-card">
    <h3>Alle Bilder</h3>
    <div class="admin-filter">
      <select id="filterCategory"><option value="">Alle Kategorien</option></select>
    </div>
    <div class="admin-gallery" id="adminGallery"><p class="text-muted">Wird geladen...</p></div>
  </div>
</div>

<div class="tab-content" id="tab-categories">
  <div class="form-card">
    <h3>Kategorien verwalten</h3>
    <form id="addCategoryForm" class="inline-form">
      <input type="text" name="name" placeholder="Kategorie-Name" required>
      <input type="text" name="description" placeholder="Beschreibung (optional)">
      <button type="submit" class="btn btn-primary">Hinzufügen</button>
    </form>
    <div id="categoriesList" class="categories-list"><p class="text-muted">Wird geladen...</p></div>
  </div>
</div>`);
}

export function nachrichtenPage(): string {
  return adminLayout("Nachrichten", "nachrichten", `
<div class="form-card">
  <div class="messages-header">
    <h3>Kontaktanfragen</h3>
    <span id="messageCount" class="badge"></span>
  </div>
  <div id="messagesList" class="messages-list"><p class="text-muted">Wird geladen...</p></div>
</div>`);
}

export function einstellungenPage(): string {
  const s = getSettings();
  const imp = s.impressum;
  return adminLayout("Einstellungen", "einstellungen", `
<div class="admin-tabs">
  <button class="admin-tab active" data-tab="account">Konto</button>
  <button class="admin-tab" data-tab="contact-settings">Kontaktformular</button>
  <button class="admin-tab" data-tab="impressum">Impressum</button>
  <button class="admin-tab" data-tab="datenschutz">Datenschutz</button>
</div>

<div class="tab-content active" id="tab-account">
  <div class="form-card">
    <h3>Konto-Einstellungen</h3>
    <form id="accountForm" class="admin-form">
      <div class="form-group"><label>Aktuelle E-Mail</label><input type="email" id="currentEmail" value="${escHtml(getCredentials().email)}" disabled></div>
      <div class="form-group"><label>Neue E-Mail</label><input type="email" name="newEmail" placeholder="Neue E-Mail (leer lassen wenn nicht ändern)"></div>
      <div class="form-group"><label>Neues Passwort</label><input type="password" name="newPassword" placeholder="Neues Passwort (min. 8 Zeichen, leer lassen wenn nicht ändern)"></div>
      <div class="form-group"><label>Aktuelles Passwort *</label><input type="password" name="currentPassword" required placeholder="Zur Bestätigung erforderlich"></div>
      <button type="submit" class="btn btn-primary">Speichern</button>
      <div id="accountStatus" class="form-status"></div>
    </form>
  </div>
</div>

<div class="tab-content" id="tab-contact-settings">
  <div class="form-card">
    <h3>Kontaktformular-Einstellungen</h3>
    <form id="contactSettingsForm" class="admin-form">
      <div class="form-group"><label>E-Mail für Kontaktanfragen</label><input type="email" name="contactEmail" value="${escHtml(s.contactEmail)}"><small>An diese Adresse werden Kontaktanfragen gerichtet (wird auf der Kontaktseite angezeigt).</small></div>
      <button type="submit" class="btn btn-primary">Speichern</button>
      <div id="contactSettingsStatus" class="form-status"></div>
    </form>
  </div>
</div>

<div class="tab-content" id="tab-impressum">
  <div class="form-card">
    <h3>Impressum-Daten</h3>
    <form id="impressumForm" class="admin-form">
      <div class="form-group"><label>Name / Firma</label><input type="text" name="imp_name" value="${escHtml(imp.name)}"></div>
      <div class="form-group"><label>Straße & Hausnummer</label><input type="text" name="imp_address" value="${escHtml(imp.address)}"></div>
      <div class="form-row">
        <div class="form-group"><label>PLZ</label><input type="text" name="imp_zip" value="${escHtml(imp.zip)}"></div>
        <div class="form-group"><label>Stadt</label><input type="text" name="imp_city" value="${escHtml(imp.city)}"></div>
      </div>
      <div class="form-group"><label>Land</label><input type="text" name="imp_country" value="${escHtml(imp.country)}"></div>
      <div class="form-group"><label>E-Mail</label><input type="email" name="imp_email" value="${escHtml(imp.email)}"></div>
      <div class="form-group"><label>Telefon</label><input type="text" name="imp_phone" value="${escHtml(imp.phone)}"></div>
      <div class="form-group"><label>USt-IdNr.</label><input type="text" name="imp_taxId" value="${escHtml(imp.taxId)}"></div>
      <div class="form-group"><label>Zusätzliche Angaben</label><textarea name="imp_extra" rows="3">${escHtml(imp.extra)}</textarea></div>
      <button type="submit" class="btn btn-primary">Speichern</button>
      <div id="impressumStatus" class="form-status"></div>
    </form>
  </div>
</div>

<div class="tab-content" id="tab-datenschutz">
  <div class="form-card">
    <h3>Datenschutz-Ergänzungen</h3>
    <form id="datenschutzForm" class="admin-form">
      <div class="form-group"><label>Zusätzlicher Datenschutz-Text</label><textarea name="datenschutzExtra" rows="6">${escHtml(s.datenschutzExtra)}</textarea><small>Dieser Text wird am Ende der Datenschutzerklärung angezeigt. Die Standard-Datenschutzerklärung wird automatisch basierend auf Ihren Impressum-Daten generiert.</small></div>
      <button type="submit" class="btn btn-primary">Speichern</button>
      <div id="datenschutzStatus" class="form-status"></div>
    </form>
  </div>
</div>`);
}

function dashboardIcon() { return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>'; }
function contentIcon() { return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>'; }
function galleryIcon() { return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>'; }
function messageIcon() { return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>'; }
function settingsIcon() { return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>'; }
function categoryIcon() { return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>'; }
function unreadIcon() { return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>'; }
function logoutIcon() { return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>'; }
function websiteIcon() { return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>'; }
