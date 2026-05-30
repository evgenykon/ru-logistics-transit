<script setup lang="ts">
const route = useRoute()
const key = route.params.key as string

const modulePages: Record<string, () => Promise<{ default: any }>> = import.meta.glob('../../modules/*/frontend/pages/index.vue')

const loader = modulePages[`../../modules/${key}/frontend/pages/index.vue`]

const pageComponent = loader ? defineAsyncComponent(loader) : null
</script>

<template>
  <component :is="pageComponent" v-if="pageComponent" :key="route.fullPath" />
  <div v-else class="p-8 text-center text-gray-400">
    <h2 class="text-lg font-semibold">Модуль не найден</h2>
    <p class="mt-1 text-sm">Модуль «{{ key }}» не имеет страницы или отключён</p>
  </div>
</template>
