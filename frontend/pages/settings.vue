<script setup lang="ts">
definePageMeta({ middleware: 'auth' });

const auth = useAuthStore();
const route = useRoute();
const activeTab = ref<'profile' | 'modules'>(route.query.tab === 'modules' ? 'modules' : 'profile');
</script>

<template>
  <div class="settings">
    <h1 class="page-title">Настройки</h1>

    <div class="tabs">
      <button
        class="tab"
        :class="{ active: activeTab === 'profile' }"
        @click="activeTab = 'profile'"
      >
        Профиль
      </button>
      <button
        v-if="auth.hasRole('admin')"
        class="tab"
        :class="{ active: activeTab === 'modules' }"
        @click="activeTab = 'modules'"
      >
        Модули
      </button>
    </div>

    <div class="tab-content">
      <SettingsProfile v-if="activeTab === 'profile'" />
      <SettingsModules v-if="activeTab === 'modules'" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.settings {
  max-width: 800px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 24px;
}

.tabs {
  display: flex;
  gap: 0;
  border-bottom: 2px solid #e2e8f0;
  margin-bottom: 24px;
}

.tab {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    color: #334155;
  }

  &.active {
    color: #3b82f6;
    border-bottom-color: #3b82f6;
  }
}

.tab-content {
  min-height: 200px;
}
</style>
