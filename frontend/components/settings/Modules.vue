<script setup lang="ts">
const { $api } = useNuxtApp();
const modules = ref<any[]>([]);
const loading = ref(true);
const showForm = ref(false);
const editing = ref<any | null>(null);

interface WidgetForm {
  key: string
  name: string
  enabled: boolean
}

const form = ref({
  name: '',
  description: '',
  order: 0,
  widgets: [] as WidgetForm[],
  moduleConfig: {} as Record<string, any>,
});

async function load() {
  loading.value = true;
  try {
    const { data } = await $api.get('/modules');
    modules.value = data;
  } finally {
    loading.value = false;
  }
}

function openEdit(mod: any) {
  editing.value = mod;
  const config = mod.config || {}
  const wc = config.widgets || {}
  const { widgets: _w, ...restConfig } = config
  form.value = {
    name: mod.name,
    description: mod.description || '',
    order: mod.order,
    widgets: Object.entries(wc).map(([k, v]: [string, any]) => ({
      key: k,
      name: v.name || k,
      enabled: v.enabled,
    })),
    moduleConfig: { ...restConfig },
  }
  showForm.value = true;
}

async function save() {
  if (!editing.value) return;
  const payload: any = {
    name: form.value.name,
    description: form.value.description,
    order: form.value.order,
  }
  const configPayload: Record<string, any> = { ...form.value.moduleConfig }
  if (form.value.widgets.length) {
    const wc: Record<string, { enabled: boolean }> = {}
    for (const w of form.value.widgets) {
      wc[w.key] = { enabled: w.enabled }
    }
    configPayload.widgets = wc
  }
  payload.config = configPayload
  await $api.put(`/modules/${editing.value.id}`, payload);
  showForm.value = false;
  await load();
}

async function toggle(mod: any) {
  await $api.put(`/modules/${mod.id}`, { enabled: !mod.enabled });
  await load();
}

async function remove(mod: any) {
  await $api.delete(`/modules/${mod.id}`);
  await load();
}

onMounted(load);
</script>

<template>
  <div class="modules-section">
    <div class="header">
      <h2 class="card-title">Управление модулями</h2>
    </div>

    <div v-if="loading" class="loading">Загрузка...</div>

    <div v-else class="module-list">
      <div v-for="mod in modules" :key="mod.id" class="module-card">
        <div class="module-info">
          <div class="module-icon" v-html="mod.icon" />
          <div>
            <div class="module-name">{{ mod.name }}</div>
            <div class="module-meta">{{ mod.key }} · {{ mod.route }}</div>
            <div v-if="mod.description" class="module-desc">{{ mod.description }}</div>
          </div>
        </div>
        <div class="module-actions">
          <label class="toggle">
            <input type="checkbox" :checked="mod.enabled" @change="toggle(mod)" />
            <span class="slider" />
          </label>
          <button class="btn-ghost" @click="openEdit(mod)">✎</button>
          <button class="btn-ghost danger" @click="remove(mod)">✕</button>
        </div>
      </div>

      <p v-if="!modules.length" class="empty">Нет установленных модулей</p>
    </div>

    <div v-if="showForm" class="overlay" @click.self="showForm = false">
      <div class="modal">
        <h2>Редактировать модуль</h2>
        <form @submit.prevent="save" class="modal-form">
          <div class="field">
            <label>Название</label>
            <input v-model="form.name" />
          </div>
          <div class="field">
            <label>Описание</label>
            <input v-model="form.description" />
          </div>
          <div class="field">
            <label>Порядок</label>
            <input v-model.number="form.order" type="number" min="0" />
          </div>
          <div v-if="form.widgets.length" class="widgets-section">
            <label class="widgets-label">Виджеты дашборда</label>
            <label v-for="w in form.widgets" :key="w.key" class="widget-checkbox">
              <input type="checkbox" :checked="w.enabled" @change="w.enabled = !w.enabled" />
              <span>{{ w.name }}</span>
            </label>
          </div>

          <template v-if="editing?.key === 'orders'">
            <div class="section-divider" />
            <div class="field">
              <label>Префикс заказов</label>
              <input v-model="form.moduleConfig.orderPrefix" placeholder="ORD-" />
            </div>
            <div class="field">
              <label>Нумерация</label>
              <select v-model="form.moduleConfig.numberingType" class="input-select">
                <option value="global">Общая (сквозная)</option>
                <option value="org">Внутри организации</option>
              </select>
            </div>
          </template>

          <div class="modal-actions">
            <button type="submit" class="btn-primary">Сохранить</button>
            <button type="button" class="btn-ghost" @click="showForm = false">Отмена</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.modules-section {
  max-width: 800px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.loading {
  color: #64748b;
  font-size: 14px;
}

.module-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.module-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 16px;
}

.module-info {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.module-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  border-radius: 8px;
  color: #475569;
}

.module-name {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.module-meta {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

.module-desc {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
}

.module-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toggle {
  position: relative;
  display: inline-block;
  width: 36px;
  height: 20px;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    inset: 0;
    background: #cbd5e1;
    border-radius: 10px;
    cursor: pointer;
    transition: 0.15s;

    &::before {
      content: '';
      position: absolute;
      width: 16px;
      height: 16px;
      left: 2px;
      top: 2px;
      background: #fff;
      border-radius: 50%;
      transition: 0.15s;
    }
  }

  input:checked + .slider {
    background: #3b82f6;

    &::before {
      transform: translateX(16px);
    }
  }
}

.empty {
  color: #94a3b8;
  font-size: 14px;
  text-align: center;
  padding: 32px;
}

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal {
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  width: 100%;
  max-width: 480px;

  h2 {
    font-size: 18px;
    font-weight: 600;
    color: #0f172a;
    margin-bottom: 20px;
  }
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;

  label {
    font-size: 12px;
    font-weight: 500;
    color: #475569;
  }

  input {
    padding: 8px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 13px;
    color: #0f172a;

    &:focus {
      outline: none;
      border-color: #3b82f6;
    }
  }
}

.modal-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.btn-primary {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  background: #3b82f6;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #2563eb;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.section-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 4px 0;
}

.input-select {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  color: #0f172a;
  outline: none;
  background: #fff;
  font-family: inherit;
  &:focus { border-color: #3b82f6; }
}

.widgets-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.widgets-label {
  font-size: 12px;
  font-weight: 500;
  color: #475569;
}

.widget-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #0f172a;
  cursor: pointer;

  input { margin: 0; }
}

.btn-ghost {
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #64748b;
  font-size: 13px;
  cursor: pointer;

  &:hover {
    background: #f8fafc;
  }

  &.danger {
    color: #ef4444;

    &:hover {
      background: #fef2f2;
    }
  }
}
</style>
