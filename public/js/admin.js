// ========================================
// Natis Fine Creation — Admin Panel JS
// Complete rewrite — all features working
// ========================================

document.addEventListener("DOMContentLoaded", () => {
  initLoginForm();
  initLogout();
  initSidebar();
  initTabs();
  initDashboard();
  initContentForm();
  initGalleryAdmin();
  initCategoriesAdmin();
  initMessagesAdmin();
  initSettingsForms();
  initUploadAreas();
});

async function api(url, options = {}) {
  const fetchOptions = { method: options.method || "GET" };

  if (options.body) {
    fetchOptions.body = options.body;
    if (typeof options.body === "string") {
      fetchOptions.headers = { "Content-Type": "application/json" };
    }
  }

  try {
    const res = await fetch(`/api${url}`, fetchOptions);

    if (res.status === 401) {
      alert("Sitzung abgelaufen. Du wirst zum Login weitergeleitet.");
      window.location.href = "/login";
      return { ok: false, status: 401, data: { error: "Nicht autorisiert." } };
    }

    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    return { ok: false, status: 0, data: { error: "Verbindungsfehler." } };
  }
}

function showStatus(el, msg, type) {
  if (!el) return;
  el.textContent = msg;
  if (type === "success") {
    el.className = "form-status success";
  } else if (type === "error") {
    el.className = "form-status error";
  } else {
    el.className = "save-status " + type;
  }
  el.style.display = "block";
  if (type === "success") setTimeout(() => { el.style.display = "none"; }, 4000);
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

function esc(s) {
  if (!s) return "";
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

// === Login ===
function initLoginForm() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = form.querySelector('[name="email"]').value;
    const password = form.querySelector('[name="password"]').value;
    const errorEl = document.getElementById("loginError");
    const btn = form.querySelector('button[type="submit"]');

    btn.disabled = true;
    btn.textContent = "Wird angemeldet...";

    const { ok, data } = await api("/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });

    if (ok) {
      window.location.href = "/admin";
    } else {
      showStatus(errorEl, data.error || "Anmeldung fehlgeschlagen.", "error");
      btn.disabled = false;
      btn.textContent = "Anmelden";
    }
  });
}

// === Logout ===
function initLogout() {
  const btn = document.getElementById("logoutBtn");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    await api("/logout", { method: "POST" });
    window.location.href = "/login";
  });
}

// === Sidebar ===
function initSidebar() {
  const sidebar = document.getElementById("adminSidebar");
  const toggle = document.getElementById("sidebarToggle");
  const close = document.getElementById("sidebarClose");
  if (!sidebar) return;

  if (toggle) toggle.addEventListener("click", () => sidebar.classList.toggle("open"));
  if (close) close.addEventListener("click", () => sidebar.classList.remove("open"));
}

// === Tabs ===
function initTabs() {
  document.querySelectorAll(".admin-tabs").forEach(tabGroup => {
    const tabs = tabGroup.querySelectorAll(".admin-tab");
    const container = tabGroup.closest(".admin-content") || tabGroup.parentElement;

    tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        tabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");

        container.querySelectorAll(":scope > .tab-content, form > .tab-content, .tab-content").forEach(tc => {
          tc.classList.remove("active");
        });

        const targetId = "tab-" + tab.dataset.tab;
        const target = document.getElementById(targetId);
        if (target) target.classList.add("active");
      });
    });
  });
}

// === Dashboard ===
async function initDashboard() {
  if (!document.getElementById("statsGrid")) return;

  const { ok, data } = await api("/admin/stats");
  if (!ok) return;

  const el = (id) => document.getElementById(id);
  el("statImages").textContent = data.totalImages;
  el("statCategories").textContent = data.totalCategories;
  el("statMessages").textContent = data.totalMessages;
  el("statUnread").textContent = data.unreadMessages;

  const msgContainer = document.getElementById("recentMessages");
  if (msgContainer) {
    const { data: msgs } = await api("/admin/messages");
    if (msgs && msgs.length > 0) {
      msgContainer.innerHTML = msgs.slice(0, 5).map(m => `
        <div class="message-item ${m.read ? "" : "unread"}" style="padding:.75rem;margin-bottom:.5rem">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <strong style="font-size:.85rem">${esc(m.name)}</strong>
            <span style="font-size:.7rem;color:var(--text-muted)">${formatDate(m.createdAt)}</span>
          </div>
          <p style="font-size:.8rem;color:var(--primary);margin-top:.15rem">${esc(m.email)}</p>
          <p style="font-size:.8rem;color:var(--text-muted);margin-top:.15rem">${esc(m.subject)}</p>
        </div>
      `).join("");
    } else {
      msgContainer.innerHTML = '<p class="text-muted" style="font-size:.85rem">Keine Nachrichten vorhanden.</p>';
    }
  }
}

