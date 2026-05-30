const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
async function main() {
  await p.userRole.deleteMany({ where: { userId: { not: "user_admin" } } });
  await p.user.deleteMany({ where: { id: { not: "user_admin" } } });
  console.log("done");
  await p.$disconnect();
}
main().catch(e => { console.error(e.message);
process.exit(1); });
