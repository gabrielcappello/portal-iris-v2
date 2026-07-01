// scripts/shot.mjs
//
// Screenshot de uma URL do app rodando local — pra eu (Claude) conferir o
// resultado visual sem depender de print manual.
//
// Uso:
//   1. npm run dev            (com .env.local preenchido)
//   2. npx playwright install chromium   (uma vez)
//   3. node scripts/shot.mjs http://localhost:3000/dashboard/financeiro out.png
//
// Args: [url] [arquivo-saida] [--full] [--width=1280] [--height=800]

import { chromium } from "playwright";

const args = process.argv.slice(2);
const url = args.find(a => a.startsWith("http")) || "http://localhost:3000";
const out = args.find(a => a.endsWith(".png")) || "shot.png";
const full = args.includes("--full");
const width = Number((args.find(a => a.startsWith("--width=")) || "").split("=")[1]) || 1280;
const height = Number((args.find(a => a.startsWith("--height=")) || "").split("=")[1]) || 800;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height } });
await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(1200); // deixa os fetches/animações assentarem
await page.screenshot({ path: out, fullPage: full });
await browser.close();
console.log("screenshot salvo:", out);