// === Content Form (Inhalte) ===
function initContentForm() {
  const form = document.getElementById("contentForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = "Wird gespeichert...";

    const fd = new FormData(form);
    const settings = {};

    for (const [key, value] of fd.entries()) {
      if (!key.startsWith("social") && !key.startsWith("custom")) {
        settings[key] = value;
      }
    }

    settings.socialLinks = collectSocialLinks();
    settings.customLinks = collectCustomLinks();

    const { ok, data } = await api("/admin/settings", {
      method: "PUT",
      body: JSON.stringify(settings)
    });

    const status = document.getElementById("contentSaveStatus");
    showStatus(status, ok ? "Gespeichert! Änderungen sind sofort auf der Website sichtbar." : (data.error || "Fehler beim Speichern."), ok ? "success" : "error");
    btn.disabled = false;
    btn.textContent = "Änderungen speichern";
  });

  initLinkEditors();
}

function collectSocialLinks() {
  const links = [];
  document.querySelectorAll("#socialLinksEditor .link-row").forEach((row, i) => {
    const selects = row.querySelectorAll("select");
    const inputs = row.querySelectorAll("input");
    const icon = selects[0]?.value || "website";
    const platform = inputs[0]?.value;
    const url = inputs[1]?.value;
    if (platform && url) links.push({ icon, platform, url });
  });
  return links;
}

function collectCustomLinks() {
  const links = [];
  document.querySelectorAll("#customLinksEditor .link-row").forEach((row) => {
    const inputs = row.querySelectorAll("input");
    const title = inputs[0]?.value;
    const url = inputs[1]?.value;
    if (title && url) links.push({ title, url });
  });
  return links;
}

function initLinkEditors() {
  const addSocial = document.getElementById("addSocialLink");
  const addCustom = document.getElementById("addCustomLink");

  if (addSocial) {
    addSocial.addEventListener("click", () => {
      const editor = document.getElementById("socialLinksEditor");
      const idx = Date.now();
      editor.insertAdjacentHTML("beforeend", `
        <div class="link-row" data-index="${idx}">
          <select name="socialIcon_${idx}">
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
            <option value="tiktok">TikTok</option>
            <option value="youtube">YouTube</option>
            <option value="website">Website</option>
          </select>
          <input type="text" placeholder="Plattform" name="socialPlatform_${idx}">
          <input type="url" placeholder="URL" name="socialUrl_${idx}">
          <button type="button" class="btn btn-sm btn-danger remove-link">✕</button>
        </div>
      `);
    });
  }

  if (addCustom) {
    addCustom.addEventListener("click", () => {
      const editor = document.getElementById("customLinksEditor");
      const idx = Date.now();
      editor.insertAdjacentHTML("beforeend", `
        <div class="link-row" data-index="${idx}">
          <input type="text" placeholder="Titel" name="customTitle_${idx}">
          <input type="url" placeholder="URL" name="customUrl_${idx}">
          <button type="button" class="btn btn-sm btn-danger remove-link">✕</button>
        </div>
      `);
    });
  }

  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-link") || e.target.closest(".remove-link")) {
      const btn = e.target.classList.contains("remove-link") ? e.target : e.target.closest(".remove-link");
      btn.closest(".link-row").remove();
    }
  });
}

// === Gallery Admin ===
let allCategories = [];

async function initGalleryAdmin() {
  if (!document.getElementById("imageUploadForm")) return;

  await loadCategories();
  await loadGalleryImages();

  const form = document.getElementById("imageUploadForm");
  const dropZone = document.getElementById("imageDropZone");
  const fileInput = document.getElementById("imageFile");

  dropZone.addEventListener("click", () => fileInput.click());
  dropZone.addEventListener("dragover", (e) => { e.preventDefault(); dropZone.classList.add("dragover"); });
  dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));
  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
    if (e.dataTransfer.files.length) {
      fileInput.files = e.dataTransfer.files;
      showImagePreview(e.dataTransfer.files[0]);
    }
  });
  fileInput.addEventListener("change", () => {
    if (fileInput.files[0]) showImagePreview(fileInput.files[0]);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const status = document.getElementById("uploadStatus");
    const btn = form.querySelector('button[type="submit"]');
    const file = fileInput.files[0];

    if (!file) {
      showStatus(status, "Bitte wähle ein Bild aus.", "error");
      return;
    }

    btn.disabled = true;
    btn.textContent = "Wird hochgeladen...";

    const fd = new FormData();
    fd.append("image", file);
    fd.append("title", document.getElementById("imageTitle").value);
    fd.append("description", document.getElementById("imageDesc").value);
    fd.append("categoryId", document.getElementById("imageCategorySelect").value);

    try {
      const res = await fetch("/api/admin/images", { method: "POST", body: fd });
      const data = await res.json();

      if (res.ok) {
        showStatus(status, "Bild erfolgreich hochgeladen!", "success");
        form.reset();
        document.getElementById("imagePreviewWrap").style.display = "none";
        await loadGalleryImages();
      } else {
        showStatus(status, data.error || "Fehler beim Hochladen.", "error");
      }
    } catch {
      showStatus(status, "Verbindungsfehler.", "error");
    }

    btn.disabled = false;
    btn.textContent = "Hochladen";
  });
}

