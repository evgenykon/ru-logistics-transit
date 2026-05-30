import { defineStore } from 'pinia';

interface Module {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  route: string;
  enabled: boolean;
  order: number;
}

export const useModulesStore = defineStore('modules', () => {
  const modules = ref<Module[]>([]);
  const loading = ref(false);

  const sidebarModules = computed(() =>
    modules.value
      .filter((m) => m.enabled && m.key !== 'modules')
      .sort((a, b) => a.order - b.order),
  );

  async function fetchModules() {
    try {
      const { $api } = useNuxtApp();
      const { data } = await $api.get('/modules');
      modules.value = data;
    } catch {
      modules.value = [];
    }
  }

  return { modules, loading, sidebarModules, fetchModules };
});
