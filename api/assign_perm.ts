const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const p = new PrismaClient({ adapter });
async function main() {
  await p.rolePermission.upsert({
    where: { roleId_permissionId: { roleId: 'role_admin', permissionId: 'perm_users_edit' } },
    create: { roleId: 'role_admin', permissionId: 'perm_users_edit' },
    update: {},
  });
  console.log('done');
  await p.$disconnect();
}
main().catch(e => { console.error(e.message); process.exit(1); });
