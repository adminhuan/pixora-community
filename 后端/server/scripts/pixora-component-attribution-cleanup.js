const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const normalizeDescription = (description) => {
  const current = String(description ?? '');
  return current.replace(/(?<!来源)作者[:：]/g, '来源作者：');
};

const cleanupComponentDescriptions = async () => {
  const snippets = await prisma.codeSnippet.findMany({
    where: {
      type: 'component',
      visibility: 'public',
      OR: [
        { description: { contains: '作者：' } },
        { description: { contains: '作者:' } }
      ]
    },
    select: {
      id: true,
      description: true
    }
  });

  let changed = 0;
  for (const snippet of snippets) {
    const current = snippet.description ?? '';
    const next = normalizeDescription(current);
    if (next === current) {
      continue;
    }

    await prisma.codeSnippet.update({
      where: { id: snippet.id },
      data: { description: next }
    });
    changed += 1;
  }

  return {
    total: snippets.length,
    changed
  };
};

const cleanupByTags = async () => {
  const byTags = await prisma.tag.findMany({
    where: {
      slug: {
        startsWith: 'by-'
      }
    },
    select: {
      id: true,
      slug: true
    }
  });

  let removedRelations = 0;
  let deletedTags = 0;

  for (const tag of byTags) {
    const removed = await prisma.snippetTag.deleteMany({
      where: {
        tagId: tag.id,
        snippet: {
          type: 'component'
        }
      }
    });
    removedRelations += removed.count;

    const remaining = await prisma.snippetTag.count({
      where: { tagId: tag.id }
    });

    if (remaining === 0) {
      await prisma.tag.delete({ where: { id: tag.id } });
      deletedTags += 1;
    } else {
      await prisma.tag.update({
        where: { id: tag.id },
        data: { usageCount: remaining }
      });
    }
  }

  return {
    totalTags: byTags.length,
    removedRelations,
    deletedTags
  };
};

(async () => {
  const [descriptionResult, tagResult] = await Promise.all([
    cleanupComponentDescriptions(),
    cleanupByTags()
  ]);

  console.log(
    JSON.stringify(
      {
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
