import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const distDir = path.resolve(process.cwd(), 'dist');
const targetHost = String(process.env.SANITIZE_PUBLIC_HOST ?? 'pixora.vip').trim() || 'pixora.vip';
const targetOrigin = `https://${targetHost}`;
const textExt = new Set(['.js', '.css', '.html', '.map', '.txt']);

const replacementRules = [
  { pattern: /https?:\/\/localhost(?::\d+)?/gi, replacement: targetOrigin },
  { pattern: /https?:\/\/127\.0\.0\.1(?::\d+)?/gi, replacement: targetOrigin },
  { pattern: /\blocalhost\b/g, replacement: targetHost },
  { pattern: /\b127\.0\.0\.1\b/g, replacement: targetHost }
];

let changedFiles = 0;
let changedCount = 0;

const replaceAndCount = (input, pattern, replacement) => {
  const matches = input.match(pattern);
  if (!matches?.length) {
    return { output: input, count: 0 };
  }

  return {
    output: input.replace(pattern, replacement),
    count: matches.length
  };
};

const patchFile = async (filePath) => {
  const source = await readFile(filePath, 'utf8');
  let next = source;
  let fileChanges = 0;

  for (const rule of replacementRules) {
    const result = replaceAndCount(next, rule.pattern, rule.replacement);
    next = result.output;
    fileChanges += result.count;
  }

  if (!fileChanges) {
    return;
  }

  await writeFile(filePath, next, 'utf8');
  changedFiles += 1;
  changedCount += fileChanges;
};

const walk = async (dirPath) => {
  const entries = await readdir(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (!textExt.has(ext)) {
      continue;
    }

    await patchFile(fullPath);
  }
};

const ensureDistExists = async () => {
  const info = await stat(distDir).catch(() => null);
  if (!info || !info.isDirectory()) {
    throw new Error(`dist 目录不存在：${distDir}`);
  }
};

try {
  await ensureDistExists();
  await walk(distDir);
  console.log(`[sanitize-hosts] host=${targetHost}, files=${changedFiles}, replacements=${changedCount}`);
} catch (error) {
  console.error('[sanitize-hosts] 失败', error);
  process.exit(1);
}
