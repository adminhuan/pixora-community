const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const UIVERSE_REPO = 'https://github.com/uiverse-io/galaxy.git';
const UIVERSE_LOCAL_PATH = '/tmp/uiverse-galaxy';
const FEATURED_COUNT = 72;

const SOURCE_CONFIG = [
  { dir: 'Buttons', category: 'buttons', limit: 42 },
  { dir: 'Cards', category: 'cards', limit: 36 },
  { dir: 'Forms', category: 'forms', limit: 26 },
  { dir: 'Inputs', category: 'inputs', limit: 24 },
  { dir: 'Notifications', category: 'alerts', limit: 18 },
  { dir: 'Patterns', category: 'patterns', limit: 24 },
  { dir: 'Toggle-switches', category: 'toggles', limit: 24 },
  { dir: 'Checkboxes', category: 'checkboxes', limit: 18 },
  { dir: 'Radio-buttons', category: 'other', limit: 16 },
  { dir: 'Tooltips', category: 'other', limit: 18 },
  { dir: 'loaders', category: 'loaders', limit: 24 }
];

const HEX_REGEX = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g;
const RGB_REGEX = /rgba?\(([^)]+)\)/g;
const HSL_REGEX = /hsla?\(([^)]+)\)/g;
const STYLE_BLOCK_REGEX = /<style[^>]*>([\s\S]*?)<\/style>/gi;
const SCRIPT_BLOCK_REGEX = /<script[^>]*>([\s\S]*?)<\/script>/gi;

const toSlug = (value) =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const normalizeHex = (hex) => {
  if (!hex.startsWith('#')) return hex;
  if (hex.length === 4) {
    return (
      '#' +
      hex
        .slice(1)
        .split('')
        .map((char) => char + char)
        .join('')
    ).toUpperCase();
  }
  return hex.toUpperCase();
};

const hexToRgb = (hex) => {
  const n = normalizeHex(hex).replace('#', '');
  if (n.length !== 6) return null;
  const r = Number.parseInt(n.slice(0, 2), 16);
  const g = Number.parseInt(n.slice(2, 4), 16);
  const b = Number.parseInt(n.slice(4, 6), 16);
  if ([r, g, b].some((v) => Number.isNaN(v))) return null;
  return { r, g, b };
};

const rgbToHue = (r, g, b) => {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  if (delta === 0) return 0;

  let hue = 0;
  if (max === rn) {
    hue = ((gn - bn) / delta) % 6;
  } else if (max === gn) {
    hue = (bn - rn) / delta + 2;
  } else {
    hue = (rn - gn) / delta + 4;
  }

  const normalized = Math.round(hue * 60);
  return normalized < 0 ? normalized + 360 : normalized;
};

const isPurpleLike = (r, g, b) => {
  const hue = rgbToHue(r, g, b);
  const inPurpleHue = hue >= 250 && hue <= 320;
  const brightEnough = r >= 72 || b >= 72;
  return inPurpleHue && brightEnough;
};

const purpleToSafeBlueHex = (hex) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const { r, g, b } = rgb;
  if (!isPurpleLike(r, g, b)) return hex;

  const lightness = (r + g + b) / 3;
  if (lightness > 180) return '#38BDF8';
  if (lightness > 110) return '#0EA5E9';
  return '#0369A1';
};

const sanitizeRgbCall = (raw) => {
  const match = raw.match(/^rgba?\(([^)]+)\)$/i);
  if (!match) return raw;
  const chunks = match[1].split(',').map((item) => item.trim());
  if (chunks.length < 3) return raw;

  const r = Number.parseFloat(chunks[0]);
  const g = Number.parseFloat(chunks[1]);
  const b = Number.parseFloat(chunks[2]);
  if ([r, g, b].some((v) => Number.isNaN(v))) return raw;
  if (!isPurpleLike(r, g, b)) return raw;

  if (chunks.length === 4) {
    const alpha = Number.parseFloat(chunks[3]);
    const a = Number.isNaN(alpha) ? 1 : alpha;
    return `rgba(14,165,233,${a})`;
  }
  return 'rgb(14,165,233)';
};

