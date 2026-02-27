-- AlterTable
ALTER TABLE "CodeSnippet" ADD COLUMN     "category" TEXT,
ADD COLUMN     "framework" TEXT NOT NULL DEFAULT 'css',
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isRecommended" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'component',
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "CodeSnippet_type_idx" ON "CodeSnippet"("type");

-- CreateIndex
CREATE INDEX "CodeSnippet_category_idx" ON "CodeSnippet"("category");

-- CreateIndex
CREATE INDEX "CodeSnippet_framework_idx" ON "CodeSnippet"("framework");

-- CreateIndex
CREATE INDEX "CodeSnippet_viewCount_idx" ON "CodeSnippet"("viewCount");

-- CreateIndex
CREATE INDEX "CodeSnippet_isRecommended_idx" ON "CodeSnippet"("isRecommended");

-- CreateIndex
CREATE INDEX "CodeSnippet_isFeatured_idx" ON "CodeSnippet"("isFeatured");
