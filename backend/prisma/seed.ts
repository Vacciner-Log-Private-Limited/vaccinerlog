import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const vaccines = [
    { name: 'COVID-19', description: 'Coronavirus disease 2019 vaccine', totalDoses: 3 },
    { name: 'Hepatitis B', description: 'Protects against the hepatitis B virus', totalDoses: 3 },
    { name: 'Hepatitis A', description: 'Protects against the hepatitis A virus', totalDoses: 2 },
    { name: 'Influenza (Flu)', description: 'Seasonal influenza vaccine', totalDoses: 1 },
    { name: 'Polio (IPV)', description: 'Inactivated poliovirus vaccine', totalDoses: 4 },
    { name: 'MMR', description: 'Measles, Mumps and Rubella', totalDoses: 2 },
    { name: 'Tetanus (Td/Tdap)', description: 'Tetanus, diphtheria and pertussis', totalDoses: 1 },
    { name: 'Typhoid', description: 'Protects against typhoid fever', totalDoses: 1 },
  ];

  for (const v of vaccines) {
    await prisma.vaccine.upsert({
      where: { name: v.name },
      update: {},
      create: v,
    });
  }

  const providers = [
    { name: 'Apollo Hospital', city: 'Hyderabad' },
    { name: 'Care Hospital', city: 'Hyderabad' },
    { name: 'KIMS Hospital', city: 'Hyderabad' },
  ];

  for (const p of providers) {
    const existing = await prisma.provider.findFirst({ where: { name: p.name } });
    if (!existing) {
      await prisma.provider.create({ data: p });
    }
  }

  // eslint-disable-next-line no-console
  console.log(
    `Seed complete: ${vaccines.length} vaccines, ${providers.length} providers`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
