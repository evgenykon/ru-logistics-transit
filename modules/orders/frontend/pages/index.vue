<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { $api } = useNuxtApp()
const route = useRoute()

interface Cargo {
  id: string
  name: string
  weight: number | null
  volume: number | null
  quantity: number
  unit: string
}

interface Order {
  id: string
  number: string
  status: string
  description: string | null
  organizationId: string | null
  organization: { id: string; name: string } | null
  createdBy: { id: string; name: string | null; email: string } | null
  cargos: Cargo[]
  createdAt: string
}

const orders = ref<Order[]>([])
const organizations = ref<{ id: string; name: string }[]>([])
const search = ref('')
const loading = ref(true)
const saving = ref(false)
const orderPrefix = ref('')
const errorMsg = ref('')
const toast = ref<{ message: string; type: 'success' | 'error' } | null>(null)

function showToast(message: string, type: 'success' | 'error' = 'success') {
  toast.value = { message, type }
  setTimeout(() => { toast.value = null }, 3000)
}

const modulesStore = useModulesStore()
const hasTransport = computed(() => modulesStore.modules.some((m: any) => m.key === 'transport' && m.enabled))
const hasCounterparties = computed(() => modulesStore.modules.some((m: any) => m.key === 'counterparties' && m.enabled))
const hasWarehouses = computed(() => modulesStore.modules.some((m: any) => m.key === 'warehouses' && m.enabled))
const vehicles = ref<any[]>([])
const counterparties = ref<any[]>([])
const warehouses = ref<any[]>([])

const form = ref({
  number: '',
  status: 'draft',
  description: '',
  organizationId: '',
  vehicleId: '',
  counterpartyId: '',
  warehouseId: '',
  cargos: [] as { name: string; weight: number | null; volume: number | null; quantity: number; unit: string }[],
})

const events = ref<any[]>([])
const eventsLoading = ref(false)
const initialForm = ref('')

function formSnapshot() {
  return JSON.stringify({ ...form.value, cargos: form.value.cargos.map(c => ({ ...c })) })
}

function resetDirty() {
  initialForm.value = formSnapshot()
}

const isDirty = computed(() => formSnapshot() !== initialForm.value)

const statusLabels: Record<string, string> = {
  draft: 'Черновик',
  active: 'Активен',
  completed: 'Завершён',
  cancelled: 'Отменён',
}

const statusColors: Record<string, string> = {
  draft: 'color: #64748b; background: #f1f5f9;',
  active: 'color: #1d4ed8; background: #dbeafe;',
  completed: 'color: #15803d; background: #dcfce7;',
  cancelled: 'color: #dc2626; background: #fee2e2;',
}

const isNew = computed(() => route.query.new !== undefined)
const editId = computed(() => route.query.id as string | undefined)
const isForm = computed(() => isNew.value || editId.value)
const activeTab = ref('main')

const filtered = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return orders.value
  return orders.value.filter((o) =>
    o.number.toLowerCase().includes(q) ||
    (o.description || '').toLowerCase().includes(q),
  )
})

async function load() {
  loading.value = true
  try {
    const [{ data: ordersData }, { data: orgsData }, { data: modules }] = await Promise.all([
      $api.get('/orders'),
      $api.get('/organizations'),
      $api.get('/modules'),
    ])
    orders.value = ordersData
    organizations.value = orgsData
    const ordersMod = modules.find((m: any) => m.key === 'orders')
    orderPrefix.value = ordersMod?.config?.orderPrefix || ''

    hasTransport.value = modules.some((m: any) => m.key === 'transport' && m.enabled)
    hasCounterparties.value = modules.some((m: any) => m.key === 'counterparties' && m.enabled)
    hasWarehouses.value = modules.some((m: any) => m.key === 'warehouses' && m.enabled)

    const fetches: Promise<any>[] = []
    if (hasTransport.value) fetches.push($api.get('/vehicles').then(r => vehicles.value = r.data))
    if (hasCounterparties.value) fetches.push($api.get('/counterparties').then(r => counterparties.value = r.data.filter((c: any) => c.status === 'active')))
    if (hasWarehouses.value) fetches.push($api.get('/warehouses').then(r => warehouses.value = r.data.filter((w: any) => w.status === 'active')))
    await Promise.all(fetches)

    if (isNew.value && orgsData.length === 1) {
      form.value.organizationId = orgsData[0].id
    }
  } finally {
    loading.value = false
  }
}

