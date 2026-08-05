import { getDay, isBefore, isSameDay, startOfDay } from "date-fns";
import { normalizeTime } from "@/lib/slots";

export type SubscriptionLike = {
  id: string;
  pitchId: string;
  dayOfWeek: number;
  startTime: string;
  startDate: Date;
  endDate: Date | null;
  isActive: boolean;
};

export type SubscriptionExceptionLike = {
  subscriptionId: string;
  date: Date;
};

export function isSubscriptionBlockedOnDate(
  subscription: SubscriptionLike,
  bookingDate: Date,
  pitchId: string,
  startTime: string,
  exceptions: SubscriptionExceptionLike[]
): boolean {
  if (!subscription.isActive) return false;
  if (subscription.pitchId !== pitchId) return false;
  if (normalizeTime(subscription.startTime) !== normalizeTime(startTime)) return false;
  if (subscription.dayOfWeek !== getDay(bookingDate)) return false;

  const day = startOfDay(bookingDate);
  if (isBefore(day, startOfDay(new Date(subscription.startDate)))) return false;
  if (subscription.endDate && isBefore(startOfDay(new Date(subscription.endDate)), day)) {
    return false;
  }

  const skipped = exceptions.some(
    (exception) =>
      exception.subscriptionId === subscription.id &&
      isSameDay(startOfDay(new Date(exception.date)), day)
  );
  if (skipped) return false;

  return true;
}

export function findBlockingSubscription(
  subscriptions: SubscriptionLike[],
  bookingDate: Date,
  pitchId: string,
  startTime: string,
  exceptions: SubscriptionExceptionLike[]
) {
  return subscriptions.find((subscription) =>
    isSubscriptionBlockedOnDate(subscription, bookingDate, pitchId, startTime, exceptions)
  );
}
