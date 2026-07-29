-- AlterTable
ALTER TABLE "BusinessSettings" ADD COLUMN "notifyEmailOnBooking" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "BusinessSettings" ADD COLUMN "notifyWhatsAppOnBooking" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "BusinessSettings" ADD COLUMN "whatsappApiKey" TEXT;
