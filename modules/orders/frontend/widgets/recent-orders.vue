<script setup lang="ts">
const { $api } = useNuxtApp()
const count = ref<number | null>(null)

onMounted(async () => {
  try {
    const { data } = await $api.get('/orders')
    count.value = data.length
  } catch {
    count.value = null
  }
})
</script>

<template>
  <div class="stat-card">
    <span class="stat-label">Всего заказов</span>
    <span class="stat-value">{{ count ?? '—' }}</span>
  </div>
</template>

<style scoped lang="scss">
.stat-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
}
</style>
