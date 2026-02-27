const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const UIVERSE_REPO = 'https://github.com/uiverse-io/galaxy.git';
const UIVERSE_LOCAL_PATH = '/tmp/uiverse-galaxy';

const SOURCE_CONFIG = [
  { dir: 'Buttons', category: 'buttons', limit: 14 },
  { dir: 'Cards', category: 'cards', limit: 14 },
  { dir: 'Forms', category: 'forms', limit: 8 },
  { dir: 'Inputs', category: 'inputs', limit: 8 },
  { dir: 'Notifications', category: 'alerts', limit: 6 },
  { dir: 'Patterns', category: 'patterns', limit: 8 },
  { dir: 'Toggle-switches', category: 'toggles', limit: 8 },
  { dir: 'Checkboxes', category: 'checkboxes', limit: 6 },
  { dir: 'Radio-buttons', category: 'other', limit: 4 },
  { dir: 'Tooltips', category: 'other', limit: 4 },
  { dir: 'loaders', category: 'loaders', limit: 10 }
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
        .map((ch) => ch + ch)
        .join('')
    ).toUpperCase();
  }
  return hex.toUpperCase();
};

const hexToRgb = (hex) => {
  const n = normalizeHex(hex).replace('#', '');
  if (n.length !== 6) return null;
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
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

  result = result.replace(HEX_REGEX, (token) => {
    return purpleToSafeBlueHex(token);
  });

  result = result.replace(RGB_REGEX, (token) => sanitizeRgbCall(token));
  result = result.replace(HSL_REGEX, (token) => sanitizeHslCall(token));

  result = result.replace(/\b(purple|violet|indigo)\b/gi, '#0EA5E9');

  return result;
};

const extractInline = (raw) => {
  const styleList = [];
  const scriptList = [];

  const styleless = raw.replace(STYLE_BLOCK_REGEX, (_, css) => {
    styleList.push(css);
    return '';
  });

  const htmlless = styleless.replace(SCRIPT_BLOCK_REGEX, (_, script) => {
    scriptList.push(script);
    return '';
  });

  return {
    html: htmlless.trim(),
    css: styleList.join('\n\n').trim(),
    js: scriptList.join('\n\n').trim()
  };
};

const qualityScore = (raw, css, js) => {
  let score = 0;
  const base = `${raw}\n${css}\n${js}`;
  if (/backdrop-filter/i.test(base)) score += 10;
  if (/linear-gradient|radial-gradient|conic-gradient/i.test(base)) score += 8;
  if (/animation|@keyframes/i.test(base)) score += 6;
  if (/box-shadow/i.test(base)) score += 4;
  if (/transition/i.test(base)) score += 4;
  if (/transform/i.test(base)) score += 3;
  if (/clip-path/i.test(base)) score += 2;
  if (/filter:/i.test(base)) score += 2;
  if (/display\s*:\s*grid/i.test(base)) score += 2;
  if (/display\s*:\s*flex/i.test(base)) score += 2;
  if (/addEventListener|onclick|onchange|oninput/i.test(base)) score += 2;
  if (css.length > 600 && css.length < 9000) score += 3;
  if (raw.length > 300 && raw.length < 20000) score += 2;
  if (/https?:\/\//i.test(base)) score -= 3;
  return score;
};

const parseTagsAndAuthor = (raw, fallbackTag) => {
  const authorMatch = raw.match(/From\s+Uiverse\.io\s+by\s+([^\s*-/]+)/i);
  const tagsMatch = raw.match(/Tags:\s*([^\n*]+)/i);
  const author = authorMatch ? authorMatch[1].trim() : 'uiverse';
  const tags = new Set(['uiverse', 'imported', fallbackTag]);
  if (tagsMatch) {
    tagsMatch[1]
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 8)
      .forEach((item) => tags.add(item.toLowerCase()));
  }
  tags.add(`by-${author.toLowerCase()}`);
  return { author, tags: Array.from(tags) };
};

const ensureUiverseRepo = () => {
  if (!fs.existsSync(UIVERSE_LOCAL_PATH)) {
    execSync(`git clone --depth 1 ${UIVERSE_REPO} ${UIVERSE_LOCAL_PATH}`, {
      stdio: 'inherit'
    });
    return;
  }

  execSync(`git -C ${UIVERSE_LOCAL_PATH} fetch --depth 1 origin main`, {
    stdio: 'inherit'
  });
  execSync(`git -C ${UIVERSE_LOCAL_PATH} reset --hard origin/main`, {
    stdio: 'inherit'
  });
};

