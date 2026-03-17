// ========================================
// Natis Fine Creation — Admin Panel JS
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
  const res = await fetch(`/api${url}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

function showStatus(el, msg, type) {
  if (!el) return;
  el.textContent = msg;
  el.className = type === "success" ? "form-status success" : type === "error" ? "form-status error" : "save-status " + type;
  el.style.display = "block";
  if (type === "success") setTimeout(() => { el.style.display = "none"; }, 4000);
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
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

    const { ok, data } = await api("/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });

    if (ok) {
      window.location.href = "/admin";
    } else {
      showStatus(errorEl, data.error || "Anmeldung fehlgeschlagen.", "error");
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
    tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        tabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        const parent = tabGroup.parentElement;
        parent.querySelectorAll(".tab-content").forEach(tc => tc.classList.remove("active"));
        const target = parent.querySelector(`#tab-${tab.dataset.tab}`);
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

  document.getElementById("statImages").textContent = data.totalImages;
  document.getElementById("statCategories").textContent = data.totalCategories;
  document.getElementById("statMessages").textContent = data.totalMessages;
  document.getElementById("statUnread").textContent = data.unreadMessages;

  const msgContainer = document.getElementById("recentMessages");
  if (msgContainer) {
    const { data: msgs } = await api("/admin/messages");
    if (msgs && msgs.length > 0) {
      msgContainer.innerHTML = msgs.slice(0, 5).map(m => `
        <div class="message-item ${m.read ? "" : "unread"}" style="padding:.75rem;margin-bottom:.5rem">
          <div style="display:flex;justify-content:space-between">
            <strong style="font-size:.85rem">${esc(m.name)}</strong>
            <span style="font-size:.7rem;color:var(--text-muted)">${formatDate(m.createdAt)}</span>
          </div>
          <p style="font-size:.8rem;color:var(--text-muted);margin-top:.25rem">${esc(m.subject)}</p>
        </div>
      `).join("");
    } else {
      msgContainer.innerHTML = '<p class="text-muted" style="font-size:.85rem">Keine Nachrichten vorhanden.</p>';
    }
  }
}

// === Content Form ===
function initContentForm() {
  const form = document.getElementById("contentForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const settings = {};

    for (const [key, value] of fd.entries()) {
      if (!key.startsWith("social") && !key.startsWith("custom")) {
        settings[key] = value;
      }
    }

    const socialLinks = collectSocialLinks();
    const customLinks = collectCustomLinks();
    settings.socialLinks = socialLinks;
    settings.customLinks = customLinks;

    const { ok, data } = await api("/admin/settings", {
      method: "PUT",
      body: JSON.stringify(settings)
    });

    const status = document.getElementById("contentSaveStatus");
    showStatus(status, ok ? "Gespeichert!" : (data.error || "Fehler"), ok ? "success" : "error");
  });

  initLinkEditors();
}

function collectSocialLinks() {
  const links = [];
  document.querySelectorAll("#socialLinksEditor .link-row").forEach(row => {
    const idx = row.dataset.index;
    const icon = row.querySelector(`[name="socialIcon_${idx}"]`)?.value;
    const platform = row.querySelector(`[name="socialPlatform_${idx}"]`)?.value;
    const url = row.querySelector(`[name="socialUrl_${idx}"]`)?.value;
    if (platform && url) links.push({ icon: icon || "website", platform, url });
  });
  return links;
}

