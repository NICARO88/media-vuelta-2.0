// audit.js — Playwright spacing audit for Media Vuelta
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:5500';

const PAGES = [
  { name: 'home',            url: `${BASE}/index.html` },
  { name: 'quienes-somos',   url: `${BASE}/quienes-somos/index.html` },
  { name: 'que-hacemos',     url: `${BASE}/que-hacemos/index.html` },
  { name: 'por-que-elegirnos', url: `${BASE}/por-que-elegirnos/index.html` },
  { name: 'proyectos',       url: `${BASE}/proyectos/index.html` },
  { name: 'contacto',        url: `${BASE}/contacto/index.html` },
];

const VIEWPORTS = [
  { name: '320x720',   width: 320,  height: 720  },
  { name: '375x812',   width: 375,  height: 812  },
  { name: '430x932',   width: 430,  height: 932  },
  { name: '768x1024',  width: 768,  height: 1024 },
  { name: '1024x768',  width: 1024, height: 768  },
  { name: '1280x800',  width: 1280, height: 800  },
  { name: '1440x900',  width: 1440, height: 900  },
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: '2560x1440', width: 2560, height: 1440 },
];

// Sections to measure per page
const SECTION_SELECTORS = {
  home: [
    { id: 'hero',      sel: '.hero' },
    { id: 'quienes',   sel: '.quienes' },
    { id: 'statement', sel: '.statement' },
    { id: 'hacemos',   sel: '.hacemos' },
    { id: 'proyectos', sel: '.proyectos' },
    { id: 'contacto',  sel: '.contacto' },
  ],
  'quienes-somos': [
    { id: 'hero',      sel: '.qs-hero' },
    { id: 'quienes',   sel: '.qs-quienes' },
    { id: 'statement', sel: '.qs-statement' },
    { id: 'valores',   sel: '.qs-valores' },
  ],
  'que-hacemos': [
    { id: 'hero',      sel: '.qh-hero' },
    { id: 'statement', sel: '.qh-statement' },
    { id: 'servicios', sel: '.qh-servicios' },
  ],
  'por-que-elegirnos': [
    { id: 'hero',      sel: '.pe-hero' },
    { id: 'statement', sel: '.pe-statement' },
  ],
  proyectos: [
    { id: 'hero',      sel: '.pr-hero' },
    { id: 'statement', sel: '.pr-statement' },
  ],
  contacto: [
    { id: 'hero',      sel: '.ct-hero' },
    { id: 'contacto',  sel: '.ct-contacto' },
  ],
};

// Title/heading selectors to measure within each section
const HEADING_SELECTORS = [
  'h1', 'h2', '.statement__titulo', '.qs-statement__titulo',
  '.qh-statement__titulo', '.pe-statement__titulo', '.pr-statement__titulo',
  '.hero__titulo', '.qs-hero__titulo', '.qh-hero__titulo',
  '.pe-hero__titulo', '.pr-hero__titulo', '.ct-hero__titulo',
];

async function measureElement(page, sel) {
  try {
    const el = page.locator(sel).first();
    const count = await el.count();
    if (count === 0) return null;
    const box = await el.boundingBox();
    return box;
  } catch { return null; }
}

async function run() {
  const auditDir = path.join(__dirname, 'playwright-audit');
  if (!fs.existsSync(auditDir)) fs.mkdirSync(auditDir);

  const report = {};
  const problems = [];

  const browser = await chromium.launch();

  for (const pageInfo of PAGES) {
    console.log(`\n📄 ${pageInfo.name}`);
    report[pageInfo.name] = {};

    const sections = SECTION_SELECTORS[pageInfo.name] || [];

    for (const vp of VIEWPORTS) {
      console.log(`   📐 ${vp.name}`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
      });
      const pw = await context.newPage();
      await pw.goto(pageInfo.url, { waitUntil: 'networkidle' });
      await pw.waitForTimeout(300);

      // Full-page screenshot
      const vpDir = path.join(auditDir, pageInfo.name, vp.name);
      fs.mkdirSync(vpDir, { recursive: true });
      await pw.screenshot({
        fullPage: true,
        path: path.join(vpDir, 'full.png'),
        type: 'png',
      });

      // Per-section measurements + screenshots
      const vpData = {};
      for (const sec of sections) {
        const secBox = await measureElement(pw, sec.sel);
        if (!secBox) continue;

        // Screenshot of section
        try {
          await pw.locator(sec.sel).first().screenshot({
            path: path.join(vpDir, `${sec.id}.png`),
            type: 'png',
          });
        } catch {}

        // Find heading inside section
        let headingBox = null;
        for (const hSel of HEADING_SELECTORS) {
          const combined = `${sec.sel} ${hSel}`;
          const hBox = await measureElement(pw, combined);
          if (hBox) { headingBox = hBox; break; }
        }

        if (headingBox) {
          const spaceAbove = headingBox.y - secBox.y;
          const spaceBelow = (secBox.y + secBox.height) - (headingBox.y + headingBox.height);
          const ratio = spaceBelow > 0 ? +(spaceAbove / spaceBelow).toFixed(2) : null;
          const isProblem = ratio !== null && (ratio < 0.6 || ratio > 1.8);

          vpData[sec.id] = { spaceAbove, spaceBelow, ratio, isProblem };

          if (isProblem) {
            problems.push({
              page: pageInfo.name,
              viewport: vp.name,
              section: sec.id,
              spaceAbove: +spaceAbove.toFixed(0),
              spaceBelow: +spaceBelow.toFixed(0),
              ratio,
            });
          }
        } else {
          vpData[sec.id] = { noHeading: true, sectionHeight: +secBox.height.toFixed(0) };
        }
      }

      report[pageInfo.name][vp.name] = vpData;
      await context.close();
    }
  }

  await browser.close();

  // Save report
  fs.writeFileSync(
    path.join(auditDir, 'report.json'),
    JSON.stringify(report, null, 2)
  );

  // Sort problems by severity
  problems.sort((a, b) => {
    const aScore = Math.abs(Math.log(a.ratio || 1));
    const bScore = Math.abs(Math.log(b.ratio || 1));
    return bScore - aScore;
  });

  fs.writeFileSync(
    path.join(auditDir, 'problems.json'),
    JSON.stringify(problems, null, 2)
  );

  console.log(`\n✅ Done. ${problems.length} problems found.`);
  console.log(`📁 Screenshots → playwright-audit/`);
  console.log(`📊 Report      → playwright-audit/report.json`);
  console.log(`🚨 Problems    → playwright-audit/problems.json`);

  // Print top 10 problems
  console.log('\n🔴 TOP 10 PROBLEMS:');
  problems.slice(0, 10).forEach((p, i) => {
    console.log(`  ${i + 1}. [${p.page}] ${p.section} @ ${p.viewport} — ratio ${p.ratio} (↑${p.spaceAbove}px ↓${p.spaceBelow}px)`);
  });
}

run().catch(console.error);
