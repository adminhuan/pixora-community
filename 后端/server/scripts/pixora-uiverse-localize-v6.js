const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const CATEGORY_LABEL_MAP = {
  buttons: '按钮',
  cards: '卡片',
  forms: '表单',
  inputs: '输入框',
  notifications: '通知',
  alerts: '通知',
  patterns: '版式',
  toggles: '开关',
  toggleswitches: '开关',
  checkboxes: '复选框',
  radiobuttons: '单选框',
  tooltips: '提示',
  loaders: '加载动画',
  other: '通用'
};

const normalizeKey = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]/g, '');

const extractSourceName = (title) => {
  const text = String(title || '');

  const plusMatch = text.match(/^Uiverse Plus · ([^·]+) · (.+)$/);
  if (plusMatch) {
    return {
      rawCategory: plusMatch[1].trim(),
      rawName: plusMatch[2].trim()
    };
  }

  const baseMatch = text.match(/^Uiverse ([^·]+) · \d+ · (.+)$/);
  if (baseMatch) {
    return {
      rawCategory: baseMatch[1].trim(),
      rawName: baseMatch[2].trim()
    };
  }

  return {
    rawCategory: '',
    rawName: text
  };
};

const resolveCategoryLabel = (title, category) => {
  const source = extractSourceName(title);
  const sourceKey = normalizeKey(source.rawCategory);
  if (sourceKey && CATEGORY_LABEL_MAP[sourceKey]) {
    return CATEGORY_LABEL_MAP[sourceKey];
  }

  const categoryKey = normalizeKey(category);
  if (categoryKey && CATEGORY_LABEL_MAP[categoryKey]) {
    return CATEGORY_LABEL_MAP[categoryKey];
  }

  return CATEGORY_LABEL_MAP.other;
};

const buildDescription = (row, categoryLabel, sourceName) => {
  const originalName = sourceName || row.title;
  return `来自 Uiverse 的高质量${categoryLabel}组件，已完成配色与展示规范化。原始标识：${originalName}。`;
};

(async () => {
  const admin = await prisma.user.findFirst({
    where: { role: 'admin' },
    select: { id: true, username: true }
  });

  if (!admin) {
    throw new Error('未找到管理员账号');
  }

  const targetRows = await prisma.codeSnippet.findMany({
    where: {
      authorId: admin.id,
      type: 'component',
      visibility: 'public',
      OR: [{ title: { startsWith: 'Uiverse Plus · ' } }, { title: { startsWith: 'Uiverse ' } }]
    },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      likeCount: true,
      createdAt: true
    },
    orderBy: [{ likeCount: 'desc' }, { createdAt: 'asc' }]
  });

  if (!targetRows.length) {
    throw new Error('没有找到需要中文化的 Uiverse 组件数据');
  }

  const categoryCounter = new Map();
  const updatedPreview = [];

  for (const row of targetRows) {
    const source = extractSourceName(row.title);
    const categoryLabel = resolveCategoryLabel(row.title, row.category);
    const nextIndex = (categoryCounter.get(categoryLabel) || 0) + 1;
    categoryCounter.set(categoryLabel, nextIndex);

    const nextTitle = `${categoryLabel}灵感组件 ${String(nextIndex).padStart(3, '0')}`;
    const nextDescription = buildDescription(row, categoryLabel, source.rawName);

    await prisma.codeSnippet.update({
      where: { id: row.id },
      data: {
        title: nextTitle,
        description: nextDescription
      }
    });

    if (updatedPreview.length < 30) {
      updatedPreview.push({
        id: row.id,
        oldTitle: row.title,
        newTitle: nextTitle
      });
    }
  }

  const stats = Array.from(categoryCounter.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  console.log(
    JSON.stringify(
      {
        admin: admin.username,
        total: targetRows.length,
        categoryStats: stats,
        preview: updatedPreview
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