function collectCustomLinks() {
  const links = [];
  document.querySelectorAll("#customLinksEditor .link-row").forEach(row => {
    const idx = row.dataset.index;
    const title = row.querySelector(`[name="customTitle_${idx}"]`)?.value;
    const url = row.querySelector(`[name="customUrl_${idx}"]`)?.value;
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
      const idx = editor.querySelectorAll(".link-row").length;
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
          <button type="button" class="btn btn-sm btn-danger remove-social" data-index="${idx}">✕</button>
        </div>
      `);
    });
  }

  if (addCustom) {
    addCustom.addEventListener("click", () => {
      const editor = document.getElementById("customLinksEditor");
      const idx = editor.querySelectorAll(".link-row").length;
      editor.insertAdjacentHTML("beforeend", `
        <div class="link-row" data-index="${idx}">
          <input type="text" placeholder="Titel" name="customTitle_${idx}">
          <input type="url" placeholder="URL" name="customUrl_${idx}">
          <button type="button" class="btn btn-sm btn-danger remove-custom" data-index="${idx}">✕</button>
        </div>
      `);
    });
  }

  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-social") || e.target.classList.contains("remove-custom")) {
      e.target.closest(".link-row").remove();
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
    const file = fileInput.files[0];
    if (!file) {
      showStatus(status, "Bitte wähle ein Bild aus.", "error");
      return;
    }

    const fd = new FormData();
    fd.append("image", file);
    fd.append("title", document.getElementById("imageTitle").value);
    fd.append("description", document.getElementById("imageDesc").value);
    fd.append("categoryId", document.getElementById("imageCategorySelect").value);

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
  });
}

function showImagePreview(file) {
  const wrap = document.getElementById("imagePreviewWrap");
  const img = document.getElementById("imagePreview");
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

  const selects = document.querySelectorAll("#imageCategorySelect, #filterCategory");
  selects.forEach(sel => {
    const firstOption = sel.querySelector("option");
    sel.innerHTML = "";
    sel.appendChild(firstOption);
    allCategories.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.name;
      sel.appendChild(opt);
    });
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
    <div class="admin-gallery-item" data-id="${img.id}" data-category="${img.categoryId}">
      <img src="/uploads/${esc(img.filename)}" alt="${esc(img.title)}" loading="lazy">
      <div class="admin-gallery-item-info">
        <h4>${esc(img.title) || "Ohne Titel"}</h4>
        <p>${cat ? esc(cat.name) : "Keine Kategorie"} · ${formatDate(img.createdAt)}</p>
      </div>
      <div class="admin-gallery-item-actions">
        <button onclick="editImage('${img.id}')">Bearbeiten</button>
        <button class="delete" onclick="deleteImage('${img.id}')">Löschen</button>
      </div>
    </div>`;
  }).join("");

  const filterSel = document.getElementById("filterCategory");
  if (filterSel) {
    filterSel.addEventListener("change", () => {
      const val = filterSel.value;
      container.querySelectorAll(".admin-gallery-item").forEach(item => {
        item.style.display = (!val || item.dataset.category === val) ? "" : "none";
      });
    });
  }
}

window.deleteImage = async function(id) {
  if (!confirm("Bild wirklich löschen?")) return;
  const { ok } = await api(`/admin/images/${id}`, { method: "DELETE" });
  if (ok) await loadGalleryImages();
};

window.editImage = async function(id) {
  const title = prompt("Neuer Titel:");
  if (title === null) return;
  await api(`/admin/images/${id}`, {
    method: "PUT",
    body: JSON.stringify({ title })
  });
  await loadGalleryImages();
};

// === Categories Admin ===
async function initCategoriesAdmin() {
  const form = document.getElementById("addCategoryForm");
  if (!form) return;

  await loadCategoriesList();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = form.querySelector('[name="name"]').value;
    const description = form.querySelector('[name="description"]').value;

    const { ok } = await api("/admin/categories", {
      method: "POST",
      body: JSON.stringify({ name, description })
    });

    if (ok) {
      form.reset();
      await loadCategories();
      await loadCategoriesList();
    }
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
      <button class="btn btn-sm btn-danger" onclick="deleteCategory('${c.id}')">Löschen</button>
    </div>`;
  }).join("");
}

window.deleteCategory = async function(id) {
  if (!confirm("Kategorie und alle zugehörigen Bilder wirklich löschen?")) return;
  const { ok } = await api(`/admin/categories/${id}`, { method: "DELETE" });
  if (ok) {
    await loadCategories();
    await loadCategoriesList();
    await loadGalleryImages();
  }
};

// === Messages ===
async function initMessagesAdmin() {
  const container = document.getElementById("messagesList");
  if (!container) return;

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
    <div class="message-item ${m.read ? "" : "unread"}">
      <div class="message-item-header">
        <h4>${esc(m.subject)}</h4>
        <span>${formatDate(m.createdAt)}</span>
      </div>
      <div class="message-meta">
        <span>Von: ${esc(m.name)}</span>
        <span>E-Mail: ${esc(m.email)}</span>
      </div>
      <div class="message-body">${esc(m.message)}</div>
      <div class="message-actions">
        ${!m.read ? `<button onclick="markRead('${m.id}')">Als gelesen markieren</button>` : ""}
        <button class="delete" onclick="deleteMessage('${m.id}')">Löschen</button>
        <button onclick="replyMessage('${esc(m.email)}')">Antworten</button>
      </div>
    </div>
  `).join("");
}

