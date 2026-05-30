<script setup lang="ts">
const auth = useAuthStore();
const modules = useModulesStore();

const collapsed = ref(false);

onMounted(async () => {
  await modules.fetchModules();
});

async function handleLogout() {
  await auth.logout();
  await navigateTo('/login');
}
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar" :class="{ collapsed }">
      <div class="sidebar-header">
        <img src="/images/logo.png" alt="Транзит" class="sidebar-logo" />
        <span class="logo-text">Транзит</span>
      </div>

      <nav class="sidebar-nav">
        <NuxtLink to="/" class="nav-item" active-class="active">
          <span class="nav-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          </span>
          <span class="nav-label">Дашборд</span>
        </NuxtLink>

        <template v-if="auth.hasRole('admin') || auth.hasPermission('users:read') || auth.hasPermission('roles:read') || auth.hasPermission('organizations:read')">
          <div class="nav-section-label">Управление</div>

          <NuxtLink to="/users" class="nav-item" active-class="active">
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </span>
            <span class="nav-label">Пользователи</span>
          </NuxtLink>

          <NuxtLink to="/organizations" class="nav-item" active-class="active">
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            </span>
            <span class="nav-label">Организации</span>
          </NuxtLink>
        </template>

        <div v-if="modules.sidebarModules.length" class="nav-section-label">Модули</div>

        <NuxtLink
          v-for="mod in modules.sidebarModules"
          :key="mod.key"
          :to="mod.route || `/modules/${mod.key}`"
          class="nav-item"
          active-class="active"
        >
          <span class="nav-icon">{{ mod.icon }}</span>
          <span class="nav-label">{{ mod.name }}</span>
        </NuxtLink>

        <NuxtLink to="/settings" class="nav-item" active-class="active">
          <span class="nav-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z\"/></svg>
          </span>
          <span class="nav-label">Настройки</span>
        </NuxtLink>
      </nav>

      <div class="sidebar-footer">
        <button class="nav-item" @click="handleLogout">
          <span class="nav-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </span>
          <span class="nav-label">Выйти</span>
        </button>
      </div>
    </aside>

    <main class="main">
      <header class="topbar">
        <button class="hamburger" @click="collapsed = !collapsed">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>

        <div class="topbar-right">
          <span class="user-name">{{ auth.user?.name || auth.user?.email }}</span>
        </div>
      </header>

      <div class="content">
        <slot />
      </div>
    </main>
  </div>
</template>

<style scoped lang="scss">
.app-shell {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  width: 240px;
  min-width: 240px;
  background: #0f172a;
  color: #cbd5e1;
  display: flex;
  flex-direction: column;
  transition: width 0.2s, min-width 0.2s;

  &.collapsed {
    width: 60px;
    min-width: 60px;

    .nav-label,
    .logo-text {
      display: none;
    }

    .sidebar-logo {
      width: 32px;
      height: 32px;
    }

    .sidebar-header {
      justify-content: center;
      padding: 16px 0;
    }
  }
}

.sidebar-header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid #1e293b;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;

  .sidebar-logo {
    width: 40px;
    height: 40px;
    object-fit: contain;
  }

  .logo-text {
    font-size: 12px;
    font-weight: 600;
    color: #94a3b8;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
}

.sidebar-nav {
  flex: 1;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sidebar-footer {
  padding: 8px;
  border-top: 1px solid #1e293b;
}

.nav-section-label {
  padding: 16px 12px 6px;
  font-size: 10px;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  color: #94a3b8;
  text-decoration: none;
  font-size: 14px;
  transition: all 0.15s;
  cursor: pointer;
  border: none;
  background: none;
  width: 100%;
  text-align: left;

  &:hover {
    background: #1e293b;
    color: #e2e8f0;
  }

  &.active {
    background: #1d4ed8;
    color: #fff;
  }
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.nav-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f8fafc;
}

.topbar {
  height: 56px;
  min-height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
}

.hamburger {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;

  &:hover {
    background: #f1f5f9;
  }
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-name {
  font-size: 13px;
  font-weight: 500;
  color: #334155;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}
</style>