async function loadEvents(id: string) {
  eventsLoading.value = true
  try {
    const { data } = await $api.get(`/orders/${id}/events`)
    events.value = data
  } catch {
    events.value = []
  } finally {
    eventsLoading.value = false
  }
}

async function loadOrder(id: string) {
  try {
    const { data } = await $api.get('/orders')
    const order = data.find((o: any) => o.id === id)
    if (!order) return
    form.value = {
      number: order.number,
      status: order.status,
      description: order.description || '',
      organizationId: order.organizationId || '',
      vehicleId: order.vehicleId || '',
      counterpartyId: order.counterpartyId || '',
      warehouseId: order.warehouseId || '',
      cargos: order.cargos.map((c: any) => ({ name: c.name, weight: c.weight, volume: c.volume, quantity: c.quantity, unit: c.unit })),
    }
    resetDirty()
  } catch {
    errorMsg.value = 'Ошибка загрузки заказа'
  }
}

watch(editId, (id) => {
  if (id) {
    activeTab.value = 'main'
    form.value = { number: '', status: 'draft', description: '', organizationId: '', vehicleId: '', counterpartyId: '', warehouseId: '', cargos: [] }
    errorMsg.value = ''
    loadOrder(id)
    loadEvents(id)
  }
}, { immediate: true })

watch(isNew, (val) => {
  if (val) {
    activeTab.value = 'main'
    form.value = { number: '', status: 'draft', description: '', organizationId: '', vehicleId: '', counterpartyId: '', warehouseId: '', cargos: [] }
    errorMsg.value = ''
    if (organizations.value.length === 1) {
      form.value.organizationId = organizations.value[0].id
    }
    resetDirty()
  }
}, { immediate: true })

watch(isNew, (val) => {
  if (val) {
    form.value = { number: '', status: 'draft', description: '', organizationId: '', cargos: [] }
    errorMsg.value = ''
    if (organizations.value.length === 1) {
      form.value.organizationId = organizations.value[0].id
    }
  }
})

watch(() => route.query, () => {
  if (!isNew.value && !editId.value) {
    load()
  }
})

function goToList() {
  navigateTo('/modules/orders', { replace: true })
}

function goToNew() {
  navigateTo('/modules/orders?new', { replace: true })
}

function goToOrder(id: string) {
  navigateTo(`/modules/orders?id=${id}`, { replace: true })
}

async function save() {
  errorMsg.value = ''
  saving.value = true
  try {
    if (editId.value) {
      await $api.put(`/orders/${editId.value}`, form.value)
      await loadOrder(editId.value)
      await loadEvents(editId.value)
      showToast('Заказ сохранён')
    } else {
      const { data } = await $api.post('/orders', form.value)
      await load()
      showToast('Заказ создан')
      setTimeout(() => navigateTo(`/modules/orders?id=${data.id}`, { replace: true }), 500)
    }
  } catch (err: any) {
    errorMsg.value = err?.response?.data?.message || 'Ошибка сохранения'
    showToast(errorMsg.value, 'error')
  } finally {
    saving.value = false
  }
}

async function remove() {
  if (!editId.value) return
  if (!confirm(`Удалить заказ?`)) return
  try {
    await $api.delete(`/orders/${editId.value}`)
    await load()
    goToList()
  } catch {
    errorMsg.value = 'Ошибка удаления'
  }
}

function addCargo() {
  form.value.cargos.push({ name: '', weight: null, volume: null, quantity: 1, unit: 'шт' })
}

function removeCargo(index: number) {
  form.value.cargos.splice(index, 1)
}

onMounted(load)
</script>

