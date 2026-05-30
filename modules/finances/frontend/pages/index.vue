<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const { $api } = useNuxtApp()
const auth = useAuthStore()

const items = ref<any[]>([])
const counterparties = ref<{ id: string; name: string }[]>([])
const orders = ref<{ id: string; number: string }[]>([])
const search = ref('')
const loading = ref(true)
const showModal = ref(false)
const editingId = ref<string | null>(null)
const errorMsg = ref('')

const form = ref({
  type: 'expense',
  amount: null as number | null,
  currency: 'RUB',
  date: new Date().toISOString().slice(0, 10),
  description: '',
  category: '',
  counterpartyId: '',
  orderId: '',
  organizationId: '',
  status: 'completed',
})

const canEdit = computed(() => auth.hasRole('admin') || auth.hasPermission('finances:edit'))

const filtered = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return items.value
  return items.value.filter((t) =>
    (t.description || '').toLowerCase().includes(q) ||
    t.category?.toLowerCase().includes(q),
  )
})

const typeLabels: Record<string, string> = { income: 'Доход', expense: 'Расход' }
const typeColors: Record<string, string> = { income: 'color:#15803d;background:#dcfce7', expense: 'color:#dc2626;background:#fee2e2' }
const categoryLabels: Record<string, string> = {
  transport: 'Транспорт', fuel: 'Топливо', salary: 'Зарплата',
  warehouse: 'Склад', office: 'Офис', taxes: 'Налоги',
  client: 'Клиент', other: 'Прочее',
}

async function load() {
  loading.value = true
  try {
    const [{ data: txData }, { data: cpData }, { data: ordData }] = await Promise.all([
      $api.get('/finances'),
      $api.get('/counterparties'),
      $api.get('/orders'),
    ])
    items.value = txData
    counterparties.value = cpData
    orders.value = ordData
  } finally {
    loading.value = false
  }
}

const totalIncome = computed(() => items.value.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0))
const totalExpense = computed(() => items.value.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0))
const balance = computed(() => totalIncome.value - totalExpense.value)

function openCreate() {
  editingId.value = null
  form.value = { type: 'expense', amount: null, currency: 'RUB', date: new Date().toISOString().slice(0, 10), description: '', category: '', counterpartyId: '', orderId: '', organizationId: '', status: 'completed' }
  showModal.value = true
}

function openEdit(t: any) {
  editingId.value = t.id
  form.value = { ...t, date: t.date?.slice(0, 10) || new Date().toISOString().slice(0, 10) }
  showModal.value = true
}

async function save() {
  errorMsg.value = ''
  try {
    if (editingId.value) {
      await $api.put(`/finances/${editingId.value}`, form.value)
    } else {
      await $api.post('/finances', form.value)
    }
    showModal.value = false
    await load()
  } catch (err: any) {
    errorMsg.value = err?.response?.data?.message || 'Ошибка сохранения'
  }
}

async function remove() {
  if (!editingId.value) return
  try {
    await $api.delete(`/finances/${editingId.value}`)
    showModal.value = false
    await load()
  } catch (err: any) {
    errorMsg.value = err?.response?.data?.message || 'Ошибка удаления'
  }
}

onMounted(load)
</script>

