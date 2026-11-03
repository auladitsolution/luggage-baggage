import fs from "fs";
import path from "path";

const appDir = path.resolve("src/app");
const targets = [
  path.resolve(".next/static/chunks/app"),
  path.resolve(".next/server/app"),
  path.resolve(".next/types/app"),
];

for (const t of targets) {
  if (!fs.existsSync(t)) {
    fs.mkdirSync(t, { recursive: true });
  }
}

function mirror(currentDir) {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const fullPath = path.join(currentDir, entry.name);
      const relative = path.relative(appDir, fullPath);
      // Clean relative without route groups like (storefront), (management), (pos)
      const cleanRelative = relative.replace(/\([^)]+\)[\\/]?/g, "");

      for (const target of targets) {
        const dest1 = path.join(target, relative);
        if (!fs.existsSync(dest1)) {
          fs.mkdirSync(dest1, { recursive: true });
        }
        if (cleanRelative) {
          const dest2 = path.join(target, cleanRelative);
          if (!fs.existsSync(dest2)) {
            fs.mkdirSync(dest2, { recursive: true });
          }
        }
      }

      mirror(fullPath);
    }
  }
}

mirror(appDir);
console.log("All directory structures mirrored into .next successfully.");
