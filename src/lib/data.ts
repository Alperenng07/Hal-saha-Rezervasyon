import prisma from "./prisma";
import { startOfDay } from "date-fns";

export async function getBusinessSettings() {
  const settings = await prisma.businessSettings.findFirst();
  if (settings) return settings;

  return null;
}

export async function getPitches() {
  return prisma.pitch.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function getBookings() {
  return prisma.booking.findMany({
    where: {
      status: { in: ["CONFIRMED", "PENDING"] },
    },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      pitch: { select: { name: true } },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
}

export async function getTodayBookingsCount() {
  const today = startOfDay(new Date());
  return prisma.booking.count({
    where: {
      date: today,
      status: { in: ["CONFIRMED", "PENDING"] },
    },
  });
}

export async function getActiveSubscriptionsCount() {
  return prisma.subscription.count({
    where: { isActive: true },
  });
}

export async function getUpcomingBookings(limit = 10) {
  const today = startOfDay(new Date());
  return prisma.booking.findMany({
    where: {
      date: { gte: today },
      status: { in: ["CONFIRMED", "PENDING"] },
    },
    include: {
      pitch: { select: { name: true } },
      user: { select: { name: true, email: true } },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
    take: limit,
  });
}
