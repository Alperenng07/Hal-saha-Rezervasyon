-- Multi-tenant: Tenant model, migrate BusinessSettings, scope pitches

ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';

CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "siteTitle" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "adminEmail" TEXT,
    "themeColor" TEXT NOT NULL DEFAULT 'emerald',
    "notifyEmailOnBooking" BOOLEAN NOT NULL DEFAULT true,
    "notifyWhatsAppOnBooking" BOOLEAN NOT NULL DEFAULT false,
    "whatsappApiKey" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

INSERT INTO "Tenant" (
    "id",
    "slug",
    "name",
    "logoUrl",
    "siteTitle",
    "phone",
    "email",
    "adminEmail",
    "themeColor",
    "notifyEmailOnBooking",
    "notifyWhatsAppOnBooking",
    "whatsappApiKey",
    "isActive",
    "createdAt",
    "updatedAt"
)
SELECT
    "id",
    'demo',
    "name",
    "logoUrl",
    "siteTitle",
    "phone",
    "email",
    "adminEmail",
    "themeColor",
    "notifyEmailOnBooking",
    "notifyWhatsAppOnBooking",
    "whatsappApiKey",
    true,
    "createdAt",
    "updatedAt"
FROM "BusinessSettings"
LIMIT 1;

INSERT INTO "Tenant" (
    "id",
    "slug",
    "name",
    "siteTitle",
    "adminEmail",
    "createdAt",
    "updatedAt"
)
SELECT
    gen_random_uuid()::text,
    'demo',
    'Halı Saha Tesisleri',
    'Halı Saha - Online Rezervasyon',
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Tenant");

ALTER TABLE "Pitch" ADD COLUMN "tenantId" TEXT;

UPDATE "Pitch"
SET "tenantId" = (SELECT "id" FROM "Tenant" ORDER BY "createdAt" ASC LIMIT 1)
WHERE "tenantId" IS NULL;

ALTER TABLE "Pitch" ALTER COLUMN "tenantId" SET NOT NULL;

ALTER TABLE "Pitch" ADD CONSTRAINT "Pitch_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DROP TABLE IF EXISTS "BusinessSettings";
