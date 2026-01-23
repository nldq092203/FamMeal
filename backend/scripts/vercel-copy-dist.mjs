import fs from "fs";
import path from "path";

function rmDir(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

const root = process.cwd(); // backend/
const dist = path.join(root, "dist");
const target = path.join(root, "api", "_dist");

if (!fs.existsSync(dist)) {
  throw new Error(`dist/ not found at ${dist}. Did tsc run?`);
}

rmDir(target);
copyDir(dist, target);

console.log("✅ Copied dist -> api/_dist");
console.log("✅ api/_dist contains:", fs.readdirSync(target).slice(0, 50));
