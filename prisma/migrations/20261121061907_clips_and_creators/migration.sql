-- DropIndex
DROP INDEX "Video_youtubeId_idx";

-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "creatorId" TEXT,
ADD COLUMN     "platform" TEXT NOT NULL DEFAULT 'youtube',
ADD COLUMN     "sourceUrl" TEXT,
ADD COLUMN     "thumbnailUrl" TEXT;

-- CreateIndex
CREATE INDEX "Video_platform_youtubeId_idx" ON "Video"("platform", "youtubeId");

-- CreateIndex
CREATE INDEX "Video_creatorId_idx" ON "Video"("creatorId");

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE SET NULL ON UPDATE CASCADE;
