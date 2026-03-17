import { getSettings, getCategories, getImages, type SiteSettings } from "./storage";

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function head(s: SiteSettings, title: string, extra = ""): string {
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="${escHtml(s.metaDescription)}">
<title>${escHtml(title)} — ${escHtml(s.siteName)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/style.css">
<style>:root{--primary:${s.primaryColor};--accent:${s.accentColor}}</style>
${extra}
</head>`;
}

function nav(s: SiteSettings, active: string): string {
  const links = [
    { href: "/", label: "Home", id: "home" },
    { href: "/galerie", label: "Galerie", id: "galerie" },
    { href: "/kontakt", label: "Kontakt", id: "kontakt" },
  ];
  return `
<nav class="main-nav" id="mainNav">
  <div class="nav-inner">
    <a href="/" class="nav-logo">
      ${s.logo ? `<img src="${escHtml(s.logo)}" alt="${escHtml(s.siteName)}" class="logo-img">` : `<span class="logo-text">${escHtml(s.siteName)}</span>`}
    </a>
    <button class="nav-toggle" id="navToggle" aria-label="Menü">
      <span></span><span></span><span></span>
    </button>
    <div class="nav-links" id="navLinks">
      ${links.map(l => `<a href="${l.href}" class="${active === l.id ? "active" : ""}">${l.label}</a>`).join("")}
      ${s.customLinks.map(l => `<a href="${escHtml(l.url)}" target="_blank" rel="noopener">${escHtml(l.title)}</a>`).join("")}
    </div>
  </div>
</nav>`;
}

function footer(s: SiteSettings): string {
  return `
<footer class="site-footer">
  <div class="footer-inner">
    <div class="footer-brand">
      ${s.logo ? `<img src="${escHtml(s.logo)}" alt="" class="footer-logo">` : ""}
      <span>${escHtml(s.siteName)}</span>
    </div>
    <div class="footer-links">
      <a href="/impressum">Impressum</a>
      <a href="/datenschutz">Datenschutz</a>
    </div>
    <div class="footer-social">
      ${s.socialLinks.map(l => `<a href="${escHtml(l.url)}" target="_blank" rel="noopener" aria-label="${escHtml(l.platform)}" class="social-link">${socialIcon(l.icon)}</a>`).join("")}
    </div>
    <p class="footer-copy">${escHtml(s.footerText)}</p>
  </div>
</footer>
<script src="/js/main.js"></script>
</body></html>`;
}

function socialIcon(icon: string): string {
  const icons: Record<string, string> = {
    instagram: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`,
    facebook: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>`,
    tiktok: `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1 0-5.78 2.93 2.93 0 0 1 .88.13v-3.5a6.37 6.37 0 0 0-.88-.07 6.28 6.28 0 0 0 0 12.56 6.29 6.29 0 0 0 6.28-6.29V9.42a8.28 8.28 0 0 0 4.82 1.55V7.52a4.85 4.85 0 0 1-1-.83z"/></svg>`,
    youtube: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.12c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.45z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>`,
    website: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`
  };
  return icons[icon] || icons.website!;
}

