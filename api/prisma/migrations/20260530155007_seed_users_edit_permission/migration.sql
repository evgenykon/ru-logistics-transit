-- Seed: users:edit permission + assign to admin
INSERT INTO "permissions" ("id", "name", "description")
  VALUES ('perm_users_edit', 'users:edit', 'Редактирование пользователей')
  ON CONFLICT ("name") DO NOTHING;

INSERT INTO "role_permissions" ("roleId", "permissionId")
  VALUES ('role_admin', 'perm_users_edit')
  ON CONFLICT DO NOTHING;
