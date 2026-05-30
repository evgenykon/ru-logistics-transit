<script setup lang="ts">
definePageMeta({
  middleware: ['auth', function () { return navigateTo('/settings?tab=modules', { replace: true }); }],
});
</script>

<template>
  <div />
</template>