export function homePage(): string {
  const s = getSettings();
  const images = getImages().slice(0, 6);
  const cats = getCategories();

  return `${head(s, "Home")}
<body class="page-home">
${nav(s, "home")}

<section class="hero">
  <div class="hero-bg"></div>
  <div class="hero-particles" id="particles"></div>
  <div class="hero-content fade-up">
    ${s.logo ? `<img src="${escHtml(s.logo)}" alt="" class="hero-logo floating">` : ""}
    <h1 class="hero-title glitch-text">${escHtml(s.heroTitle)}</h1>
    <p class="hero-subtitle">${escHtml(s.heroSubtitle)}</p>
    <a href="${escHtml(s.heroButtonLink)}" class="btn btn-primary btn-glow">${escHtml(s.heroButtonText)}</a>
  </div>
  <div class="hero-scroll">
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
  </div>
</section>

<section class="section about-section" id="about">
  <div class="container">
    <div class="about-grid">
      <div class="about-image-wrap fade-left">
        ${s.aboutImage ? `<img src="${escHtml(s.aboutImage)}" alt="Über mich" class="about-image">` : `<div class="about-image-placeholder"><span>Profilbild</span></div>`}
        <div class="about-image-frame"></div>
      </div>
      <div class="about-text-wrap fade-right">
        <h2 class="section-title">${escHtml(s.aboutTitle)}</h2>
        <div class="gold-line"></div>
        <p class="about-text">${escHtml(s.aboutText)}</p>
        <div class="about-social">
          ${s.socialLinks.map(l => `<a href="${escHtml(l.url)}" target="_blank" rel="noopener" class="social-btn">${socialIcon(l.icon)} ${escHtml(l.platform)}</a>`).join("")}
        </div>
      </div>
    </div>
  </div>
</section>

${images.length > 0 ? `
<section class="section preview-section">
  <div class="container">
    <h2 class="section-title text-center fade-up">${escHtml(s.galleryTitle)}</h2>
    <div class="gold-line center"></div>
    <p class="section-subtitle text-center fade-up">${escHtml(s.gallerySubtitle)}</p>
    <div class="preview-grid">
      ${images.map(img => `
      <div class="preview-card fade-up">
        <div class="preview-img-wrap">
          <img src="/uploads/${escHtml(img.filename)}" alt="${escHtml(img.title)}" loading="lazy">
          <div class="preview-overlay">
            <span class="preview-title">${escHtml(img.title)}</span>
            ${img.categoryId ? `<span class="preview-cat">${escHtml(cats.find(c => c.id === img.categoryId)?.name || "")}</span>` : ""}
          </div>
        </div>
      </div>`).join("")}
    </div>
    <div class="text-center" style="margin-top:2.5rem">
      <a href="/galerie" class="btn btn-outline">Alle Werke ansehen</a>
    </div>
  </div>
</section>` : ""}

<section class="section commission-section">
  <div class="container text-center">
    <h2 class="section-title fade-up">${escHtml(s.commissionTitle)}</h2>
    <div class="gold-line center"></div>
    <p class="commission-text fade-up">${escHtml(s.commissionText)}</p>
    <a href="/kontakt" class="btn btn-primary btn-glow fade-up">Jetzt anfragen</a>
  </div>
</section>

${footer(s)}`;
}

export function galleryPage(): string {
  const s = getSettings();
  const categories = getCategories().sort((a, b) => a.order - b.order);
  const images = getImages().sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return `${head(s, "Galerie")}
<body class="page-gallery">
${nav(s, "galerie")}

<section class="page-header">
  <h1 class="page-title fade-up">${escHtml(s.galleryTitle)}</h1>
  <p class="page-subtitle fade-up">${escHtml(s.gallerySubtitle)}</p>
</section>

<section class="section gallery-section">
  <div class="container">
    ${categories.length > 0 ? `
    <div class="gallery-filter fade-up">
      <button class="filter-btn active" data-category="all">Alle</button>
      ${categories.map(c => `<button class="filter-btn" data-category="${escHtml(c.id)}">${escHtml(c.name)}</button>`).join("")}
    </div>` : ""}

    <div class="gallery-masonry" id="galleryGrid">
      ${images.map(img => `
      <div class="gallery-item fade-up" data-category="${escHtml(img.categoryId)}">
        <img src="/uploads/${escHtml(img.filename)}" alt="${escHtml(img.title)}" loading="lazy">
        <div class="gallery-item-overlay">
          <h3>${escHtml(img.title)}</h3>
          ${img.description ? `<p>${escHtml(img.description)}</p>` : ""}
        </div>
      </div>`).join("")}
    </div>

    ${images.length === 0 ? `<p class="empty-state">Noch keine Werke vorhanden.</p>` : ""}
  </div>
</section>

${footer(s)}`;
}

