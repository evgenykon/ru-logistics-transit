<script setup lang="ts">
const { $api } = useNuxtApp()
const total = ref<number | null>(null)

onMounted(async () => {
  try {
    const { data } = await $api.get('/finances')
    const start = new Date(); start.setDate(1); start.setHours(0,0,0,0)
    total.value = data.filter((t: any) => t.type === 'income' && new Date(t.date) >= start).reduce((s: number, t: any) => s + t.amount, 0)
  } catch { total.value = null }
})
</script>

<template>
  <div class="stat-card">
    <span class="stat-label">Доходы за месяц</span>
    <span class="stat-value green">{{ total !== null ? total.toLocaleString('ru-RU') + ' ₽' : '—' }}</span>
  </div>
</template>

<style scoped lang="scss">
.stat-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 8px; }
.stat-label { font-size: 13px; color: #64748b; }
.stat-value { font-size: 24px; font-weight: 700; }
.green { color: #15803d; }
</style>
