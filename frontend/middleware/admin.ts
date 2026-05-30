export default defineNuxtRouteMiddleware(async () => {
  const auth = useAuthStore();

  if (!auth.isAuthenticated) {
    await auth.fetchUser();
  }

  if (!auth.isAuthenticated || !auth.hasRole('admin')) {
    return navigateTo('/');
  }
});
