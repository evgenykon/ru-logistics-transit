import type { ModuleManifest } from '../../api/src/types/module.types'

const manifest: ModuleManifest = {
  key: 'tracking',
  name: 'Трекинг/GPS',
  version: '1.0.0',
  description: 'GPS-трекинг и история перемещений',
  icon: '📍',

  entities: [
    {
      name: 'TrackPoint',
      tableName: 'track_points',
      fields: [
        { name: 'orderId', type: 'String', optional: true, map: 'order_id' },
        { name: 'vehicleId', type: 'String', optional: true, map: 'vehicle_id' },
        { name: 'lat', type: 'Float' },
        { name: 'lng', type: 'Float' },
        { name: 'speed', type: 'Float', optional: true },
        { name: 'direction', type: 'Float', optional: true },
        { name: 'source', type: 'String', optional: true, default: '"manual"' },
      ],
      relations: [],
    },
  ],

  dependsOn: {
    entities: ['Order', 'Vehicle'],
    modules: ['orders', 'transport'],
  },

  roles: [
    {
      key: 'tracking:manager',
      name: 'Менеджер трекинга',
      permissions: ['tracking:read', 'tracking:edit'],
    },
  ],

  entityPermissions: [
    { entity: 'TrackPoint', create: 'tracking:create', read: 'tracking:read', edit: 'tracking:edit', delete: 'tracking:delete' },
  ],

  api: {
    prefix: '/tracking',
    routes: './api/routes',
  },

  jobs: [],
  widgets: [
    {
      key: 'active-trips',
      name: 'Активные поездки',
      description: 'Количество заказов с трекингом',
      component: './frontend/widgets/active-trips.vue',
      width: 'quarter',
      defaultEnabled: true,
      requiredPermission: 'tracking:read',
    },
  ],
  requiredEnv: [],
}

export default manifest
