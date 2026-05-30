-- Seed: roles:read and roles:edit permissions + assign to admin
INSERT INTO "permissions" ("id", "name", "description")
  VALUES
    ('perm_roles_read', 'roles:read', 'Просмотр списка ролей'),
    ('perm_roles_edit', 'roles:edit', 'Создание и редактирование ролей')
  ON CONFLICT ("name") DO NOTHING;

INSERT INTO "role_permissions" ("roleId", "permissionId")
  VALUES
    ('role_admin', 'perm_roles_read'),
    ('role_admin', 'perm_roles_edit')
  ON CONFLICT DO NOTHING;
