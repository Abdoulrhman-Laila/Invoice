/**
 * يحمّل .env من جذر المشروع ثم من مجلد العمل الحالي (الأخير يطابق سلوك dotenv الافتراضي).
 * استدعِ هذا الملف أولاً من server.js قبل أي كود يقرأ process.env.
 */
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const projectRoot = path.resolve(__dirname, "..", "..");

const paths = [
  path.join(projectRoot, ".env"),
  path.join(process.cwd(), ".env"),
];

const seen = new Set();
for (const envPath of paths) {
  const resolved = path.resolve(envPath);
  if (!seen.has(resolved) && fs.existsSync(resolved)) {
    dotenv.config({ path: resolved, override: true });
    seen.add(resolved);
  }
}
