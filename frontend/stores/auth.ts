import { defineStore } from 'pinia';

interface Role {
  id: string;
  name: string;
  permissions: string[];
}

interface User {
  id: string;
  email: string;
  name: string;
  roles: Role[];
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const loading = ref(false);

  const isAuthenticated = computed(() => !!user.value);

  async function fetchUser() {
    try {
      const { $api } = useNuxtApp();
      const { data } = await $api.get('/auth/me');
      user.value = data;
    } catch {
      user.value = null;
    }
  }

  async function login(email: string, password: string) {
    const { $api } = useNuxtApp();
    const { data } = await $api.post('/auth/login', { email, password });
    user.value = data;
  }

  async function logout() {
    const { $api } = useNuxtApp();
    try {
      await $api.post('/auth/logout');
    } finally {
      user.value = null;
    }
  }

  function hasPermission(name: string) {
    return user.value?.roles.some((r) => r.permissions.includes(name)) ?? false;
  }

  function hasRole(name: string) {
    return user.value?.roles.some((r) => r.name === name) ?? false;
  }

  return { user, loading, isAuthenticated, fetchUser, login, logout, hasPermission, hasRole };
});