window.markRead = async function(id) {
  await api(`/admin/messages/${id}/read`, { method: "PUT" });
  await loadMessages();
};

window.deleteMessage = async function(id) {
  if (!confirm("Nachricht wirklich löschen?")) return;
  await api(`/admin/messages/${id}`, { method: "DELETE" });
  await loadMessages();
};

window.replyMessage = function(email) {
  window.open(`mailto:${email}`, "_blank");
};

// === Settings Forms ===
function initSettingsForms() {
  const accountForm = document.getElementById("accountForm");
  if (accountForm) {
    accountForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(accountForm);
      const body = {
        currentPassword: fd.get("currentPassword"),
        newEmail: fd.get("newEmail") || undefined,
        newPassword: fd.get("newPassword") || undefined
      };

      const { ok, data } = await api("/admin/account", {
        method: "PUT",
        body: JSON.stringify(body)
      });

      showStatus(
        document.getElementById("accountStatus"),
        ok ? "Konto aktualisiert!" : (data.error || "Fehler"),
        ok ? "success" : "error"
      );
      if (ok) accountForm.reset();
    });
  }

  const contactSettingsForm = document.getElementById("contactSettingsForm");
  if (contactSettingsForm) {
    contactSettingsForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(contactSettingsForm);
      const { ok, data } = await api("/admin/settings", {
        method: "PUT",
        body: JSON.stringify({ contactEmail: fd.get("contactEmail") })
      });
      showStatus(
        document.getElementById("contactSettingsStatus"),
        ok ? "Gespeichert!" : (data.error || "Fehler"),
        ok ? "success" : "error"
      );
    });
  }

  const impressumForm = document.getElementById("impressumForm");
  if (impressumForm) {
    impressumForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(impressumForm);
      const impressum = {
        name: fd.get("imp_name"),
        address: fd.get("imp_address"),
        zip: fd.get("imp_zip"),
        city: fd.get("imp_city"),
        country: fd.get("imp_country"),
        email: fd.get("imp_email"),
        phone: fd.get("imp_phone"),
        taxId: fd.get("imp_taxId"),
        extra: fd.get("imp_extra")
      };
      const { ok, data } = await api("/admin/settings", {
        method: "PUT",
        body: JSON.stringify({ impressum })
      });
      showStatus(
        document.getElementById("impressumStatus"),
        ok ? "Impressum gespeichert!" : (data.error || "Fehler"),
        ok ? "success" : "error"
      );
    });
  }

  const datenschutzForm = document.getElementById("datenschutzForm");
  if (datenschutzForm) {
    datenschutzForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(datenschutzForm);
      const { ok, data } = await api("/admin/settings", {
        method: "PUT",
        body: JSON.stringify({ datenschutzExtra: fd.get("datenschutzExtra") })
      });
      showStatus(
        document.getElementById("datenschutzStatus"),
        ok ? "Gespeichert!" : (data.error || "Fehler"),
        ok ? "success" : "error"
      );
    });
  }
}

// === Upload Areas (Logo, Profile) ===
function initUploadAreas() {
  document.querySelectorAll(".upload-area").forEach(area => {
    const input = area.querySelector(".upload-input");
    const type = area.dataset.type;
    if (!input || !type) return;

    area.addEventListener("click", () => input.click());
    area.addEventListener("dragover", (e) => { e.preventDefault(); area.classList.add("dragover"); });
    area.addEventListener("dragleave", () => area.classList.remove("dragover"));
    area.addEventListener("drop", (e) => {
      e.preventDefault();
      area.classList.remove("dragover");
      if (e.dataTransfer.files.length) uploadFile(type, e.dataTransfer.files[0], area);
    });
    input.addEventListener("change", () => {
      if (input.files[0]) uploadFile(type, input.files[0], area);
    });
  });
}

async function uploadFile(type, file, area) {
  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch(`/api/admin/upload/${type}`, { method: "POST", body: fd });
  const data = await res.json();

  if (res.ok) {
    area.innerHTML = `<img src="${data.path}" class="upload-preview"><input type="file" accept="image/*" class="upload-input" style="display:none">`;
    initUploadAreas();
  }
}

function esc(s) {
  if (!s) return "";
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}
