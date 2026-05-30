import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
async function main() {
  await p.rolePermission.deleteMany({ where: { roleId: { not: "role_admin" } } });
  await p.role.deleteMany({ where: { id: { not: "role_admin" } } });
  console.log("cleaned");
  await p.$disconnect();
}
main();
