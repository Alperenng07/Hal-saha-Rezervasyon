import { format } from "date-fns";
import { tr } from "date-fns/locale";

export type BookingNotificationDetails = {
  pitchName: string;
  date: Date;
  startTime: string;
  endTime: string;
  guestName: string;
  guestPhone: string;
  notes?: string | null;
};

export type NotificationSettings = {
  businessName: string;
  adminEmail: string | null;
  phone: string | null;
  notifyEmailOnBooking: boolean;
  notifyWhatsAppOnBooking: boolean;
  whatsappApiKey: string | null;
  tenantSlug?: string;
};

export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export function buildBookingNotificationMessage(
  details: BookingNotificationDetails,
  businessName: string,
  tenantSlug?: string
): { text: string; html: string } {
  const siteUrl = getSiteUrl();
  const adminUrl = tenantSlug
    ? `${siteUrl}/${tenantSlug}/admin/bookings`
    : `${siteUrl}/admin/bookings`;
  const dateStr = format(details.date, "d MMMM yyyy, EEEE", { locale: tr });

  const lines = [
    "🔔 Yeni Rezervasyon!",
    "",
    `İşletme: ${businessName}`,
    `Saha: ${details.pitchName}`,
    `Tarih: ${dateStr}`,
    `Saat: ${details.startTime} – ${details.endTime}`,
    `Müşteri: ${details.guestName}`,
    `Telefon: ${details.guestPhone}`,
  ];

  if (details.notes?.trim()) {
    lines.push(`Not: ${details.notes.trim()}`);
  }

  lines.push("", "Rezervasyonları görüntüle:", adminUrl, "", "Siteyi ziyaret et:", siteUrl);

  const text = lines.join("\n");

  const html = `
    <div style="font-family:sans-serif;max-width:480px;line-height:1.5;color:#1e293b">
      <h2 style="color:#059669;margin:0 0 16px">🔔 Yeni Rezervasyon</h2>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:6px 0;color:#64748b">Saha</td><td style="padding:6px 0;font-weight:600">${details.pitchName}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b">Tarih</td><td style="padding:6px 0;font-weight:600">${dateStr}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b">Saat</td><td style="padding:6px 0;font-weight:600">${details.startTime} – ${details.endTime}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b">Müşteri</td><td style="padding:6px 0;font-weight:600">${details.guestName}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b">Telefon</td><td style="padding:6px 0;font-weight:600">${details.guestPhone}</td></tr>
        ${details.notes?.trim() ? `<tr><td style="padding:6px 0;color:#64748b">Not</td><td style="padding:6px 0">${details.notes.trim()}</td></tr>` : ""}
      </table>
      <p style="margin:24px 0 8px">
        <a href="${adminUrl}" style="display:inline-block;background:#059669;color:white;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Rezervasyonları Gör</a>
      </p>
      <p style="margin:0;font-size:13px;color:#64748b">
        Site: <a href="${siteUrl}" style="color:#059669">${siteUrl}</a>
      </p>
    </div>
  `.trim();

  return { text, html };
}

function normalizeWhatsAppPhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  if (digits.startsWith("0")) return `90${digits.slice(1)}`;
  if (digits.startsWith("90")) return digits;
  return digits;
}

function getResendFromAddress(): string {
  const configured = process.env.RESEND_FROM_EMAIL?.trim();
  if (!configured) return "Halı Saha <onboarding@resend.dev>";
  if (configured.includes("<")) return configured;
  return `Halı Saha <${configured}>`;
}

async function sendEmail(to: string, subject: string, text: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.warn("[notifications] RESEND_API_KEY tanımlı değil, e-posta atlanıyor.");
    return;
  }

  const from = getResendFromAddress();
  console.info("[notifications] E-posta gönderiliyor:", { from, to, subject });

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, text, html }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[notifications] E-posta gönderilemedi:", res.status, body);
    throw new Error(`Resend ${res.status}: ${body}`);
  }

  const data = (await res.json()) as { id?: string };
  console.info("[notifications] E-posta gönderildi:", data.id ?? "ok");
}

async function sendWhatsApp(phone: string, apiKey: string, text: string) {
  const normalized = normalizeWhatsAppPhone(phone);
  if (!normalized) {
    console.warn("[notifications] Geçersiz WhatsApp telefon numarası:", phone);
    return;
  }

  const url = new URL("https://api.callmebot.com/whatsapp.php");
  url.searchParams.set("phone", normalized);
  url.searchParams.set("text", text);
  url.searchParams.set("apikey", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.text();
    console.error("[notifications] WhatsApp gönderilemedi:", res.status, body);
  }
}

export async function notifyOwnerNewBooking(
  settings: NotificationSettings,
  details: BookingNotificationDetails
) {
  const { text, html } = buildBookingNotificationMessage(
    details,
    settings.businessName,
    settings.tenantSlug
  );
  const subject = `Yeni rezervasyon: ${details.pitchName} – ${format(details.date, "d MMM", { locale: tr })} ${details.startTime}`;

  const tasks: Promise<void>[] = [];

  if (settings.notifyEmailOnBooking && settings.adminEmail) {
    tasks.push(sendEmail(settings.adminEmail, subject, text, html));
  } else if (settings.notifyEmailOnBooking && !settings.adminEmail) {
    console.warn("[notifications] Admin e-postası tanımlı değil, e-posta atlanıyor.");
  }

  if (settings.notifyWhatsAppOnBooking && settings.phone && settings.whatsappApiKey) {
    tasks.push(sendWhatsApp(settings.phone, settings.whatsappApiKey, text));
  }

  if (tasks.length === 0) {
    console.warn("[notifications] Aktif bildirim kanalı yok, gönderim atlandı.");
    return;
  }

  await Promise.allSettled(tasks);
}
