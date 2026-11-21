-- AlterTable
ALTER TABLE "XSource" ADD COLUMN     "backfillAdded" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "backfillCursor" TEXT,
ADD COLUMN     "backfillLimit" INTEGER NOT NULL DEFAULT 1000,
ADD COLUMN     "backfillMode" TEXT,
ADD COLUMN     "backfillScanned" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "backfillStatus" TEXT NOT NULL DEFAULT 'none';
