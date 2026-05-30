-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "inn" TEXT NOT NULL,
    "kpp" TEXT,
    "ogrn" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "contactPerson" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_inn_key" ON "organizations"("inn");

-- Seed: organizations permissions + assign to admin
INSERT INTO "permissions" ("id", "name", "description")
  VALUES
    ('perm_orgs_read', 'organizations:read', 'Просмотр списка организаций'),
    ('perm_orgs_edit', 'organizations:edit', 'Создание и редактирование организаций')
  ON CONFLICT ("name") DO NOTHING;

INSERT INTO "role_permissions" ("roleId", "permissionId")
  VALUES
    ('role_admin', 'perm_orgs_read'),
    ('role_admin', 'perm_orgs_edit')
  ON CONFLICT DO NOTHING;
