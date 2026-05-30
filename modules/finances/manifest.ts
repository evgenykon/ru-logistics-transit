import type { ModuleManifest } from '../../api/src/types/module.types'

const manifest: ModuleManifest = {
  key: 'finances',
  name: 'Финансы',
  version: '1.0.0',
  description: 'Учёт доходов и расходов',
  icon: '💰',

  entities: [
    {
      name: 'Transaction',
      tableName: 'transactions',
      fields: [
        { name: 'type', type: 'String', default: '"expense"' },
        { name: 'amount', type: 'Float' },
        { name: 'currency', type: 'String', default: '"RUB"' },
        { name: 'description', type: 'String', optional: true },
        { name: 'category', type: 'String', optional: true },
        { name: 'counterpartyId', type: 'String', optional: true, map: 'counterparty_id' },
        { name: 'orderId', type: 'String', optional: true, map: 'order_id' },
        { name: 'organizationId', type: 'String', optional: true, map: 'organization_id' },
        { name: 'status', type: 'String', default: '"completed"' },
      ],
      relations: [],
    },
  ],

  dependsOn: {
    entities: ['Counterparty', 'Order', 'Organization'],
    modules: ['counterparties', 'orders'],
  },

  roles: [
    {
      key: 'finances:manager',
      name: 'Менеджер финансов',
      permissions: ['finances:read', 'finances:edit'],
    },
  ],

  entityPermissions: [
    { entity: 'Transaction', create: 'finances:create', read: 'finances:read', edit: 'finances:edit', delete: 'finances:delete' },
  ],

  api: {
    prefix: '/finances',
    routes: './api/routes',
  },

  jobs: [],
  widgets: [
    {
      key: 'income-total',
      name: 'Доходы',
      description: 'Сумма доходов за текущий месяц',
      component: './frontend/widgets/income-total.vue',
      width: 'quarter',
      defaultEnabled: true,
      requiredPermission: 'finances:read',
    },
    {
      key: 'expense-total',
      name: 'Расходы',
      description: 'Сумма расходов за текущий месяц',
      component: './frontend/widgets/expense-total.vue',
      width: 'quarter',
      defaultEnabled: true,
      requiredPermission: 'finances:read',
    },
  ],
  requiredEnv: [],
}

export default manifest
