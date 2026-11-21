-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "xSourceId" TEXT;

-- CreateTable
CREATE TABLE "XSource" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keywords" TEXT NOT NULL DEFAULT '',
    "autoPublish" BOOLEAN NOT NULL DEFAULT false,
    "categoryId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastSeenId" TEXT,
    "lastFetchedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "XSource_username_key" ON "XSource"("username");

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_xSourceId_fkey" FOREIGN KEY ("xSourceId") REFERENCES "XSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
