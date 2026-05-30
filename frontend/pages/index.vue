<script setup lang="ts">
definePageMeta({ middleware: 'auth' });
</script>

<template>
  <div class="dashboard">
    <h1 class="page-title">Дашборд</h1>

    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-label">Активные заказы</span>
        <span class="stat-value">—</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Транспорт в пути</span>
        <span class="stat-value">—</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Контрагенты</span>
        <span class="stat-value">—</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Завершено сегодня</span>
        <span class="stat-value">—</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.dashboard {
  max-width: 1200px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

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
