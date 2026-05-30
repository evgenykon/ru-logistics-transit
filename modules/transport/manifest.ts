import type { ModuleManifest } from '../../api/src/types/module.types'

const manifest: ModuleManifest = {
  key: 'transport',
  name: 'Транспорт/ТС',
  version: '1.0.0',
  description: 'Учёт транспортных средств',
  icon: '🚛',

  entities: [
    {
      name: 'Vehicle',
      tableName: 'vehicles',
      fields: [
        { name: 'brand', type: 'String' },
        { name: 'model', type: 'String' },
        { name: 'licensePlate', type: 'String', unique: true, map: 'license_plate' },
        { name: 'vin', type: 'String', optional: true, unique: true },
        { name: 'year', type: 'Int', optional: true },
        { name: 'capacity', type: 'Float', optional: true },
        { name: 'volume', type: 'Float', optional: true },
        { name: 'bodyType', type: 'String', optional: true, map: 'body_type' },
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
      key: 'transport:manager',
      name: 'Менеджер транспорта',
      permissions: ['transport:read', 'transport:edit'],
    },
  ],

  entityPermissions: [
    { entity: 'Vehicle', create: 'transport:create', read: 'transport:read', edit: 'transport:edit', delete: 'transport:delete' },
  ],

  api: {
    prefix: '/vehicles',
    routes: './api/routes',
  },

  jobs: [],
  widgets: [
    {
      key: 'active-vehicles',
      name: 'Активные ТС',
      description: 'Количество активных транспортных средств',
      component: './frontend/widgets/active-vehicles.vue',
      width: 'quarter',
      defaultEnabled: true,
      requiredPermission: 'transport:read',
    },
  ],
  requiredEnv: [],
}

export default manifest
