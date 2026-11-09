-- CreateTable
CREATE TABLE "Postcard" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "landmark" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "message" TEXT,
    "selfiePublicId" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Postcard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Postcard_slug_key" ON "Postcard"("slug");

-- CreateIndex
CREATE INDEX "Postcard_isPublic_createdAt_idx" ON "Postcard"("isPublic", "createdAt");