function showImagePreview(file) {
  const wrap = document.getElementById("imagePreviewWrap");
  const img = document.getElementById("imagePreview");
  if (!wrap || !img) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    img.src = e.target.result;
    wrap.style.display = "block";
  };
  reader.readAsDataURL(file);
}

async function loadCategories() {
  const { data } = await api("/admin/categories");
  allCategories = data || [];

  document.querySelectorAll("#imageCategorySelect, #filterCategory").forEach(sel => {
    const currentVal = sel.value;
    const firstOpt = sel.querySelector("option");
    sel.innerHTML = "";
    if (firstOpt) sel.appendChild(firstOpt);
    allCategories.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.name;
      sel.appendChild(opt);
    });
    if (currentVal) sel.value = currentVal;
  });
}

async function loadGalleryImages() {
  const container = document.getElementById("adminGallery");
  if (!container) return;

  const { data: images } = await api("/admin/images");
  if (!images || images.length === 0) {
    container.innerHTML = '<p class="text-muted">Noch keine Bilder vorhanden.</p>';
    return;
  }

  container.innerHTML = images.map(img => {
    const cat = allCategories.find(c => c.id === img.categoryId);
    return `
    <div class="admin-gallery-item" data-id="${esc(img.id)}" data-category="${esc(img.categoryId)}">
      <img src="/uploads/${esc(img.filename)}" alt="${esc(img.title)}" loading="lazy">
      <div class="admin-gallery-item-info">
        <h4>${esc(img.title) || "Ohne Titel"}</h4>
        <p>${cat ? esc(cat.name) : "Keine Kategorie"} · ${formatDate(img.createdAt)}</p>
      </div>
      <div class="admin-gallery-item-actions">
        <button data-action="edit" data-id="${esc(img.id)}">Bearbeiten</button>
        <button class="delete" data-action="delete-img" data-id="${esc(img.id)}">Löschen</button>
      </div>
    </div>`;
  }).join("");

  container.addEventListener("click", handleGalleryAction);

  const filterSel = document.getElementById("filterCategory");
  if (filterSel) {
    filterSel.onchange = () => {
      const val = filterSel.value;
      container.querySelectorAll(".admin-gallery-item").forEach(item => {
        item.style.display = (!val || item.dataset.category === val) ? "" : "none";
      });
    };
  }
}

async function handleGalleryAction(e) {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;

  const action = btn.dataset.action;
  const id = btn.dataset.id;

  if (action === "delete-img") {
    if (!confirm("Bild wirklich löschen?")) return;
    btn.disabled = true;
    btn.textContent = "...";
    const { ok } = await api(`/admin/images/${id}`, { method: "DELETE" });
    if (ok) await loadGalleryImages();
    else { btn.disabled = false; btn.textContent = "Löschen"; alert("Fehler beim Löschen."); }
  }

  if (action === "edit") {
    const title = prompt("Neuer Titel:");
    if (title === null) return;
    await api(`/admin/images/${id}`, { method: "PUT", body: JSON.stringify({ title }) });
    await loadGalleryImages();
  }
}

// === Categories Admin ===
async function initCategoriesAdmin() {
  const form = document.getElementById("addCategoryForm");
  if (!form) return;

  await loadCategoriesList();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nameInput = form.querySelector('[name="name"]');
    const descInput = form.querySelector('[name="description"]');
    const btn = form.querySelector('button[type="submit"]');

    if (!nameInput.value.trim()) return;

    btn.disabled = true;

    const { ok } = await api("/admin/categories", {
      method: "POST",
      body: JSON.stringify({ name: nameInput.value, description: descInput.value })
    });

    if (ok) {
      form.reset();
      await loadCategories();
      await loadCategoriesList();
    }
    btn.disabled = false;
  });
}