<template>
  <div class="page">
    <div class="summary">
      <div class="summary-card income"><span class="s-label">Доходы</span><span class="s-value">{{ totalIncome.toLocaleString('ru-RU') }} ₽</span></div>
      <div class="summary-card expense"><span class="s-label">Расходы</span><span class="s-value">{{ totalExpense.toLocaleString('ru-RU') }} ₽</span></div>
      <div class="summary-card" :class="balance >= 0 ? 'income' : 'expense'"><span class="s-label">Баланс</span><span class="s-value">{{ balance.toLocaleString('ru-RU') }} ₽</span></div>
    </div>

    <div class="page-header">
      <h1 class="page-title">Финансы</h1>
      <button v-if="canEdit" class="btn-primary" @click="openCreate">+ Добавить</button>
    </div>

    <div v-if="loading" class="loading">Загрузка...</div>

    <table v-else-if="filtered.length" class="data-table">
      <thead>
        <tr>
          <th>Дата</th>
          <th>Тип</th>
          <th>Сумма</th>
          <th>Категория</th>
          <th>Описание</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="t in filtered" :key="t.id">
          <td class="cell-date">{{ new Date(t.date).toLocaleDateString('ru-RU') }}</td>
          <td><span class="type-badge" :style="typeColors[t.type]">{{ typeLabels[t.type] }}</span></td>
          <td class="cell-amount" :class="t.type === 'income' ? 'green' : 'red'">{{ t.type === 'income' ? '+' : '−' }}{{ Number(t.amount).toLocaleString('ru-RU') }} {{ t.currency }}</td>
          <td>{{ categoryLabels[t.category] || t.category || '—' }}</td>
          <td class="cell-desc">{{ t.description || '—' }}</td>
          <td v-if="canEdit" class="col-actions">
            <button class="btn-icon" @click="openEdit(t)" title="Редактировать">✎</button>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-else class="empty">Нет транзакций</p>

    <div v-if="showModal" class="overlay" @click.self="showModal = false">
      <div class="modal">
        <div class="modal-header"><h2 class="modal-title">{{ editingId ? 'Редактировать' : 'Новая транзакция' }}</h2></div>
        <div class="modal-body">
          <form @submit.prevent="save" class="modal-form">
            <div class="form-row">
              <div class="field flex-1">
                <label>Тип</label>
                <select v-model="form.type" class="input-select">
                  <option value="expense">Расход</option>
                  <option value="income">Доход</option>
                </select>
              </div>
              <div class="field field-amount">
                <label>Сумма</label>
                <input v-model.number="form.amount" type="number" step="0.01" placeholder="0.00" />
              </div>
              <div class="field field-curr">
                <label>Валюта</label>
                <select v-model="form.currency" class="input-select">
                  <option value="RUB">₽</option>
                  <option value="USD">$</option>
                  <option value="EUR">€</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="field flex-1">
                <label>Дата</label>
                <input v-model="form.date" type="date" class="input-select" />
              </div>
              <div class="field flex-1">
                <label>Категория</label>
                <select v-model="form.category" class="input-select">
                  <option value="">Без категории</option>
                  <option v-for="(l, k) in categoryLabels" :key="k" :value="k">{{ l }}</option>
                </select>
              </div>
            </div>
            <div class="field">
              <label>Описание</label>
              <input v-model="form.description" placeholder="Назначение платежа" />
            </div>
            <div class="field">
              <label>Контрагент</label>
              <select v-model="form.counterpartyId" class="input-select">
                <option value="">Не выбран</option>
                <option v-for="c in counterparties" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>
            <div class="field">
              <label>Заказ</label>
              <select v-model="form.orderId" class="input-select">
                <option value="">Не выбран</option>
                <option v-for="o in orders" :key="o.id" :value="o.id">{{ o.number }}</option>
              </select>
            </div>
            <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
          </form>
        </div>
        <div class="modal-footer">
          <button v-if="editingId" type="button" class="btn-danger" @click="remove">Удалить</button>
          <div class="modal-actions-right">
            <button type="button" class="btn-primary" @click="save">{{ editingId ? 'Сохранить' : 'Создать' }}</button>
            <button type="button" class="btn-ghost" @click="showModal = false">Отмена</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.summary { display: flex; gap: 16px; margin-bottom: 24px; }
.summary-card { flex: 1; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; display: flex; flex-direction: column; gap: 4px;
  &.income { border-left: 3px solid #15803d; }
  &.expense { border-left: 3px solid #dc2626; }
}
.s-label { font-size: 12px; color: #64748b; }
.s-value { font-size: 20px; font-weight: 700; color: #0f172a; }

.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.page-title { font-size: 22px; font-weight: 700; color: #0f172a; margin: 0; }
.loading { color: #64748b; font-size: 14px; }

.data-table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;
  th { text-align: left; padding: 12px 16px; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
  td { padding: 12px 16px; font-size: 13px; color: #0f172a; border-bottom: 1px solid #f1f5f9; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: #f8fafc; }
}

.cell-date { white-space: nowrap; font-size: 12px; color: #64748b; }
.cell-amount { font-weight: 700; font-variant-numeric: tabular-nums; &.green { color: #15803d; } &.red { color: #dc2626; } }
.cell-desc { color: #64748b; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.type-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
.col-actions { width: 1%; white-space: nowrap; }
.btn-icon { padding: 4px 8px; border: none; background: none; color: #64748b; cursor: pointer; font-size: 14px; &:hover { color: #3b82f6; } }
.empty { color: #94a3b8; font-size: 14px; text-align: center; padding: 32px; }

.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 50; }
.modal { background: #fff; border-radius: 12px; width: 100%; max-width: 600px; max-height: 80vh; display: flex; flex-direction: column; overflow: hidden; }
.modal-header { padding: 24px 24px 0; flex-shrink: 0; }
.modal-title { font-size: 18px; font-weight: 600; color: #0f172a; margin: 0; }
.modal-body { padding: 20px 24px; overflow-y: auto; flex: 1; min-height: 0; }
.modal-footer { padding: 16px 24px; border-top: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-shrink: 0; }
.modal-form { display: flex; flex-direction: column; gap: 14px; }
.form-row { display: flex; gap: 12px; }
.field { display: flex; flex-direction: column; gap: 4px;
  label { font-size: 12px; font-weight: 500; color: #475569; }
  input, .input-select { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px; color: #0f172a; outline: none; font-family: inherit; background: #fff; &:focus { border-color: #3b82f6; } }
}
.flex-1 { flex: 1; }
.field-amount { width: 140px; }
.field-curr { width: 90px; }
.modal-actions-right { display: flex; gap: 8px; }
.btn-primary { padding: 8px 16px; border-radius: 6px; border: none; background: #3b82f6; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; &:hover { background: #2563eb; } }
.btn-danger { padding: 8px 16px; border-radius: 6px; border: none; background: #ef4444; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; &:hover { background: #dc2626; } }
.btn-ghost { padding: 8px 16px; border-radius: 6px; border: 1px solid #e2e8f0; background: #fff; color: #64748b; font-size: 13px; cursor: pointer; &:hover { background: #f8fafc; } }
.error-msg { color: #ef4444; font-size: 13px; }
</style>
