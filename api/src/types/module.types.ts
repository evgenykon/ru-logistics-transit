export interface ModuleEntityField {
  name: string
  type: string
  optional?: boolean
  unique?: boolean
  default?: string
  map?: string
}

export interface ModuleEntityRelation {
  name: string
  type: 'hasMany' | 'belongsTo' | 'hasOne'
  model: string
  fields?: string[]
  references?: string[]
}

export interface ModuleEntity {
  name: string
  tableName: string
  fields: ModuleEntityField[]
  relations: ModuleEntityRelation[]
}

export interface ModuleRole {
  key: string
  name: string
  permissions: string[]
}

export interface ModuleEntityPermission {
  entity: string
  create: string
  read: string
  edit: string
  delete: string
}

export interface ModuleApiRoute {
  prefix: string
  routes: string
}

export interface ModuleJob {
  name: string
  cron?: string
  queue?: string
  handler: string
}

export interface WidgetDefinition {
  key: string
  name: string
  description?: string
  component: string
  width?: 'quarter' | 'third' | 'half' | 'full'
  defaultEnabled: boolean
  requiredPermission: string
}

export interface ModuleManifest {
  key: string
  name: string
  version: string
  description: string
  icon?: string
  entities: ModuleEntity[]
  dependsOn: {
    entities: string[]
    modules: string[]
  }
  roles: ModuleRole[]
  entityPermissions: ModuleEntityPermission[]
  api: ModuleApiRoute
  jobs: ModuleJob[]
  widgets: WidgetDefinition[]
  requiredEnv: string[]
}