export function contactPage(): string {
  const s = getSettings();
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;

  return `${head(s, "Kontakt")}
<body class="page-contact">
${nav(s, "kontakt")}

<section class="page-header">
  <h1 class="page-title fade-up">${escHtml(s.contactTitle)}</h1>
  <p class="page-subtitle fade-up">${escHtml(s.contactSubtitle)}</p>
</section>

<section class="section contact-section">
  <div class="container">
    <div class="contact-grid">
      <div class="contact-info fade-left">
        <h2>${escHtml(s.commissionTitle)}</h2>
        <div class="gold-line"></div>
        <p>${escHtml(s.commissionText)}</p>
        <div class="contact-details">
          <div class="contact-detail">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            <span>${escHtml(s.contactEmail)}</span>
          </div>
          ${s.socialLinks.map(l => `
          <div class="contact-detail">
            ${socialIcon(l.icon)}
            <a href="${escHtml(l.url)}" target="_blank" rel="noopener">${escHtml(l.platform)}</a>
          </div>`).join("")}
        </div>
      </div>

      <form class="contact-form fade-right" id="contactForm">
        <div class="form-group">
          <label for="name">Name *</label>
          <input type="text" id="name" name="name" required maxlength="100" placeholder="Dein Name">
        </div>
        <div class="form-group">
          <label for="email">E-Mail *</label>
          <input type="email" id="email" name="email" required maxlength="200" placeholder="deine@email.de">
        </div>
        <div class="form-group">
          <label for="subject">Betreff</label>
          <input type="text" id="subject" name="subject" maxlength="200" placeholder="Worum geht es?">
        </div>
        <div class="form-group">
          <label for="message">Nachricht *</label>
          <textarea id="message" name="message" required rows="6" maxlength="5000" placeholder="Deine Nachricht..."></textarea>
        </div>
        <div class="form-group math-captcha">
          <label for="mathAnswer">Spamschutz: Was ergibt ${a} + ${b}? *</label>
          <input type="number" id="mathAnswer" name="mathAnswer" required placeholder="Antwort">
          <input type="hidden" name="mathExpected" value="${a + b}">
        </div>
        <div style="position:absolute;left:-9999px" aria-hidden="true">
          <input type="text" name="website_url" tabindex="-1" autocomplete="off">
        </div>
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" id="privacy" name="privacy" required>
            <span>Ich habe die <a href="/datenschutz" target="_blank">Datenschutzerklärung</a> gelesen und stimme der Verarbeitung meiner Daten zu. *</span>
          </label>
        </div>
        <button type="submit" class="btn btn-primary btn-glow">Nachricht senden</button>
        <div id="contactStatus" class="form-status"></div>
      </form>
    </div>
  </div>
</section>

${footer(s)}`;
}