const collectCandidates = () => {
  const all = [];

  SOURCE_CONFIG.forEach(({ dir, category, limit }) => {
    const folder = path.join(UIVERSE_LOCAL_PATH, dir);
    if (!fs.existsSync(folder)) return;

    const files = fs
      .readdirSync(folder)
      .filter((name) => name.endsWith('.html'))
      .map((name) => path.join(folder, name));

    const rows = [];
    files.forEach((absPath) => {
      const raw = fs.readFileSync(absPath, 'utf8');
      const inline = extractInline(raw);

      if (!inline.html) return;
      if (raw.length > 24000) return;

      const safeHtml = sanitizeColors(inline.html);
      const safeCss = sanitizeColors(inline.css);
      const safeJs = sanitizeColors(inline.js);
      const safeRaw = sanitizeColors(raw);

      const score = qualityScore(safeRaw, safeCss, safeJs);
      const filename = path.basename(absPath);
      const baseName = filename.replace(/\.html$/, '');
      const { author, tags } = parseTagsAndAuthor(raw, category);

      rows.push({
        dir,
        category,
        limit,
        filename,
        baseName,
        author,
        tags,
        score,
        html: safeHtml,
        css: safeCss,
        js: safeJs
      });
    });

    rows.sort((a, b) => b.score - a.score || a.filename.localeCompare(b.filename));
    all.push(...rows.slice(0, limit));
  });

  return all;
};

const makeTitle = (row, index) => {
  const cleanDir = row.dir.replace(/-/g, ' ');
  return `Uiverse ${cleanDir} · ${String(index + 1).padStart(3, '0')} · ${row.baseName}`;
};

const makeDescription = (row) =>
  `来自 Uiverse 的精选 ${row.dir} 组件（MIT），已完成配色清洗与内容规范化。作者：${row.author}`;

const buildFiles = (row) => {
  const files = [];
  let htmlContent = row.html;

  if (row.js && !/<script\b/i.test(htmlContent)) {
    htmlContent = `${htmlContent}\n<script src="./script.js"></script>`;
  }

  files.push({
    filename: 'index.html',
    language: 'html',
    content: htmlContent
  });

  if (row.css) {
    files.push({
      filename: 'style.css',
      language: 'css',
      content: row.css
    });
  }

  if (row.js) {
    files.push({
      filename: 'script.js',
      language: 'javascript',
      content: row.js
    });
  }

  return files;
};

(async () => {
  ensureUiverseRepo();

  const admin = await prisma.user.findFirst({
    where: { role: 'admin' },
    select: { id: true, username: true }
  });

  if (!admin) {
    throw new Error('未找到管理员账号');
  }

  const candidates = collectCandidates();
  if (!candidates.length) {
    throw new Error('未获取到 Uiverse 组件候选数据');
  }

  candidates.sort((a, b) => b.score - a.score || a.filename.localeCompare(b.filename));

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

  for (let index = 0; index < candidates.length; index += 1) {
    const row = candidates[index];
    const title = makeTitle(row, index);
    const description = makeDescription(row);
    const files = buildFiles(row);
    const likeCount = 980 - index;
    const viewCount = 16000 - index * 31;

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
      where: {
        title,
        type: 'component',
        authorId: admin.id
      },
      select: { id: true }
    });

    if (exists) {
      await prisma.codeSnippet.update({
        where: { id: exists.id },
        data: {
          description,
          category: row.category,
          framework: 'css',
          isFeatured: index < 36,
          isRecommended: index % 2 === 0,
          likeCount,
          viewCount,
          favoriteCount: 220 - (index % 40),
          forkCount: 46 - (index % 16),
          commentCount: 28 - (index % 10),
          files: { deleteMany: {}, create: files },
          tags: { deleteMany: {}, create: tagCreates }
        }
      });
      updated += 1;
      skipped += 1;
      continue;
    }

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
        favoriteCount: 220 - (index % 40),
        forkCount: 46 - (index % 16),
        commentCount: 28 - (index % 10),
        isRecommended: index % 2 === 0,
        isFeatured: index < 36,
        files: { create: files },
        tags: { create: tagCreates }
      }
    });

    for (const slug of snippetTagSlugs) {
      await prisma.tag.update({
        where: { slug },
        data: { usageCount: { increment: 1 } }
      });
    }

    created += 1;
  }

  const total = await prisma.codeSnippet.count({
    where: { type: 'component', visibility: 'public' }
  });

  const popular = await prisma.codeSnippet.findMany({
    where: { type: 'component', visibility: 'public' },
    select: {
      title: true,
      framework: true,
      category: true,
      likeCount: true,
      viewCount: true,
      isFeatured: true
    },
    orderBy: [{ likeCount: 'desc' }, { viewCount: 'desc' }],
    take: 16
  });

  const featured = await prisma.codeSnippet.findMany({
    where: { type: 'component', visibility: 'public', isFeatured: true },
    select: { title: true, category: true, likeCount: true, framework: true },
    orderBy: [{ likeCount: 'desc' }, { viewCount: 'desc' }],
    take: 16
  });

  console.log(
    JSON.stringify(
      {
        admin: admin.username,
        source: 'uiverse-io/galaxy',
        prepared: candidates.length,
        created,
        updated,
        skipped,
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
