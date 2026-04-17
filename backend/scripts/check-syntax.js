const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = path.join(__dirname, "..", "src");

function collectJsFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectJsFiles(fullPath));
      continue;
    }

    if (entry.isFile() && fullPath.endsWith(".js")) {
      files.push(fullPath);
    }
  }

  return files;
}

function checkFileSyntax(filePath) {
  const result = spawnSync(process.execPath, ["--check", filePath], {
    stdio: "inherit",
  });

  return result.status === 0;
}

function main() {
  if (!fs.existsSync(rootDir)) {
    console.error(`Source directory not found: ${rootDir}`);
    process.exit(1);
  }

  const jsFiles = collectJsFiles(rootDir);

  if (jsFiles.length === 0) {
    console.log("No JavaScript files found under src.");
    return;
  }

  let failed = 0;

  for (const file of jsFiles) {
    const ok = checkFileSyntax(file);
    if (!ok) {
      failed += 1;
    }
  }

  if (failed > 0) {
    console.error(`Syntax check failed for ${failed} file(s).`);
    process.exit(1);
  }

  console.log(`Syntax check passed for ${jsFiles.length} file(s).`);
}

main();