const sanitizeHslCall = (raw) => {
  const match = raw.match(/^hsla?\(([^)]+)\)$/i);
  if (!match) return raw;
  const chunks = match[1].split(',').map((item) => item.trim());
  if (chunks.length < 3) return raw;

  const hue = Number.parseFloat(chunks[0]);
  if (Number.isNaN(hue)) return raw;

  const normalizedHue = ((hue % 360) + 360) % 360;
  const isPurpleHue = normalizedHue >= 250 && normalizedHue <= 320;
  if (!isPurpleHue) return raw;

  const newHue = 198;
  if (chunks.length === 4) {
    return `hsla(${newHue},${chunks[1]},${chunks[2]},${chunks[3]})`;
  }
  return `hsl(${newHue},${chunks[1]},${chunks[2]})`;
};

const sanitizeColors = (text) => {
  if (!text) return text;

  let result = text;
  result = result.replace(HEX_REGEX, (token) => purpleToSafeBlueHex(token));
  result = result.replace(RGB_REGEX, (token) => sanitizeRgbCall(token));
  result = result.replace(HSL_REGEX, (token) => sanitizeHslCall(token));
  result = result.replace(/\b(purple|violet|indigo)\b/gi, '#0EA5E9');
  return result;
};

const extractInline = (raw) => {
  const cssList = [];
  const jsList = [];

  const htmlWithoutStyle = raw.replace(STYLE_BLOCK_REGEX, (_, css) => {
    cssList.push(css);
    return '';
  });

  const htmlWithoutScript = htmlWithoutStyle.replace(SCRIPT_BLOCK_REGEX, (_, js) => {
    jsList.push(js);
    return '';
  });

  return {
    html: htmlWithoutScript.trim(),
    css: cssList.join('\n\n').trim(),
    js: jsList.join('\n\n').trim()
  };
};

const qualityScore = (raw, css, js) => {
  const text = `${raw}\n${css}\n${js}`;
  let score = 0;
  if (/backdrop-filter/i.test(text)) score += 10;
  if (/linear-gradient|radial-gradient|conic-gradient/i.test(text)) score += 8;
  if (/animation|@keyframes/i.test(text)) score += 6;
  if (/box-shadow/i.test(text)) score += 4;
  if (/transition/i.test(text)) score += 4;
  if (/transform/i.test(text)) score += 3;
  if (/clip-path/i.test(text)) score += 2;
  if (/filter:/i.test(text)) score += 2;
  if (/display\s*:\s*grid/i.test(text)) score += 2;
  if (/display\s*:\s*flex/i.test(text)) score += 2;
  if (/addEventListener|onclick|onchange|oninput/i.test(text)) score += 2;
  if (css.length > 600 && css.length < 9000) score += 3;
  if (raw.length > 300 && raw.length < 20000) score += 2;
  if (/https?:\/\//i.test(text)) score -= 2;
  return score;
};

const parseTagsAndAuthor = (raw, fallbackTag) => {
  const authorMatch = raw.match(/From\s+Uiverse\.io\s+by\s+([^\s*-/]+)/i);
  const tagsMatch = raw.match(/Tags:\s*([^\n*]+)/i);
  const author = authorMatch ? authorMatch[1].trim() : 'pixora';

  const tags = new Set(['pixora', 'imported', fallbackTag]);
  if (tagsMatch) {
    tagsMatch[1]
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 10)
      .forEach((item) => tags.add(item));
  }

  return { author, tags: Array.from(tags) };
};

const ensureUiverseRepo = () => {
  if (!fs.existsSync(UIVERSE_LOCAL_PATH)) {
    execSync(`git clone --depth 1 ${UIVERSE_REPO} ${UIVERSE_LOCAL_PATH}`, { stdio: 'inherit' });
    return;
  }

  execSync(`git -C ${UIVERSE_LOCAL_PATH} fetch --depth 1 origin main`, { stdio: 'inherit' });
  execSync(`git -C ${UIVERSE_LOCAL_PATH} reset --hard origin/main`, { stdio: 'inherit' });
};

const parseBaseNameFromTitle = (title) => {
  const parts = String(title).split(' · ');
  if (parts.length < 3) return '';
  return parts[parts.length - 1].trim();
};

const normalizeSnippetText = (text) => String(text ?? '').replace(/\r\n/g, '\n').trim();

const buildFingerprintFromFiles = (files) => {
  const hash = crypto.createHash('sha1');
  files
    .slice()
    .sort((a, b) => a.filename.localeCompare(b.filename))
    .forEach((file) => {
      hash.update(`${file.filename}\n${normalizeSnippetText(file.content)}\n---\n`);
    });
  return hash.digest('hex');
};

