import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const DEFAULT_ADMIN_EMAIL =
  process.env.ADMIN_EMAILS?.split(",")[0]?.trim() ||
  process.env.SUPER_ADMIN_EMAILS?.split(",")[0]?.trim() ||
  "alperenguduk20@gmail.com";

async function main() {
  const existing = await prisma.tenant.findFirst();

  if (!existing) {
    await prisma.tenant.create({
      data: {
        slug: "demo",
        name: "Halı Saha Tesisleri",
        siteTitle: "Halı Saha - Online Rezervasyon",
        adminEmail: DEFAULT_ADMIN_EMAIL,
      },
    });
    console.log("Varsayılan işletme (demo) oluşturuldu.");
  } else if (!existing.adminEmail) {
    await prisma.tenant.update({
      where: { id: existing.id },
      data: { adminEmail: DEFAULT_ADMIN_EMAIL },
    });
    console.log("Admin e-postası ayarlandı.");
  } else {
    console.log("Seed atlandı — tenant zaten mevcut.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
