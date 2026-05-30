-- Seed: users:read permission + assign to admin role
INSERT INTO "permissions" ("id", "name", "description")
  VALUES ('perm_users_read', 'users:read', 'Просмотр списка пользователей')
  ON CONFLICT ("name") DO NOTHING;

INSERT INTO "role_permissions" ("roleId", "permissionId")
  VALUES ('role_admin', 'perm_users_read')
  ON CONFLICT DO NOTHING;