async function loadCategoriesList() {
  const container = document.getElementById("categoriesList");
  if (!container) return;

  const { data } = await api("/admin/categories");
  const { data: images } = await api("/admin/images");

  if (!data || data.length === 0) {
    container.innerHTML = '<p class="text-muted">Noch keine Kategorien erstellt.</p>';
    return;
  }

  container.innerHTML = data.map(c => {
    const count = (images || []).filter(i => i.categoryId === c.id).length;
    return `
    <div class="category-item">
      <span class="cat-name">${esc(c.name)}</span>
      <span class="cat-desc">${esc(c.description)}</span>
      <span class="cat-count">${count} Bilder</span>
      <button class="btn btn-sm btn-danger" data-action="delete-cat" data-id="${esc(c.id)}">Löschen</button>
    </div>`;
  }).join("");

  container.onclick = async (e) => {
    const btn = e.target.closest("[data-action='delete-cat']");
    if (!btn) return;
    if (!confirm("Kategorie und alle zugehörigen Bilder wirklich löschen?")) return;
    btn.disabled = true;
    const { ok } = await api(`/admin/categories/${btn.dataset.id}`, { method: "DELETE" });
    if (ok) {
      await loadCategories();
      await loadCategoriesList();
      await loadGalleryImages();
    }
  };
}

// === Messages Admin ===
async function initMessagesAdmin() {
  if (!document.getElementById("messagesList")) return;
  await loadMessages();
}

async function loadMessages() {
  const container = document.getElementById("messagesList");
  const countEl = document.getElementById("messageCount");
  if (!container) return;

  const { data: msgs } = await api("/admin/messages");
  if (!msgs || msgs.length === 0) {
    container.innerHTML = '<p class="text-muted">Keine Nachrichten vorhanden.</p>';
    if (countEl) countEl.textContent = "0";
    return;
  }

  const unread = msgs.filter(m => !m.read).length;
  if (countEl) countEl.textContent = `${unread} ungelesen / ${msgs.length} gesamt`;

  container.innerHTML = msgs.map(m => `
    <div class="message-item ${m.read ? "" : "unread"}" data-msg-id="${esc(m.id)}">
      <div class="message-item-header">
        <h4>${esc(m.subject)}</h4>
        <span>${formatDate(m.createdAt)}</span>
      </div>
      <div class="message-meta">
        <span><strong>Von:</strong> ${esc(m.name)}</span>
        <span><strong>E-Mail:</strong> <a href="mailto:${esc(m.email)}" style="color:var(--primary)">${esc(m.email)}</a></span>
      </div>
      <div class="message-body">${esc(m.message).replace(/\n/g, "<br>")}</div>
      <div class="message-actions">
        ${!m.read ? `<button data-action="mark-read" data-id="${esc(m.id)}">Als gelesen markieren</button>` : '<button disabled style="opacity:.5">Gelesen</button>'}
        <button class="delete" data-action="delete-msg" data-id="${esc(m.id)}">Löschen</button>
        <button data-action="reply" data-email="${esc(m.email)}" data-name="${esc(m.name)}">Antworten ✉</button>
        <button data-action="copy-email" data-email="${esc(m.email)}">E-Mail kopieren</button>
      </div>
    </div>
  `).join("");

  container.onclick = async (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const action = btn.dataset.action;
    const id = btn.dataset.id;

    if (action === "mark-read") {
      btn.disabled = true;
      await api(`/admin/messages/${id}/read`, { method: "PUT" });
      await loadMessages();
    }

    if (action === "delete-msg") {
      if (!confirm("Nachricht wirklich löschen?")) return;
      btn.disabled = true;
      btn.textContent = "...";
      const { ok } = await api(`/admin/messages/${id}`, { method: "DELETE" });
      if (ok) {
        await loadMessages();
      } else {
        btn.disabled = false;
        btn.textContent = "Löschen";
        alert("Fehler beim Löschen der Nachricht.");
      }
    }

    if (action === "reply") {
      window.location.href = `mailto:${btn.dataset.email}?subject=Re: Anfrage von ${btn.dataset.name}`;
    }

    if (action === "copy-email") {
      try {
        await navigator.clipboard.writeText(btn.dataset.email);
        const orig = btn.textContent;
        btn.textContent = "Kopiert!";
        setTimeout(() => { btn.textContent = orig; }, 2000);
      } catch {
        prompt("E-Mail-Adresse:", btn.dataset.email);
      }
    }
  };
}