export function impressumPage(): string {
  const s = getSettings();
  const imp = s.impressum;

  return `${head(s, "Impressum")}
<body class="page-legal">
${nav(s, "")}

<section class="page-header">
  <h1 class="page-title fade-up">Impressum</h1>
</section>

<section class="section legal-section">
  <div class="container legal-content fade-up">

    <h2>Angaben gemäß § 5 DDG</h2>
    <p>${escHtml(imp.name)}<br>
    ${escHtml(imp.address)}<br>
    ${escHtml(imp.zip)} ${escHtml(imp.city)}<br>
    ${escHtml(imp.country)}</p>

    <h2>Kontakt</h2>
    <p>E-Mail: ${escHtml(imp.email)}</p>
    ${imp.phone ? `<p>Telefon: ${escHtml(imp.phone)}</p>` : ""}

    <h2>Hinweis zur Natur dieser Website</h2>
    <p>Bei dieser Website handelt es sich um eine <strong>private, nicht-kommerzielle Online-Galerie</strong>. Die hier dargestellten Kunstwerke, Bilder und kreativen Arbeiten dienen <strong>ausschließlich zur Inspiration und persönlichen Präsentation</strong> und stehen <strong>nicht zum Verkauf</strong>. Es werden keine Waren oder Dienstleistungen gewerblich angeboten.</p>
    <p>Das Kontaktformular dient ausschließlich dem persönlichen Austausch, z.&nbsp;B. für Ideen, Anregungen oder kreative Anfragen. Es findet <strong>kein gewerblicher Handel</strong> über diese Website statt.</p>

    <h2>Urheberrecht</h2>
    <p>Sämtliche auf dieser Website veröffentlichten Inhalte — insbesondere Bilder, Grafiken, Fotos, Texte und kreative Arbeiten — unterliegen dem deutschen Urheberrecht und sind Eigentum der Seitenbetreiberin, sofern nicht anders gekennzeichnet.</p>
    <p>Die Inhalte dieser Seite dienen <strong>ausschließlich zur Ansicht und Inspiration</strong>. Jede Vervielfältigung, Bearbeitung, Verbreitung, Speicherung oder sonstige Verwertung — auch in Teilen — bedarf der vorherigen schriftlichen Zustimmung der Urheberin. Eine kommerzielle Nutzung der Inhalte ist ohne ausdrückliche Genehmigung nicht gestattet.</p>
    <p>Sollten Sie auf eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.</p>

    <h2>Haftung für Inhalte</h2>
    <p>Die Inhalte dieser Website wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen. Als Betreiberin dieser privaten Website sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind wir jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen.</p>
    <p>Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.</p>

    <h2>Haftung für Links</h2>
    <p>Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.</p>
    <p>Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar. Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.</p>

    ${imp.extra ? `<h2>Zusätzliche Angaben</h2><p>${escHtml(imp.extra)}</p>` : ""}
  </div>
</section>

${footer(s)}`;
}

