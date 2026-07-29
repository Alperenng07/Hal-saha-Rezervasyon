-- AlterTable
ALTER TABLE "BusinessSettings" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "BusinessSettings" ADD COLUMN IF NOT EXISTS "email" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Booking_pitchId_date_startTime_key" ON "Booking"("pitchId", "date", "startTime");
