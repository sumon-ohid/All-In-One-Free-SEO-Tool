/**
 * OG image generator. Renders a customizable HTML template in headless
 * Chrome (via the existing browser pool) and screenshots it to a 1200×630
 * PNG suitable for og:image / twitter:image.
 *
 * No paid AI image API — we render real HTML/CSS so the user can iterate
 * on styling. Returns base64 data URL.
 */

import { withBrowserPage } from "./browser-pool";

export type OgTemplate = "minimal" | "gradient" | "card" | "magazine";

export type OgOptions = {
  title: string;
  subtitle?: string;
  brand?: string;
  brandColor?: string; // hex
  template?: OgTemplate;
  imageUrl?: string;
};

export async function generateOgImage(opts: OgOptions): Promise<{
  ok: boolean;
  dataUrl?: string;
  error?: string;
}> {
  const html = renderHtml(opts);
  try {
    const dataUrl = await withBrowserPage(async (page) => {
      await page.setViewportSize({ width: 1200, height: 630 });
      await page.setContent(html, { waitUntil: "networkidle", timeout: 15_000 });
      const buf = await page.screenshot({
        type: "png",
        fullPage: false,
        clip: { x: 0, y: 0, width: 1200, height: 630 },
      });
      return `data:image/png;base64,${buf.toString("base64")}`;
    });
    return { ok: true, dataUrl };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

function renderHtml(opts: OgOptions): string {
  const tmpl = opts.template ?? "gradient";
  const brand = opts.brand ?? "";
  const color = opts.brandColor ?? "#7c3aed";
  const title = escapeHtml(opts.title);
  const subtitle = escapeHtml(opts.subtitle ?? "");
  const safeImg = opts.imageUrl ? escapeAttr(opts.imageUrl) : null;

  const css = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 1200px; height: 630px; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; color: #fff; }
  `;

  if (tmpl === "minimal") {
    return base(css + minimalCss(color), `
      <div class="og-container">
        ${brand ? `<div class="og-brand">${escapeHtml(brand)}</div>` : ""}
        <h1>${title}</h1>
        ${subtitle ? `<p>${subtitle}</p>` : ""}
      </div>
    `);
  }
  if (tmpl === "card") {
    return base(css + cardCss(color), `
      <div class="og-bg">
        <div class="og-card">
          ${brand ? `<div class="og-brand">${escapeHtml(brand)}</div>` : ""}
          <h1>${title}</h1>
          ${subtitle ? `<p>${subtitle}</p>` : ""}
        </div>
      </div>
    `);
  }
  if (tmpl === "magazine") {
    return base(css + magazineCss(color), `
      <div class="og-mag">
        <div class="og-text">
          ${brand ? `<div class="og-brand">${escapeHtml(brand).toUpperCase()}</div>` : ""}
          <h1>${title}</h1>
          ${subtitle ? `<p>${subtitle}</p>` : ""}
        </div>
        ${safeImg ? `<div class="og-img" style="background-image: url('${safeImg}')"></div>` : ""}
      </div>
    `);
  }
  // gradient (default)
  return base(css + gradientCss(color), `
    <div class="og-gradient">
      <div class="og-content">
        ${brand ? `<div class="og-brand">${escapeHtml(brand)}</div>` : ""}
        <h1>${title}</h1>
        ${subtitle ? `<p>${subtitle}</p>` : ""}
      </div>
      <div class="og-glow og-glow-1"></div>
      <div class="og-glow og-glow-2"></div>
    </div>
  `);
}

function base(css: string, body: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${body}</body></html>`;
}

function minimalCss(c: string): string {
  return `
    .og-container { width: 1200px; height: 630px; background: #0c0d12; padding: 80px; display: flex; flex-direction: column; justify-content: center; }
    .og-brand { font-size: 24px; color: ${c}; font-weight: 600; margin-bottom: 24px; letter-spacing: 0.05em; }
    h1 { font-size: 64px; font-weight: 700; line-height: 1.1; max-width: 1000px; }
    p { margin-top: 24px; font-size: 28px; color: rgba(255,255,255,0.7); line-height: 1.4; max-width: 900px; }
  `;
}

function gradientCss(c: string): string {
  return `
    .og-gradient { width: 1200px; height: 630px; background: #0c0d12; position: relative; overflow: hidden; padding: 80px; display: flex; align-items: center; }
    .og-content { position: relative; z-index: 2; }
    .og-brand { font-size: 24px; color: ${c}; font-weight: 700; margin-bottom: 24px; letter-spacing: 0.05em; }
    h1 { font-size: 72px; font-weight: 700; line-height: 1.05; max-width: 950px; background: linear-gradient(135deg, #fff 0%, ${c} 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
    p { margin-top: 32px; font-size: 30px; color: rgba(255,255,255,0.65); line-height: 1.4; max-width: 900px; }
    .og-glow { position: absolute; border-radius: 9999px; filter: blur(120px); opacity: 0.4; }
    .og-glow-1 { width: 600px; height: 600px; background: ${c}; top: -200px; left: -150px; }
    .og-glow-2 { width: 500px; height: 500px; background: #06b6d4; bottom: -200px; right: -100px; }
  `;
}

function cardCss(c: string): string {
  return `
    .og-bg { width: 1200px; height: 630px; background: linear-gradient(135deg, ${c} 0%, #0c0d12 100%); padding: 60px; display: flex; align-items: center; justify-content: center; }
    .og-card { width: 1080px; min-height: 510px; background: rgba(15,17,28,0.85); backdrop-filter: blur(20px); border-radius: 24px; padding: 60px; border: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; justify-content: center; }
    .og-brand { font-size: 22px; color: ${c}; font-weight: 600; margin-bottom: 20px; }
    h1 { font-size: 60px; font-weight: 700; line-height: 1.1; max-width: 950px; }
    p { margin-top: 24px; font-size: 26px; color: rgba(255,255,255,0.7); line-height: 1.4; }
  `;
}

function magazineCss(c: string): string {
  return `
    .og-mag { width: 1200px; height: 630px; display: flex; }
    .og-text { width: 700px; background: #0c0d12; padding: 80px 60px; display: flex; flex-direction: column; justify-content: center; border-left: 8px solid ${c}; }
    .og-img { width: 500px; background-size: cover; background-position: center; background-color: #1a1d2a; }
    .og-brand { font-size: 16px; color: ${c}; font-weight: 700; margin-bottom: 24px; letter-spacing: 0.15em; }
    h1 { font-size: 56px; font-weight: 700; line-height: 1.1; }
    p { margin-top: 24px; font-size: 24px; color: rgba(255,255,255,0.7); line-height: 1.4; }
  `;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
function escapeAttr(s: string): string {
  return s.replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