export function datenschutzPage(): string {
  const s = getSettings();
  const imp = s.impressum;

  return `${head(s, "Datenschutz")}
<body class="page-legal">
${nav(s, "")}

<section class="page-header">
  <h1 class="page-title fade-up">Datenschutzerklärung</h1>
</section>

<section class="section legal-section">
  <div class="container legal-content fade-up">

    <h2>1. Datenschutz auf einen Blick</h2>

    <h3>Hinweis zur Natur dieser Website</h3>
    <p>Bei dieser Website handelt es sich um eine <strong>private, nicht-kommerzielle Online-Galerie</strong>. Es werden keine Waren oder Dienstleistungen gewerblich angeboten oder verkauft. Die dargestellten Kunstwerke dienen ausschließlich zur Inspiration und persönlichen Präsentation. Das Kontaktformular dient dem persönlichen Austausch, z.&nbsp;B. für Ideen und kreative Anregungen.</p>

    <h3>Allgemeine Hinweise</h3>
    <p>Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können. Ausführliche Informationen zum Thema Datenschutz entnehmen Sie unserer nachfolgend aufgeführten Datenschutzerklärung.</p>

    <h3>Datenerfassung auf dieser Website</h3>
    <p><strong>Wer ist verantwortlich für die Datenerfassung auf dieser Website?</strong></p>
    <p>Die Datenverarbeitung auf dieser privaten Website erfolgt durch: ${escHtml(imp.name)}, ${escHtml(imp.address)}, ${escHtml(imp.zip)} ${escHtml(imp.city)}. E-Mail: ${escHtml(imp.email)}</p>

    <p><strong>Wie erfassen wir Ihre Daten?</strong></p>
    <p>Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen — beispielsweise, wenn Sie das Kontaktformular nutzen, um uns eine Idee oder Anregung mitzuteilen. Andere Daten werden automatisch beim Besuch der Website durch unsere IT-Systeme erfasst. Das sind vor allem technische Daten (z.&nbsp;B. Internetbrowser, Betriebssystem oder Uhrzeit des Seitenaufrufs).</p>

    <p><strong>Wofür nutzen wir Ihre Daten?</strong></p>
    <p>Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu gewährleisten. Über das Kontaktformular eingegebene Daten werden ausschließlich zur Beantwortung Ihrer persönlichen Anfrage verwendet. Es findet <strong>keine kommerzielle Nutzung, kein Tracking und keine Weitergabe an Dritte</strong> statt.</p>

    <p><strong>Welche Rechte haben Sie bezüglich Ihrer Daten?</strong></p>
    <p>Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung oder Löschung dieser Daten zu verlangen. Wenn Sie eine Einwilligung zur Datenverarbeitung erteilt haben, können Sie diese Einwilligung jederzeit für die Zukunft widerrufen. Außerdem haben Sie das Recht, unter bestimmten Umständen die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen.</p>

    <h2>2. Hosting</h2>
    <p>Diese Website wird über <strong>Netlify, Inc.</strong> (44 Montgomery Street, Suite 300, San Francisco, California 94104, USA) gehostet. Netlify ist ein Cloud-Hosting-Dienst, der Webseiten über ein weltweites Content Delivery Network (CDN) bereitstellt.</p>
    <p>Wenn Sie unsere Website besuchen, werden automatisch durch Netlify Informationen erfasst und in sogenannten Server-Log-Dateien gespeichert. Dies umfasst: IP-Adresse, Datum und Uhrzeit des Zugriffs, übertragene Datenmenge, Referrer-URL, verwendeter Browser und Betriebssystem. Diese Daten werden auf Servern in den USA und/oder Europa verarbeitet.</p>
    <p>Die Nutzung von Netlify erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Wir haben ein berechtigtes Interesse an einer zuverlässigen, schnellen und sicheren Bereitstellung unserer Website. Sofern eine entsprechende Einwilligung abgefragt wurde, erfolgt die Verarbeitung auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO.</p>
    <p>Netlify verfügt über Zertifizierungen nach dem EU-US Data Privacy Framework. Weitere Informationen finden Sie in der <a href="https://www.netlify.com/privacy/" target="_blank" rel="noopener">Datenschutzerklärung von Netlify</a>.</p>

    <h3>SSL- bzw. TLS-Verschlüsselung</h3>
    <p>Diese Seite nutzt aus Sicherheitsgründen und zum Schutz der Übertragung vertraulicher Inhalte, wie zum Beispiel Kontaktanfragen, eine SSL- bzw. TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennen Sie daran, dass die Adresszeile des Browsers von „http://" auf „https://" wechselt und an dem Schloss-Symbol in Ihrer Browserzeile. Wenn die SSL- bzw. TLS-Verschlüsselung aktiviert ist, können die Daten, die Sie an uns übermitteln, nicht von Dritten mitgelesen werden.</p>

    <h2>3. Allgemeine Hinweise und Pflichtinformationen</h2>
    <h3>Datenschutz</h3>
    <p>Die Betreiberin dieser privaten Website nimmt den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend der gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.</p>
    <p>Wir weisen darauf hin, dass die Datenübertragung im Internet (z.&nbsp;B. bei der Kommunikation per E-Mail) Sicherheitslücken aufweisen kann. Ein lückenloser Schutz der Daten vor dem Zugriff durch Dritte ist nicht möglich.</p>

    <h3>Hinweis zur verantwortlichen Stelle</h3>
    <p>Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:</p>
    <p>${escHtml(imp.name)}<br>${escHtml(imp.address)}<br>${escHtml(imp.zip)} ${escHtml(imp.city)}<br>E-Mail: ${escHtml(imp.email)}</p>
    <p>Verantwortliche Stelle ist die natürliche Person, die allein oder gemeinsam mit anderen über die Zwecke und Mittel der Verarbeitung von personenbezogenen Daten (z.&nbsp;B. Namen, E-Mail-Adressen o.&nbsp;Ä.) entscheidet.</p>

    <h3>Speicherdauer</h3>
    <p>Soweit innerhalb dieser Datenschutzerklärung keine speziellere Speicherdauer genannt wurde, verbleiben Ihre personenbezogenen Daten bei uns, bis der Zweck für die Datenverarbeitung entfällt. Wenn Sie ein berechtigtes Löschersuchen geltend machen oder eine Einwilligung zur Datenverarbeitung widerrufen, werden Ihre Daten gelöscht, sofern wir keine anderen rechtlich zulässigen Gründe für die Speicherung Ihrer personenbezogenen Daten haben.</p>

    <h3>Widerruf Ihrer Einwilligung zur Datenverarbeitung</h3>
    <p>Viele Datenverarbeitungsvorgänge sind nur mit Ihrer ausdrücklichen Einwilligung möglich. Sie können eine bereits erteilte Einwilligung jederzeit widerrufen. Die Rechtmäßigkeit der bis zum Widerruf erfolgten Datenverarbeitung bleibt vom Widerruf unberührt.</p>

    <h3>Recht auf Datenübertragbarkeit</h3>
    <p>Sie haben das Recht, Daten, die wir auf Grundlage Ihrer Einwilligung oder in Erfüllung eines Vertrags automatisiert verarbeiten, an sich oder an einen Dritten in einem gängigen, maschinenlesbaren Format aushändigen zu lassen.</p>

    <h3>Auskunft, Löschung und Berichtigung</h3>
    <p>Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das Recht auf unentgeltliche Auskunft über Ihre gespeicherten personenbezogenen Daten, deren Herkunft und Empfänger und den Zweck der Datenverarbeitung und ggf. ein Recht auf Berichtigung oder Löschung dieser Daten. Hierzu sowie zu weiteren Fragen zum Thema personenbezogene Daten können Sie sich jederzeit an uns wenden.</p>

    <h3>Recht auf Einschränkung der Verarbeitung</h3>
    <p>Sie haben das Recht, die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen. Hierzu können Sie sich jederzeit an uns wenden.</p>

    <h3>Beschwerderecht bei der zuständigen Aufsichtsbehörde</h3>
    <p>Im Falle von Verstößen gegen die DSGVO steht den Betroffenen ein Beschwerderecht bei einer Aufsichtsbehörde zu. Das Beschwerderecht besteht unbeschadet anderweitiger verwaltungsrechtlicher oder gerichtlicher Rechtsbehelfe.</p>

    <h2>4. Datenerfassung auf dieser Website</h2>
    <h3>Kontaktformular</h3>
    <p>Wenn Sie uns per Kontaktformular Anfragen zukommen lassen, werden Ihre Angaben aus dem Anfrageformular inklusive der von Ihnen dort angegebenen Kontaktdaten (Name, E-Mail-Adresse, Betreff, Nachricht) zwecks Bearbeitung der Anfrage und für den Fall von Anschlussfragen bei uns gespeichert. Diese Daten geben wir nicht ohne Ihre Einwilligung weiter.</p>
    <p>Das Kontaktformular auf dieser Website dient <strong>ausschließlich dem persönlichen Austausch</strong> — beispielsweise für kreative Ideen, Anregungen oder allgemeine Anfragen. Es findet <strong>kein gewerblicher Zweck</strong> statt.</p>
    <p>Die Verarbeitung dieser Daten erfolgt auf Grundlage Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO), die Sie durch Aktivierung der Datenschutz-Checkbox im Kontaktformular erteilen. Sie können diese Einwilligung jederzeit widerrufen.</p>
    <p>Die von Ihnen im Kontaktformular eingegebenen Daten verbleiben bei uns, bis Sie uns zur Löschung auffordern, Ihre Einwilligung zur Speicherung widerrufen oder der Zweck für die Datenspeicherung entfällt.</p>

    <h3>Server-Log-Dateien</h3>
    <p>Der Hosting-Provider (Netlify) erhebt und speichert automatisch Informationen in sogenannten Server-Log-Dateien, die Ihr Browser automatisch übermittelt. Dies sind: Browsertyp und Browserversion, verwendetes Betriebssystem, Referrer-URL, Hostname des zugreifenden Rechners, Uhrzeit der Serveranfrage, IP-Adresse.</p>
    <p>Eine Zusammenführung dieser Daten mit anderen Datenquellen wird nicht vorgenommen. Die Erfassung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO.</p>

    <h3>Cookies</h3>
    <p>Diese Website verwendet <strong>nur technisch notwendige Cookies</strong> für die Funktionalität des Administrationsbereichs. Es werden <strong>keine Tracking-Cookies, Analyse-Cookies oder Cookies für Werbezwecke</strong> eingesetzt. Das für die Administrator-Anmeldung verwendete Session-Cookie dient ausschließlich der Authentifizierung und enthält keine personenbezogenen Daten von Besuchern.</p>
    <p>Besucher der öffentlichen Website erhalten keine Cookies.</p>

    <h2>5. Keine kommerzielle Nutzung</h2>
    <p>Diese Website dient <strong>ausschließlich privaten Zwecken</strong>. Es werden keine Waren oder Dienstleistungen angeboten, verkauft oder beworben. Die dargestellten Kunstwerke und kreativen Arbeiten dienen ausschließlich der Inspiration und persönlichen Präsentation. Es findet keinerlei gewerbliche Tätigkeit über diese Website statt.</p>
    <p>Es werden <strong>keine Nutzerdaten für kommerzielle Zwecke, Werbung oder Profiling</strong> verwendet oder an Dritte weitergegeben.</p>

    ${s.datenschutzExtra ? `<h2>6. Zusätzliche Informationen</h2><p>${escHtml(s.datenschutzExtra)}</p>` : ""}

    <div id="itkanzlei_txt_copyright" style="font-size: 12px; margin-top: 4em; padding-top: 2em; border-top: 1px solid var(--border);">
      <div style="display: inline-block; vertical-align: top;">
        <a href="https://www.it-recht-kanzlei.de/" target="_blank" rel="noopener">
          <img src="https://www.it-recht-kanzlei.de/logo/Copyright-Logo_Datenschutzerklaerung.png?i=5c20a-4298c-39c8-907e-1" id="itkanzlei_img_copyright" alt="&copy; IT-Recht Kanzlei" title="&copy; IT-Recht Kanzlei" style="margin-top: -20px; border-style: none; max-width: 100%;" />
        </a>
      </div>
      <div style="display: inline-block; vertical-align: top; margin-left: 5px; float: right; white-space: nowrap;">Stand: 17.03.2026, 20:13:05</div>
      <div style="clear: right;"></div>
    </div>
  </div>
</section>

${footer(s)}`;
}

export function loginPage(error = ""): string {
  const s = getSettings();
  return `${head(s, "Login", '<link rel="stylesheet" href="/css/admin.css">')}
<body class="page-login">
<div class="login-container">
  <div class="login-card">
    ${s.logo ? `<img src="${escHtml(s.logo)}" alt="" class="login-logo">` : `<h1 class="login-brand">${escHtml(s.siteName)}</h1>`}
    <h2>Admin-Bereich</h2>
    ${error ? `<div class="alert alert-error">${escHtml(error)}</div>` : ""}
    <form id="loginForm" class="login-form">
      <div class="form-group">
        <label for="email">E-Mail</label>
        <input type="email" id="email" name="email" required autofocus placeholder="admin@beispiel.de">
      </div>
      <div class="form-group">
        <label for="password">Passwort</label>
        <input type="password" id="password" name="password" required placeholder="••••••••">
      </div>
      <button type="submit" class="btn btn-primary btn-full">Anmelden</button>
      <div id="loginError" class="form-status"></div>
    </form>
    <a href="/" class="login-back">← Zurück zur Website</a>
  </div>
</div>
<script src="/js/admin.js"></script>
</body></html>`;
}
