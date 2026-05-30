import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
const prisma = new PrismaClient({ adapter });

const ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL || 'admin@ru-logistics-transit.ru';
const ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || '';
const ADMIN_NAME = process.env.DEFAULT_ADMIN_NAME || 'Admin';

async function main() {
  if (!ADMIN_PASSWORD) {
    console.error('DEFAULT_ADMIN_PASSWORD env var is required for seeding');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: { description: 'Administrator with full access' },
    create: { name: 'admin', description: 'Administrator with full access' },
  });

  const user = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { name: ADMIN_NAME, password: passwordHash },
    create: {
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      password: passwordHash,
    },
  });

  const existingAssignment = await prisma.userRole.findUnique({
    where: { userId_roleId: { userId: user.id, roleId: adminRole.id } },
  });

  if (!existingAssignment) {
    await prisma.userRole.create({
      data: { userId: user.id, roleId: adminRole.id },
    });
  }

  console.log(`Default admin user "${ADMIN_EMAIL}" seeded successfully`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
