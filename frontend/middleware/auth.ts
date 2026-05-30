export default defineNuxtRouteMiddleware(async () => {
  const auth = useAuthStore();

  if (!auth.isAuthenticated) {
    await auth.fetchUser();
  }

  if (!auth.isAuthenticated) {
    return navigateTo('/login');
  }
});
