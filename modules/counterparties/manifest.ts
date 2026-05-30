import type { ModuleManifest } from '../../api/src/types/module.types'

const manifest: ModuleManifest = {
  key: 'counterparties',
  name: 'Контрагенты',
  version: '1.0.0',
  description: 'Учёт контрагентов (юрлица и ИП)',
  icon: '🤝',

  entities: [
    {
      name: 'Counterparty',
      tableName: 'counterparties',
      fields: [
        { name: 'name', type: 'String' },
        { name: 'type', type: 'String', default: '"legal"' },
        { name: 'inn', type: 'String', unique: true },
        { name: 'kpp', type: 'String', optional: true },
        { name: 'ogrn', type: 'String', optional: true },
        { name: 'address', type: 'String', optional: true },
        { name: 'phone', type: 'String', optional: true },
        { name: 'email', type: 'String', optional: true },
        { name: 'contactPerson', type: 'String', optional: true, map: 'contact_person' },
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
      key: 'counterparties:manager',
      name: 'Менеджер контрагентов',
      permissions: ['counterparties:read', 'counterparties:edit'],
    },
  ],

  entityPermissions: [
    { entity: 'Counterparty', create: 'counterparties:create', read: 'counterparties:read', edit: 'counterparties:edit', delete: 'counterparties:delete' },
  ],

  api: {
    prefix: '/counterparties',
    routes: './api/routes',
  },

  jobs: [],
  widgets: [
    {
      key: 'active-counterparties',
      name: 'Активные контрагенты',
      description: 'Количество активных контрагентов',
      component: './frontend/widgets/active-counterparties.vue',
      width: 'quarter',
      defaultEnabled: true,
      requiredPermission: 'counterparties:read',
    },
  ],
  requiredEnv: [],
}

export default manifest
