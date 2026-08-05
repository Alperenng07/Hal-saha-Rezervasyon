-- CreateTable
CREATE TABLE "SubscriptionException" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionException_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionException_subscriptionId_date_key" ON "SubscriptionException"("subscriptionId", "date");

-- AddForeignKey
ALTER TABLE "SubscriptionException" ADD CONSTRAINT "SubscriptionException_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
