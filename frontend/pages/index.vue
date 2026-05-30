<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { $api } = useNuxtApp()
const auth = useAuthStore()

const widgetComponents: Record<string, () => Promise<{ default: any }>> = import.meta.glob('../modules/*/frontend/widgets/*.vue')

interface WidgetInstance {
  component: any
  key: string
}

const widgets = ref<WidgetInstance[]>([])

onMounted(async () => {
  try {
    const { data: modules } = await $api.get('/modules')

    const instances: WidgetInstance[] = []

    for (const mod of modules) {
      if (!mod.enabled) continue
      const config = mod.config || {}
      const widgetConfigs = config.widgets || {}

      for (const [widgetKey, wc] of Object.entries(widgetConfigs) as [string, any][]) {
        if (!wc.enabled) continue
        if (!auth.hasRole('admin') && !auth.hasPermission(wc.requiredPermission)) continue

        const componentPath = `../modules/${mod.key}/frontend/widgets/${widgetKey}.vue`
        const loader = widgetComponents[componentPath]
        if (!loader) continue

        instances.push({
          component: defineAsyncComponent(loader),
          key: `${mod.key}.${widgetKey}`,
        })
      }
    }

    widgets.value = instances
  } catch {
    // no widgets
  }
})
</script>

<template>
  <div class="dashboard">
    <h1 class="page-title">Дашборд</h1>

    <div v-if="widgets.length" class="widgets-grid">
      <div
        v-for="w in widgets"
        :key="w.key"
        class="widget-cell"
      >
        <component :is="w.component" />
      </div>
    </div>

    <div v-else class="empty-state">
      <p>Нет активных виджетов</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.dashboard {
  max-width: 1200px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 24px;
}

.widgets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.empty-state {
  color: #94a3b8;
  font-size: 14px;
  text-align: center;
  padding: 48px;
}
</style>