<template>
  <div class="page">
    <div v-if="toast" class="toast" :class="'toast-' + toast.type">{{ toast.message }}</div>
    <!-- List View -->
    <template v-if="!isForm">
      <div class="page-header">
        <h1 class="page-title">Заказы</h1>
        <button class="btn-primary" @click="goToNew">+ Создать заказ</button>
      </div>

      <div class="search-bar">
        <input v-model="search" type="text" placeholder="Поиск по номеру или описанию..." class="search-input" />
      </div>

      <div v-if="loading" class="loading">Загрузка...</div>

      <table v-else-if="filtered.length" class="data-table">
        <thead>
          <tr>
            <th>Номер</th>
            <th>Статус</th>
            <th>Описание</th>
            <th>Грузы</th>
            <th>Дата</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in filtered" :key="order.id" class="clickable" @click="goToOrder(order.id)">
            <td class="cell-name">{{ order.number }}</td>
            <td>
              <span class="status-badge" :style="statusColors[order.status]">{{ statusLabels[order.status] }}</span>
            </td>
            <td class="cell-desc">{{ order.description || '—' }}</td>
            <td>{{ order.cargos.length }} шт</td>
            <td class="cell-date">{{ new Date(order.createdAt).toLocaleDateString('ru-RU') }}</td>
            <td class="col-actions" @click.stop>
              <button class="btn-icon danger" @click="remove(order)" title="Удалить">✕</button>
            </td>
          </tr>
        </tbody>
      </table>

      <p v-else class="empty">{{ search ? 'Нет заказов по запросу' : 'Нет заказов' }}</p>
    </template>
    <template v-else>
      <div class="page-header">
        <button class="btn-back" @click="goToList">← Назад к списку</button>
        <h1 class="page-title">{{ editId ? 'Редактировать заказ' : 'Новый заказ' }}</h1>
        <div />
      </div>

      <div class="form-card">
        <div class="tabs">
          <button class="tab" :class="{ active: activeTab === 'main' }" @click="activeTab = 'main'">Основное</button>
          <button v-if="hasTransport" class="tab" :class="{ active: activeTab === 'transport' }" @click="activeTab = 'transport'">Транспорт</button>
          <button v-if="hasCounterparties" class="tab" :class="{ active: activeTab === 'counterparty' }" @click="activeTab = 'counterparty'">Контрагент</button>
          <button v-if="hasWarehouses" class="tab" :class="{ active: activeTab === 'warehouse' }" @click="activeTab = 'warehouse'">Склад</button>
          <button class="tab" :class="{ active: activeTab === 'cargos' }" @click="activeTab = 'cargos'">Грузы</button>
          <button v-if="editId" class="tab" :class="{ active: activeTab === 'history' }" @click="activeTab = 'history'">История</button>
        </div>

        <form @submit.prevent="save" class="order-form">
          <template v-if="activeTab === 'main'">
            <div class="form-row">
              <div v-if="editId" class="field flex-1">
                <label>Номер заказа</label>
                <input :value="form.number" class="input-readonly" readonly />
              </div>
              <div class="field field-status">
                <label>Статус</label>
                <select v-model="form.status" class="input-select">
                  <option value="draft">Черновик</option>
                  <option value="active">Активен</option>
                  <option value="completed">Завершён</option>
                  <option value="cancelled">Отменён</option>
                </select>
              </div>
            </div>
            <div class="field">
              <label>Описание</label>
              <textarea v-model="form.description" class="input-textarea" rows="3" />
            </div>
            <div class="field">
              <label>Организация</label>
              <select v-model="form.organizationId" class="input-select">
                <option value="">Без организации</option>
                <option v-for="org in organizations" :key="org.id" :value="org.id">{{ org.name }}</option>
              </select>
            </div>
          </template>

          <template v-if="activeTab === 'transport' && hasTransport">
            <div class="field">
              <label>Транспортное средство</label>
              <select v-model="form.vehicleId" class="input-select">
                <option value="">Не выбрано</option>
                <option v-for="v in vehicles" :key="v.id" :value="v.id">{{ v.licensePlate }} — {{ v.brand }} {{ v.model }}</option>
              </select>
            </div>
          </template>

          <template v-if="activeTab === 'counterparty' && hasCounterparties">
            <div class="field">
              <label>Контрагент</label>
              <select v-model="form.counterpartyId" class="input-select">
                <option value="">Не выбран</option>
                <option v-for="c in counterparties" :key="c.id" :value="c.id">{{ c.name }} ({{ c.inn }})</option>
              </select>
            </div>
          </template>

          <template v-if="activeTab === 'warehouse' && hasWarehouses">
            <div class="field">
              <label>Склад</label>
              <select v-model="form.warehouseId" class="input-select">
                <option value="">Не выбран</option>
                <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
              </select>
            </div>
          </template>

          <template v-if="activeTab === 'cargos'">
            <div class="cargo-section">
              <div class="cargo-header">
                <label>Грузы</label>
                <button type="button" class="btn-add-cargo" @click="addCargo">+ Добавить груз</button>
              </div>
              <div v-for="(cargo, i) in form.cargos" :key="i" class="cargo-row">
                <div class="field flex-1">
                  <label>Наименование</label>
                  <input v-model="cargo.name" placeholder="Наименование" />
                </div>
                <div class="field field-sm">
                  <label>Вес</label>
                  <input v-model.number="cargo.weight" type="number" placeholder="кг" />
                </div>
                <div class="field field-sm">
                  <label>Объём</label>
                  <input v-model.number="cargo.volume" type="number" placeholder="м³" />
                </div>
                <div class="field field-tiny">
                  <label>Кол-во</label>
                  <input v-model.number="cargo.quantity" type="number" min="1" />
                </div>
                <div class="field field-xs">
                  <label>Ед.</label>
                  <input v-model="cargo.unit" placeholder="шт" />
                </div>
                <button type="button" class="btn-remove-cargo" @click="removeCargo(i)">✕</button>
              </div>
            </div>
          </template>

          <template v-if="activeTab === 'history' && editId">
            <div class="timeline">
              <div v-for="ev in events" :key="ev.id" class="tl-item">
                <div class="tl-dot" />
                <div class="tl-body">
                  <div class="tl-text">{{ ev.description }}</div>
                  <div class="tl-time">{{ new Date(ev.createdAt).toLocaleString('ru-RU') }}</div>
                </div>
              </div>
              <p v-if="!eventsLoading && !events.length" class="empty">Нет событий</p>
              <div v-if="eventsLoading" class="loading">Загрузка...</div>
            </div>
          </template>

          <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>

          <div class="form-actions">
            <button v-if="editId" type="button" class="btn-danger" @click="remove">Удалить</button>
            <div class="form-actions-right">
              <button type="submit" class="btn-primary" :disabled="saving || !isDirty">{{ saving ? 'Сохранение...' : 'Сохранить' }}</button>
              <button type="button" class="btn-ghost" @click="goToList">Отмена</button>
            </div>
          </div>
        </form>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  gap: 12px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.btn-back {
  background: none;
  border: none;
  color: #3b82f6;
  font-size: 13px;
  cursor: pointer;
  padding: 4px 0;
  white-space: nowrap;
  &:hover { color: #2563eb; }
}

.search-bar { margin-bottom: 16px; }

.search-input {
  width: 100%;
  max-width: 320px;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  color: #0f172a;
  outline: none;
  &:focus { border-color: #3b82f6; }
  &::placeholder { color: #94a3b8; }
}

.loading { color: #64748b; font-size: 14px; }

.data-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;

  th {
    text-align: left;
    padding: 12px 16px;
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
  }

  td {
    padding: 12px 16px;
    font-size: 13px;
    color: #0f172a;
    border-bottom: 1px solid #f1f5f9;
  }

  tr:last-child td { border-bottom: none; }
  tr:hover td { background: #f8fafc; }
  tr.clickable { cursor: pointer; }
}

.cell-name { font-weight: 600; }
.cell-desc { color: #64748b; max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cell-date { font-size: 12px; color: #94a3b8; white-space: nowrap; }

.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.col-actions { width: 1%; white-space: nowrap; }

.btn-icon {
  padding: 4px 8px;
  border: none;
  background: none;
  color: #64748b;
  cursor: pointer;
  font-size: 14px;
  &:hover { color: #3b82f6; }
  &.danger:hover { color: #ef4444; }
}

.empty {
  color: #94a3b8;
  font-size: 14px;
  text-align: center;
  padding: 32px;
}

.form-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  max-width: 720px;
}

.tabs {
  display: flex;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
  overflow-x: auto;
}

.tab {
  padding: 12px 20px;
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  background: none;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: all 0.15s;

  &:hover { color: #0f172a; }
  &.active {
    color: #3b82f6;
    border-bottom-color: #3b82f6;
  }
}

.order-form {
  padding: 24px;
}

.timeline {
  position: relative;
  padding-left: 20px;
  max-height: 400px;
  overflow-y: auto;

  &::before {
    content: '';
    position: absolute;
    left: 5px;
    top: 4px;
    bottom: 4px;
    width: 2px;
    background: #e2e8f0;
  }
}

.tl-item {
  position: relative;
  padding-bottom: 10px;

  &:last-child { padding-bottom: 0; }
}

.tl-dot {
  position: absolute;
  left: -16px;
  top: 5px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #3b82f6;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px #e2e8f0;
}

.tl-body {
  padding: 2px 0;
}

.tl-text {
  font-size: 12px;
  color: #0f172a;
  line-height: 1.3;
}

.tl-time {
  font-size: 10px;
  color: #94a3b8;
  margin-top: 1px;
}

.order-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid #e2e8f0;
}

.form-actions-right {
  display: flex;
  gap: 8px;
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

  input, .input-select, .input-textarea {
    padding: 8px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 13px;
    color: #0f172a;
    outline: none;
    font-family: inherit;
    background: #fff;
    &:focus { border-color: #3b82f6; }
  }

  .input-textarea {
    resize: vertical;
    min-height: 48px;
  }
}

.flex-1 { flex: 1; }
.field-status { width: 160px; }
.field-sm { width: 100px; }
.field-tiny { width: 80px; }
.field-xs { width: 64px; }

.input-with-prefix {
  display: flex;
  align-items: stretch;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
  &:focus-within { border-color: #3b82f6; }

  input {
    flex: 1;
    border: none !important;
    border-radius: 0 !important;
    outline: none;
  }
}

.input-readonly {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  color: #64748b;
  background: #f8fafc;
  font-family: monospace;
  outline: none;
}

.input-prefix {
  display: flex;
  align-items: center;
  padding: 0 10px;
  font-size: 13px;
  color: #64748b;
  background: #f1f5f9;
  border-right: 1px solid #e2e8f0;
  white-space: nowrap;
  font-family: monospace;
}

.cargo-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cargo-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  label {
    font-size: 12px;
    font-weight: 500;
    color: #475569;
  }
}

.btn-add-cargo {
  font-size: 12px;
  color: #3b82f6;
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 4px;
  &:hover { color: #2563eb; }
}

.cargo-row {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  padding: 8px;
  background: #f8fafc;
  border-radius: 8px;
}

.btn-remove-cargo {
  padding: 4px 6px;
  border: none;
  background: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 12px;
  margin-bottom: 2px;
  &:hover { color: #ef4444; }
}

.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  z-index: 999;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  animation: toast-in 0.25s ease;
}

@keyframes toast-in {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.toast-success {
  background: #dcfce7;
  color: #15803d;
  border: 1px solid #bbf7d0;
}

.toast-error {
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.error-msg {
  color: #ef4444;
  font-size: 13px;
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
  &:hover { background: #2563eb; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.btn-danger {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  background: #ef4444;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  &:hover { background: #dc2626; }
}

.btn-ghost {
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #64748b;
  font-size: 13px;
  cursor: pointer;
  &:hover { background: #f8fafc; }
}
</style>
