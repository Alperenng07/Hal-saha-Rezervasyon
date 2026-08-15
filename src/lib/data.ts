import prisma from "./prisma";
import { startOfDay } from "date-fns";
import { getActiveTenantBySlug } from "@/lib/tenant";

export async function getTenantSettings(tenantSlug: string) {
  return getActiveTenantBySlug(tenantSlug);
}

export async function getPitches(tenantId: string) {
  return prisma.pitch.findMany({
    where: { tenantId, isActive: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function getBookingsForTenant(tenantId: string) {
  return prisma.booking.findMany({
    where: {
      pitch: { tenantId },
      status: { in: ["CONFIRMED", "PENDING"] },
    },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      pitch: { select: { name: true } },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
}

export async function getTodayBookingsCount(tenantId: string) {
  const today = startOfDay(new Date());
  return prisma.booking.count({
    where: {
      pitch: { tenantId },
      date: today,
      status: { in: ["CONFIRMED", "PENDING"] },
    },
  });
}

export async function getActiveSubscriptionsCount(tenantId: string) {
  return prisma.subscription.count({
    where: { pitch: { tenantId }, isActive: true },
  });
}

export async function getUpcomingBookings(tenantId: string, limit = 10) {
  const today = startOfDay(new Date());
  return prisma.booking.findMany({
    where: {
      pitch: { tenantId },
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

export async function getAdminBookings(tenantId: string) {
  return prisma.booking.findMany({
    where: {
      pitch: { tenantId },
      status: { in: ["CONFIRMED", "PENDING"] },
    },
    include: {
      pitch: { select: { name: true } },
      user: { select: { name: true, email: true, phone: true } },
    },
    orderBy: [{ date: "desc" }, { startTime: "asc" }],
  });
}

export async function getSubscriptionExceptionsForTenant(tenantId: string) {
  return prisma.subscriptionException.findMany({
    where: { subscription: { pitch: { tenantId } } },
    orderBy: { date: "asc" },
  });
}

export async function getActiveSubscriptionsForTenant(tenantId: string) {
  return prisma.subscription.findMany({
    where: { pitch: { tenantId }, isActive: true },
    include: {
      pitch: { select: { name: true } },
      user: { select: { name: true, email: true, phone: true } },
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
}

export async function getAdminSubscriptions(tenantId: string) {
  return prisma.subscription.findMany({
    where: { pitch: { tenantId } },
    include: {
      pitch: { select: { name: true } },
      user: { select: { name: true, email: true, phone: true } },
    },
    orderBy: [{ isActive: "desc" }, { dayOfWeek: "asc" }, { startTime: "asc" }],
  });
}
