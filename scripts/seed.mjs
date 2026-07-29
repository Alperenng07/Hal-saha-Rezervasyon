import { config } from "dotenv";
import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

config({ path: ".env.local" });
config();

const DEFAULT_ADMIN_EMAIL =
  process.env.ADMIN_EMAILS?.split(",")[0]?.trim() ||
  "alperenguduk20@gmail.com";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL tanımlı değil.");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const existing = await prisma.businessSettings.findFirst();

  if (!existing) {
    await prisma.businessSettings.create({
      data: {
        name: "Halı Saha Tesisleri",
        siteTitle: "Halı Saha - Online Rezervasyon",
        adminEmail: DEFAULT_ADMIN_EMAIL,
      },
    });
    console.log("Varsayılan işletme ayarları oluşturuldu.");
  } else if (!existing.adminEmail) {
    await prisma.businessSettings.update({
      where: { id: existing.id },
      data: { adminEmail: DEFAULT_ADMIN_EMAIL },
    });
    console.log("Admin e-postası ayarlandı.");
  } else {
    console.log("Seed atlandı — ayarlar zaten mevcut.");
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