const collectCandidates = (usedBaseNames) => {
  const selected = [];

  SOURCE_CONFIG.forEach(({ dir, category, limit }) => {
    const folder = path.join(UIVERSE_LOCAL_PATH, dir);
    if (!fs.existsSync(folder)) return;

    const rows = fs
      .readdirSync(folder)
      .filter((name) => name.endsWith('.html'))
      .map((filename) => {
        const fullPath = path.join(folder, filename);
        const raw = fs.readFileSync(fullPath, 'utf8');
        const baseName = filename.replace(/\.html$/, '');
        if (usedBaseNames.has(baseName)) return null;

        const inline = extractInline(raw);
        if (!inline.html) return null;
        if (raw.length > 24000) return null;

        const safeHtml = sanitizeColors(inline.html);
        const safeCss = sanitizeColors(inline.css);
        const safeJs = sanitizeColors(inline.js);
        const safeRaw = sanitizeColors(raw);
        const { author, tags } = parseTagsAndAuthor(raw, category);

        return {
          dir,
          category,
          baseName,
          author,
          tags,
          html: safeHtml,
          css: safeCss,
          js: safeJs,
          score: qualityScore(safeRaw, safeCss, safeJs)
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score || a.baseName.localeCompare(b.baseName))
      .slice(0, limit);

    selected.push(...rows);
  });

  return selected;
};

const interleaveByCategory = (rows) => {
  const categoryOrder = Array.from(new Set(SOURCE_CONFIG.map((item) => item.category)));
  const group = new Map();
  categoryOrder.forEach((category) => group.set(category, []));

  rows.forEach((row) => {
    if (!group.has(row.category)) group.set(row.category, []);
    group.get(row.category).push(row);
  });

  for (const [key, value] of group.entries()) {
    value.sort((a, b) => b.score - a.score || a.baseName.localeCompare(b.baseName));
    group.set(key, value);
  }

  const output = [];
  let hasMore = true;
  while (hasMore) {
    hasMore = false;
    for (const category of categoryOrder) {
      const bucket = group.get(category) || [];
      if (bucket.length) {
        output.push(bucket.shift());
        hasMore = true;
      }
    }
  }

  return output;
};

const buildFiles = (row) => {
  const files = [];
  let htmlContent = row.html;

  if (row.js && !/<script\b/i.test(htmlContent)) {
    htmlContent = `${htmlContent}\n<script src="./script.js"></script>`;
  }

  files.push({ filename: 'index.html', language: 'html', content: htmlContent });
  if (row.css) files.push({ filename: 'style.css', language: 'css', content: row.css });
  if (row.js) files.push({ filename: 'script.js', language: 'javascript', content: row.js });

  return files;
};

const buildTitle = (row) => `Pixora 灵感 · ${row.dir.replace(/-/g, ' ')} · ${row.baseName}`;

const buildDescription = (row) =>
  `精选自开源组件社区（MIT）并完成配色规范清洗。分类：${row.dir}，来源作者：${row.author}。`;

(async () => {
  ensureUiverseRepo();

  const admin = await prisma.user.findFirst({
    where: { role: 'admin' },
    select: { id: true, username: true }
  });
  if (!admin) throw new Error('未找到管理员账号');

  const existingSnippets = await prisma.codeSnippet.findMany({
    where: {
      type: 'component',
      visibility: 'public',
      authorId: admin.id
    },
    select: {
      title: true,
      files: {
        select: {
          filename: true,
          content: true
        }
      }
    }
  });

  const usedBaseNames = new Set(
    existingSnippets.map((item) => parseBaseNameFromTitle(item.title)).filter(Boolean)
  );
  const existingFingerprints = new Set(
    existingSnippets
      .filter((item) => Array.isArray(item.files) && item.files.length > 0)
      .map((item) => buildFingerprintFromFiles(item.files))
  );
  const candidates = collectCandidates(usedBaseNames);
  if (!candidates.length) throw new Error('没有可新增的组件候选');

  const ordered = interleaveByCategory(candidates);
  const targetCount = Number.parseInt(String(process.env.TARGET_COUNT ?? ''), 10);
  const importQueue = Number.isFinite(targetCount) && targetCount > 0 ? ordered.slice(0, targetCount) : ordered;

  await prisma.codeSnippet.updateMany({
    where: {
      type: 'component',
      visibility: 'public',
      authorId: admin.id,
      isFeatured: true
    },
    data: { isFeatured: false }
  });

  const tagCache = new Map();
  let created = 0;
  let updated = 0;
  let skipped = 0;
  let skippedByFingerprint = 0;
  const categoryStats = {};

  for (let index = 0; index < importQueue.length; index += 1) {
    const row = importQueue[index];
    const title = buildTitle(row);
    const description = buildDescription(row);
    const files = buildFiles(row);
    const fingerprint = buildFingerprintFromFiles(files);
    const likeCount = 1300 - index;
    const viewCount = 21000 - index * 29;

    if (existingFingerprints.has(fingerprint)) {
      skipped += 1;
      skippedByFingerprint += 1;
      continue;
    }

    const tagCreates = [];
    const snippetTagSlugs = new Set();

    for (const tagName of row.tags) {
      const slug = toSlug(tagName);
      if (!slug || snippetTagSlugs.has(slug)) continue;
      snippetTagSlugs.add(slug);

      let tagId = tagCache.get(slug);
      if (!tagId) {
        const tag = await prisma.tag.upsert({
          where: { slug },
          update: { name: tagName },
          create: { name: tagName, slug },
          select: { id: true }
        });
        tagId = tag.id;
        tagCache.set(slug, tagId);
      }

      tagCreates.push({ tag: { connect: { id: tagId } } });
    }

    const exists = await prisma.codeSnippet.findFirst({
      where: { title, type: 'component', authorId: admin.id },
      select: { id: true }
    });

    if (exists) {
      await prisma.codeSnippet.update({
        where: { id: exists.id },
        data: {
          description,
          category: row.category,
          framework: 'css',
          isFeatured: index < FEATURED_COUNT,
          isRecommended: index % 2 === 0,
          likeCount,
          viewCount,
          favoriteCount: 280 - (index % 44),
          forkCount: 62 - (index % 18),
          commentCount: 32 - (index % 10),
          files: { deleteMany: {}, create: files },
          tags: { deleteMany: {}, create: tagCreates }
        }
      });
      updated += 1;
      skipped += 1;
      existingFingerprints.add(fingerprint);
    } else {
      await prisma.codeSnippet.create({
        data: {
          title,
          description,
          authorId: admin.id,
          visibility: 'public',
          type: 'component',
          category: row.category,
          framework: 'css',
          likeCount,
          viewCount,
          favoriteCount: 280 - (index % 44),
          forkCount: 62 - (index % 18),
          commentCount: 32 - (index % 10),
          isRecommended: index % 2 === 0,
          isFeatured: index < FEATURED_COUNT,
          files: { create: files },
          tags: { create: tagCreates }
        }
      });
      created += 1;
      for (const slug of snippetTagSlugs) {
        await prisma.tag.update({
          where: { slug },
          data: { usageCount: { increment: 1 } }
        });
      }
      existingFingerprints.add(fingerprint);
    }

    categoryStats[row.category] = (categoryStats[row.category] || 0) + 1;
  }

  const total = await prisma.codeSnippet.count({
    where: { type: 'component', visibility: 'public' }
  });

  const popular = await prisma.codeSnippet.findMany({
    where: { type: 'component', visibility: 'public' },
    select: {
      title: true,
      category: true,
      framework: true,
      likeCount: true,
      viewCount: true,
      isFeatured: true
    },
    orderBy: [{ likeCount: 'desc' }, { viewCount: 'desc' }],
    take: 20
  });

  const featured = await prisma.codeSnippet.findMany({
    where: { type: 'component', visibility: 'public', isFeatured: true },
    select: { title: true, category: true, framework: true, likeCount: true },
    orderBy: [{ likeCount: 'desc' }, { viewCount: 'desc' }],
    take: 20
  });

  console.log(
    JSON.stringify(
      {
        admin: admin.username,
        source: 'uiverse-io/galaxy',
        mode: 'pixora-diverse-batch',
        prepared: ordered.length,
        queued: importQueue.length,
        created,
        updated,
        skipped,
        skippedByFingerprint,
        categoryStats,
        total,
        popular,
        featured
      },
      null,
      2
    )
  );
})()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
