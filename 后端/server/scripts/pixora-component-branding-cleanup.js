const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const sanitizeSnippetContent = (content) => {
  let next = String(content ?? '');
  next = next.replace(/Uiverse\.io/gi, 'Pixora.vip');
  next = next.replace(/From\s+Uiverse/gi, 'From Pixora Community');
  next = next.replace(/uiverse-io\/galaxy/gi, 'pixora-community/components');
  next = next.replace(/twitter\.com\/uiverse_io/gi, 'pixora.vip');
  next = next.replace(/\bUIVERSE\b/g, 'PIXORA');
  next = next.replace(/\buiverse\b/g, 'pixora');
  next = next.replace(/uiverse_io/gi, 'pixora_vip');
  return next;
};

const sanitizeDescription = (description) => {
  let next = String(description ?? '');
  next = next.replace(/来自\s*Uiverse\s*的/g, '来自开源灵感库的');
  next = next.replace(/Uiverse\.io/gi, 'Pixora.vip');
  next = next.replace(/Uiverse/gi, '开源灵感库');
  return next;
};

const cleanupTag = async () => {
  const sourceTag = await prisma.tag.findUnique({
    where: { slug: 'uiverse' },
    select: { id: true, name: true, slug: true }
  });

  if (!sourceTag) {
    return { changed: false, reason: '未发现 uiverse 标签' };
  }

  const targetTag = await prisma.tag.findUnique({
    where: { slug: 'pixora' },
    select: { id: true }
  });

  if (targetTag) {
    return { changed: false, reason: 'pixora 标签已存在，跳过重命名' };
  }

  await prisma.tag.update({
    where: { id: sourceTag.id },
    data: {
      name: 'pixora',
      slug: 'pixora'
    }
  });

  return { changed: true, reason: 'uiverse 标签已重命名为 pixora' };
};

const cleanupSnippetFiles = async () => {
  const files = await prisma.snippetFile.findMany({
    where: {
      content: {
        contains: 'uiverse',
        mode: 'insensitive'
      }
    },
    select: {
      id: true,
      content: true
    }
  });

  let changedCount = 0;
  for (const file of files) {
    const nextContent = sanitizeSnippetContent(file.content);
    if (nextContent === file.content) {
      continue;
    }

    await prisma.snippetFile.update({
      where: { id: file.id },
      data: { content: nextContent }
    });
    changedCount += 1;
  }

  return { total: files.length, changed: changedCount };
};

const cleanupSnippetDescriptions = async () => {
  const snippets = await prisma.codeSnippet.findMany({
    where: {
      type: 'component',
      description: {
        contains: 'Uiverse',
        mode: 'insensitive'
      }
    },
    select: {
      id: true,
      description: true
    }
  });

  let changedCount = 0;
  for (const snippet of snippets) {
    const currentDescription = snippet.description ?? '';
    const nextDescription = sanitizeDescription(currentDescription);
    if (nextDescription === currentDescription) {
      continue;
    }

    await prisma.codeSnippet.update({
      where: { id: snippet.id },
      data: { description: nextDescription }
    });
    changedCount += 1;
  }

  return { total: snippets.length, changed: changedCount };
};

(async () => {
  const [fileResult, descriptionResult, tagResult] = await Promise.all([
    cleanupSnippetFiles(),
    cleanupSnippetDescriptions(),
    cleanupTag()
  ]);

  console.log(
    JSON.stringify(
      {
        fileResult,
        descriptionResult,
        tagResult
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
