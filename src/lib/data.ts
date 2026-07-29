import prisma from "./prisma";

export async function getBusinessSettings() {
  try {
    const settings = await prisma.businessSettings.findFirst();
    if (settings) return settings;
  } catch (error) {
    console.error("Database error while fetching settings:", error);
  }
  
  // Eğer DB boşsa veya hata varsa varsayılan dönsün
  return {
    name: "Yeşil Saha Tesisleri",
    logoUrl: null,
    siteTitle: "Yeşil Saha - Online Rezervasyon",
  };
}

export async function getPitches() {
  try {
    const pitches = await prisma.pitch.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' }
    });
    return pitches;
  } catch (error) {
    console.error("Database error while fetching pitches:", error);
    return [];
  }
}

export async function getBookings() {
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        status: {
          in: ['CONFIRMED', 'PENDING']
        }
      }
    });
    return bookings;
  } catch (error) {
    console.error("Database error while fetching bookings:", error);
    return [];
  }
}
