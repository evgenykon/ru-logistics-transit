<script setup lang="ts">
definePageMeta({
  middleware: ['auth', function (to) {
    if (to.path === '/modules') {
      return navigateTo('/settings?tab=modules', { replace: true });
    }
  }],
});
</script>

<template>
  <NuxtPage />
</template>