// === Settings Forms (Einstellungen) ===
function initSettingsForms() {
  setupForm("accountForm", async (fd) => {
    const body = {
      currentPassword: fd.get("currentPassword"),
      newEmail: fd.get("newEmail") || undefined,
      newPassword: fd.get("newPassword") || undefined
    };
    if (!body.newEmail && !body.newPassword) {
      return { ok: false, data: { error: "Bitte neue E-Mail oder neues Passwort eingeben." } };
    }
    return await api("/admin/account", { method: "PUT", body: JSON.stringify(body) });
  }, "accountStatus", true);

  setupForm("contactSettingsForm", async (fd) => {
    return await api("/admin/settings", {
      method: "PUT",
      body: JSON.stringify({ contactEmail: fd.get("contactEmail") })
    });
  }, "contactSettingsStatus");

  setupForm("impressumForm", async (fd) => {
    const impressum = {
      name: fd.get("imp_name"),
      address: fd.get("imp_address"),
      zip: fd.get("imp_zip"),
      city: fd.get("imp_city"),
      country: fd.get("imp_country"),
      email: fd.get("imp_email"),
      phone: fd.get("imp_phone"),
      extra: fd.get("imp_extra")
    };
    return await api("/admin/settings", { method: "PUT", body: JSON.stringify({ impressum }) });
  }, "impressumStatus");

  setupForm("datenschutzForm", async (fd) => {
    return await api("/admin/settings", {
      method: "PUT",
      body: JSON.stringify({ datenschutzExtra: fd.get("datenschutzExtra") })
    });
  }, "datenschutzStatus");
}

function setupForm(formId, handler, statusId, resetOnSuccess = false) {
  const form = document.getElementById(formId);
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const statusEl = document.getElementById(statusId);
    const originalText = btn.textContent;

    btn.disabled = true;
    btn.textContent = "Wird gespeichert...";

    const fd = new FormData(form);
    const result = await handler(fd);

    showStatus(
      statusEl,
      result.ok ? "Gespeichert! Änderungen sind sofort aktiv." : (result.data?.error || "Fehler beim Speichern."),
      result.ok ? "success" : "error"
    );

    btn.disabled = false;
    btn.textContent = originalText;
    if (result.ok && resetOnSuccess) form.reset();
  });
}

// === Upload Areas (Logo, Profile Image) with auto-resize ===
function initUploadAreas() {
  document.querySelectorAll(".upload-area").forEach(area => {
    const input = area.querySelector(".upload-input");
    const type = area.dataset.type;
    if (!input || !type) return;

    area.onclick = (e) => {
      if (e.target.closest(".upload-input")) return;
      input.click();
    };

    area.ondragover = (e) => { e.preventDefault(); area.classList.add("dragover"); };
    area.ondragleave = () => area.classList.remove("dragover");
    area.ondrop = (e) => {
      e.preventDefault();
      area.classList.remove("dragover");
      if (e.dataTransfer.files.length) processAndUpload(type, e.dataTransfer.files[0], area);
    };
    input.onchange = () => {
      if (input.files[0]) processAndUpload(type, input.files[0], area);
    };
  });
}

async function resizeImage(file, maxWidth, maxHeight, quality = 0.9) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width;
      let h = img.height;

      if (w <= maxWidth && h <= maxHeight) {
        resolve(file);
        return;
      }

      const ratio = Math.min(maxWidth / w, maxHeight / h);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);

      canvas.toBlob((blob) => {
        resolve(new File([blob], file.name, { type: "image/jpeg" }));
      }, "image/jpeg", quality);
    };
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}

async function processAndUpload(type, file, area) {
  area.innerHTML = '<span style="color:var(--primary)">Wird verarbeitet...</span>';

  let maxW, maxH;
  if (type === "logo") { maxW = 400; maxH = 400; }
  else if (type === "aboutImage") { maxW = 800; maxH = 1200; }
  else { maxW = 1920; maxH = 1920; }

  const resized = await resizeImage(file, maxW, maxH, 0.85);

  const fd = new FormData();
  fd.append("file", resized);

  try {
    const res = await fetch(`/api/admin/upload/${type}`, { method: "POST", body: fd });
    const data = await res.json();

    if (res.ok) {
      area.innerHTML = `<img src="${data.path}?t=${Date.now()}" class="upload-preview"><input type="file" accept="image/*" class="upload-input" style="display:none">`;
      initUploadAreas();
    } else {
      area.innerHTML = `<span style="color:var(--danger)">Fehler: ${data.error || "Upload fehlgeschlagen"}</span><input type="file" accept="image/*" class="upload-input" style="display:none">`;
      initUploadAreas();
    }
  } catch {
    area.innerHTML = `<span style="color:var(--danger)">Verbindungsfehler</span><input type="file" accept="image/*" class="upload-input" style="display:none">`;
    initUploadAreas();
  }
}
