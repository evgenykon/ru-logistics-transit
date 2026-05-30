import type { ModuleManifest } from '../../api/src/types/module.types'

const manifest: ModuleManifest = {
  key: 'warehouses',
  name: 'Склады',
  version: '1.0.0',
  description: 'Учёт складских помещений',
  icon: '🏭',

  entities: [
    {
      name: 'Warehouse',
      tableName: 'warehouses',
      fields: [
        { name: 'name', type: 'String' },
        { name: 'address', type: 'String', optional: true },
        { name: 'contactPerson', type: 'String', optional: true, map: 'contact_person' },
        { name: 'phone', type: 'String', optional: true },
        { name: 'email', type: 'String', optional: true },
        { name: 'area', type: 'Float', optional: true },
        { name: 'type', type: 'String', optional: true, default: '"closed"' },
        { name: 'status', type: 'String', default: '"active"' },
        { name: 'notes', type: 'String', optional: true },
        { name: 'organizationId', type: 'String', optional: true, map: 'organization_id' },
      ],
      relations: [],
    },
  ],

  dependsOn: {
    entities: ['Organization'],
    modules: [],
  },

  roles: [
    {
      key: 'warehouses:manager',
      name: 'Менеджер складов',
      permissions: ['warehouses:read', 'warehouses:edit'],
    },
  ],

  entityPermissions: [
    { entity: 'Warehouse', create: 'warehouses:create', read: 'warehouses:read', edit: 'warehouses:edit', delete: 'warehouses:delete' },
  ],

  api: {
    prefix: '/warehouses',
    routes: './api/routes',
  },

  jobs: [],
  widgets: [
    {
      key: 'active-warehouses',
      name: 'Активные склады',
      description: 'Количество активных складов',
      component: './frontend/widgets/active-warehouses.vue',
      width: 'quarter',
      defaultEnabled: true,
      requiredPermission: 'warehouses:read',
    },
  ],
  requiredEnv: [],
}

export default manifest
