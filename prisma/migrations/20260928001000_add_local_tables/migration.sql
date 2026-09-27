-- CreateTable
CREATE TABLE "VisitorStat" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "referrer" TEXT,
    "userAgent" TEXT,
    "country" TEXT,
    "visitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitorStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RadioSubscriber" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RadioSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialMediaCache" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialMediaCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VisitorStat_path_idx" ON "VisitorStat"("path");

-- CreateIndex
CREATE INDEX "VisitorStat_visitedAt_idx" ON "VisitorStat"("visitedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RadioSubscriber_email_key" ON "RadioSubscriber"("email");

-- CreateIndex
CREATE INDEX "SocialMediaCache_platform_idx" ON "SocialMediaCache"("platform");

