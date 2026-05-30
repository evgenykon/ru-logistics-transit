<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { $api } = useNuxtApp()
const auth = useAuthStore()

const items = ref<any[]>([])
const organizations = ref<{ id: string; name: string }[]>([])
const search = ref('')
const loading = ref(true)
const showModal = ref(false)
const editingId = ref<string | null>(null)
const errorMsg = ref('')

const form = ref({
  name: '',
  type: 'legal',
  inn: '',
  kpp: '',
  ogrn: '',
  address: '',
  phone: '',
  email: '',
  contactPerson: '',
  status: 'active',
  notes: '',
  organizationId: '',
})

const canEdit = computed(() => auth.hasRole('admin') || auth.hasPermission('counterparties:edit'))

const filtered = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return items.value
  return items.value.filter((c) =>
    c.name.toLowerCase().includes(q) ||
    c.inn.includes(q),
  )
})

const typeLabels: Record<string, string> = {
  legal: 'Юрлицо',
  individual: 'ИП/Физлицо',
}

async function load() {
  loading.value = true
  try {
    const [{ data: cpData }, { data: orgsData }] = await Promise.all([
      $api.get('/counterparties'),
      $api.get('/organizations'),
    ])
    items.value = cpData
    organizations.value = orgsData
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  form.value = { name: '', type: 'legal', inn: '', kpp: '', ogrn: '', address: '', phone: '', email: '', contactPerson: '', status: 'active', notes: '', organizationId: '' }
  showModal.value = true
}

function openEdit(c: any) {
  editingId.value = c.id
  form.value = { ...c }
  showModal.value = true
}

async function save() {
  errorMsg.value = ''
  try {
    if (editingId.value) {
      await $api.put(`/counterparties/${editingId.value}`, form.value)
    } else {
      await $api.post('/counterparties', form.value)
    }
    showModal.value = false
    await load()
  } catch (err: any) {
    errorMsg.value = err?.response?.data?.message || 'Ошибка сохранения'
  }
}

async function remove() {
  if (!editingId.value) return
  errorMsg.value = ''
  try {
    await $api.delete(`/counterparties/${editingId.value}`)
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
    <div class="page-header">
      <h1 class="page-title">Контрагенты</h1>
      <button v-if="canEdit" class="btn-primary" @click="openCreate">+ Добавить контрагента</button>
    </div>

    <div class="search-bar">
      <input v-model="search" type="text" placeholder="Поиск по названию или ИНН..." class="search-input" />
    </div>

    <div v-if="loading" class="loading">Загрузка...</div>

    <table v-else-if="filtered.length" class="data-table">
      <thead>
        <tr>
          <th>Наименование</th>
          <th>Тип</th>
          <th>ИНН</th>
          <th>Телефон</th>
          <th>Контакты</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="c in filtered" :key="c.id">
          <td class="cell-name">{{ c.name }}</td>
          <td><span class="type-badge">{{ typeLabels[c.type] || c.type }}</span></td>
          <td class="cell-inn">{{ c.inn }}</td>
          <td>{{ c.phone || '—' }}</td>
          <td>
            <div v-if="c.contactPerson" class="contact-line">{{ c.contactPerson }}</div>
            <div v-if="c.email" class="contact-line">{{ c.email }}</div>
          </td>
          <td v-if="canEdit" class="col-actions">
            <button class="btn-icon" @click="openEdit(c)" title="Редактировать">✎</button>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-else class="empty">{{ search ? 'Нет контрагентов по запросу' : 'Нет контрагентов' }}</p>

    <div v-if="showModal" class="overlay" @click.self="showModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2 class="modal-title">{{ editingId ? 'Редактировать контрагента' : 'Новый контрагент' }}</h2>
        </div>

        <div class="modal-body">
          <form @submit.prevent="save" class="modal-form">
            <div class="form-row">
              <div class="field flex-1">
                <label>Наименование</label>
                <input v-model="form.name" placeholder="ООО «Поставщик»" />
              </div>
              <div class="field field-type-c">
                <label>Тип</label>
                <select v-model="form.type" class="input-select">
                  <option value="legal">Юрлицо</option>
                  <option value="individual">ИП/Физлицо</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="field flex-1">
                <label>ИНН</label>
                <input v-model="form.inn" placeholder="7701234567" />
              </div>
              <div class="field flex-1">
                <label>КПП</label>
                <input v-model="form.kpp" placeholder="770101001" />
              </div>
              <div class="field flex-1">
                <label>ОГРН</label>
                <input v-model="form.ogrn" placeholder="1027700123456" />
              </div>
            </div>
            <div class="field">
              <label>Адрес</label>
              <input v-model="form.address" placeholder="г. Москва, ул. Тверская, д. 1" />
            </div>
            <div class="form-row">
              <div class="field flex-1">
                <label>Телефон</label>
                <input v-model="form.phone" placeholder="+7 495 000-00-00" />
              </div>
              <div class="field flex-1">
                <label>Email</label>
                <input v-model="form.email" placeholder="info@supplier.com" />
              </div>
            </div>
            <div class="field">
              <label>Контактное лицо</label>
              <input v-model="form.contactPerson" placeholder="Петров Пётр" />
            </div>
            <div class="field">
              <label>Организация</label>
              <select v-model="form.organizationId" class="input-select">
                <option value="">Без организации</option>
                <option v-for="org in organizations" :key="org.id" :value="org.id">{{ org.name }}</option>
              </select>
            </div>
            <div class="field">
              <label>Примечание</label>
              <textarea v-model="form.notes" class="input-textarea" rows="2" />
            </div>
            <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
          </form>
        </div>

        <div class="modal-footer">
          <button v-if="editingId" type="button" class="btn-danger" @click="remove">Удалить контрагента</button>
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
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.page-title { font-size: 22px; font-weight: 700; color: #0f172a; margin: 0; }
.search-bar { margin-bottom: 16px; }
.search-input { width: 100%; max-width: 320px; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px; color: #0f172a; outline: none; &:focus { border-color: #3b82f6; } &::placeholder { color: #94a3b8; } }
.loading { color: #64748b; font-size: 14px; }

.data-table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;
  th { text-align: left; padding: 12px 16px; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
  td { padding: 12px 16px; font-size: 13px; color: #0f172a; border-bottom: 1px solid #f1f5f9; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: #f8fafc; }
}

.cell-name { font-weight: 600; }
.cell-inn { font-family: monospace; font-size: 12px; }
.type-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; color: #1d4ed8; background: #dbeafe; }
.contact-line { font-size: 12px; color: #64748b; }
.col-actions { width: 1%; white-space: nowrap; }
.btn-icon { padding: 4px 8px; border: none; background: none; color: #64748b; cursor: pointer; font-size: 14px; &:hover { color: #3b82f6; } }
.empty { color: #94a3b8; font-size: 14px; text-align: center; padding: 32px; }

.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 50; }
.modal { background: #fff; border-radius: 12px; width: 100%; max-width: 640px; max-height: 80vh; display: flex; flex-direction: column; overflow: hidden; }
.modal-header { padding: 24px 24px 0; flex-shrink: 0; }
.modal-title { font-size: 18px; font-weight: 600; color: #0f172a; margin: 0; }
.modal-body { padding: 20px 24px; overflow-y: auto; flex: 1; min-height: 0; }
.modal-footer { padding: 16px 24px; border-top: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-shrink: 0; }
.modal-form { display: flex; flex-direction: column; gap: 14px; }
.form-row { display: flex; gap: 12px; }

.field { display: flex; flex-direction: column; gap: 4px;
  label { font-size: 12px; font-weight: 500; color: #475569; }
  input, .input-select, .input-textarea { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px; color: #0f172a; outline: none; font-family: inherit; background: #fff; &:focus { border-color: #3b82f6; } }
  .input-textarea { resize: vertical; min-height: 48px; }
}

.flex-1 { flex: 1; }
.field-type-c { width: 150px; }

.modal-actions-right { display: flex; gap: 8px; }

.btn-primary { padding: 8px 16px; border-radius: 6px; border: none; background: #3b82f6; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; &:hover { background: #2563eb; } }
.btn-danger { padding: 8px 16px; border-radius: 6px; border: none; background: #ef4444; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; &:hover { background: #dc2626; } }
.btn-ghost { padding: 8px 16px; border-radius: 6px; border: 1px solid #e2e8f0; background: #fff; color: #64748b; font-size: 13px; cursor: pointer; &:hover { background: #f8fafc; } }
.error-msg { color: #ef4444; font-size: 13px; }
</style>
