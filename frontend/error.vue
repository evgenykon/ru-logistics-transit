<script setup lang="ts">
const props = defineProps<{
  error: { statusCode: number; statusMessage?: string; message?: string };
}>();

const is404 = computed(() => props.error.statusCode === 404);
const handleHome = () => clearError({ redirect: '/' });
</script>

<template>
  <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px;">
    <div style="text-align: center;">
      <h1 v-if="is404" style="font-size: 48px; margin: 0;">404</h1>
      <h2>{{ is404 ? 'Page not found' : 'Something went wrong' }}</h2>
      <button @click="handleHome" style="margin-top: 16px; padding: 8px 24px; cursor: pointer;">
        Go home
      </button>
    </div>
  </div>
</template>
