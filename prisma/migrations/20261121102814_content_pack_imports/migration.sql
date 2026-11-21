-- CreateTable
CREATE TABLE "ContentPackImport" (
    "slug" TEXT NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentPackImport_pkey" PRIMARY KEY ("slug")
);
