<script setup lang="ts">
definePageMeta({ layout: false });
</script>

<template>
  <div class="not-found">
    <h1>404</h1>
    <p>Страница не найдена</p>
    <NuxtLink to="/" class="link">На главную</NuxtLink>
  </div>
</template>

<style scoped lang="scss">
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: #f8fafc;
  gap: 8px;

  h1 {
    font-size: 64px;
    font-weight: 800;
    color: #0f172a;
  }

  p {
    font-size: 16px;
    color: #64748b;
  }

  .link {
    margin-top: 16px;
    color: #3b82f6;
    text-decoration: none;
    font-size: 14px;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
