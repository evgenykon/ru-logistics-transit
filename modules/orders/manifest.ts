import type { ModuleManifest } from '../../api/src/types/module.types'

const manifest: ModuleManifest = {
  key: 'orders',
  name: 'Заказы/грузы',
  version: '1.0.0',
  description: 'Управление заказами и грузами',
  icon: '📦',

  entities: [
    {
      name: 'Order',
      tableName: 'orders',
      fields: [
        { name: 'number', type: 'String', unique: true },
        { name: 'status', type: 'OrderStatus', default: 'draft' },
        { name: 'description', type: 'String', optional: true },
        { name: 'organizationId', type: 'String', optional: true, map: 'organization_id' },
        { name: 'createdById', type: 'String', optional: true, map: 'created_by_id' },
      ],
      relations: [
        { name: 'organization', type: 'belongsTo', model: 'Organization', fields: ['organizationId'], references: ['id'] },
        { name: 'createdBy', type: 'belongsTo', model: 'User', fields: ['createdById'], references: ['id'] },
        { name: 'cargos', type: 'hasMany', model: 'Cargo' },
      ],
    },
    {
      name: 'Cargo',
      tableName: 'cargos',
      fields: [
        { name: 'name', type: 'String' },
        { name: 'weight', type: 'Float', optional: true },
        { name: 'volume', type: 'Float', optional: true },
        { name: 'quantity', type: 'Int', default: '1' },
        { name: 'unit', type: 'String', default: '"шт"' },
        { name: 'orderId', type: 'String', optional: true, map: 'order_id' },
      ],
      relations: [
        { name: 'order', type: 'belongsTo', model: 'Order', fields: ['orderId'], references: ['id'] },
      ],
    },
  ],

  dependsOn: {
    entities: ['User', 'Organization'],
    modules: [],
  },

  roles: [
    {
      key: 'orders:manager',
      name: 'Менеджер заказов',
      permissions: ['orders:read', 'orders:edit'],
    },
  ],

  entityPermissions: [
    { entity: 'Order', create: 'orders:create', read: 'orders:read', edit: 'orders:edit', delete: 'orders:delete' },
    { entity: 'Cargo', create: 'orders:create', read: 'orders:read', edit: 'orders:edit', delete: 'orders:delete' },
  ],

  api: {
    prefix: '/orders',
    routes: './api/routes',
  },

  jobs: [],
  widgets: [
    {
      key: 'active-orders',
      name: 'Активные заказы',
      description: 'Количество заказов в статусе active',
      component: './frontend/widgets/active-orders.vue',
      width: 'quarter',
      defaultEnabled: true,
      requiredPermission: 'orders:read',
    },
    {
      key: 'orders-today',
      name: 'Заказов сегодня',
      description: 'Количество заказов, созданных сегодня',
      component: './frontend/widgets/orders-today.vue',
      width: 'quarter',
      defaultEnabled: true,
      requiredPermission: 'orders:read',
    },
    {
      key: 'recent-orders',
      name: 'Последние заказы',
      description: 'Список последних заказов',
      component: './frontend/widgets/recent-orders.vue',
      width: 'full',
      defaultEnabled: true,
      requiredPermission: 'orders:read',
    },
  ],
  requiredEnv: [],
}

export default manifest
