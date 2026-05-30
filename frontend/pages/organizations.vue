<script setup lang="ts">
definePageMeta({ middleware: 'auth' });

const { $api } = useNuxtApp();
const auth = useAuthStore();
const orgs = ref<any[]>([]);
const loading = ref(true);
const search = ref('');

const canRead = computed(() => auth.hasRole('admin') || auth.hasPermission('organizations:read'));
const canEdit = computed(() => auth.hasRole('admin') || auth.hasPermission('organizations:edit'));

const filtered = computed(() => {
  const q = search.value.toLowerCase().trim();
  if (!q) return orgs.value;
  return orgs.value.filter(
    (o) =>
      o.name.toLowerCase().includes(q) ||
      o.inn.includes(q),
  );
});

const showModal = ref(false);
const editingId = ref<string | null>(null);
const deleteError = ref('');
const form = ref({
  name: '',
  inn: '',
  kpp: '',
  ogrn: '',
  address: '',
  phone: '',
  email: '',
  contactPerson: '',
});

function openCreate() {
  deleteError.value = '';
  editingId.value = null;
  form.value = { name: '', inn: '', kpp: '', ogrn: '', address: '', phone: '', email: '', contactPerson: '' };
  showModal.value = true;
}

function openEdit(org: any) {
  deleteError.value = '';
  editingId.value = org.id;
  form.value = { ...org };
  showModal.value = true;
}

async function save() {
  deleteError.value = '';
  const payload = { ...form.value };
  try {
    if (editingId.value) {
      await $api.put(`/organizations/${editingId.value}`, payload);
    } else {
      await $api.post('/organizations', payload);
    }
    showModal.value = false;
    await load();
  } catch (err: any) {
    deleteError.value = err?.response?.data?.message || 'Ошибка при сохранении';
  }
}

async function remove() {
  if (!editingId.value) return;
  deleteError.value = '';
  try {
    await $api.delete(`/organizations/${editingId.value}`);
    showModal.value = false;
    await load();
  } catch (err: any) {
    deleteError.value = err?.response?.data?.message || 'Ошибка при удалении';
  }
}

async function load() {
  loading.value = true;
  try {
    const { data } = await $api.get('/organizations');
    orgs.value = data;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">Организации</h1>
      <button v-if="canEdit" class="btn-primary" @click="openCreate">+ Добавить</button>
    </div>

    <div v-if="!canRead" class="no-access">Недостаточно прав для просмотра организаций</div>

    <template v-else>
      <div class="search-bar">
        <input v-model="search" type="text" placeholder="Поиск по названию или ИНН..." class="search-input" />
      </div>

      <div v-if="loading" class="loading">Загрузка...</div>

      <table v-else-if="filtered.length" class="data-table">
        <thead>
          <tr>
            <th>Название</th>
            <th>ИНН</th>
            <th>КПП</th>
            <th>Телефон</th>
            <th>Контакты</th>
            <th v-if="canEdit"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="o in filtered" :key="o.id">
            <td class="cell-name">{{ o.name }}</td>
            <td>{{ o.inn }}</td>
            <td>{{ o.kpp || '—' }}</td>
            <td>{{ o.phone || '—' }}</td>
            <td>
              <div v-if="o.contactPerson" class="contact-person">{{ o.contactPerson }}</div>
              <div v-if="o.email" class="contact-email">{{ o.email }}</div>
            </td>
            <td v-if="canEdit" class="col-actions">
              <button class="btn-icon" @click="openEdit(o)" title="Редактировать">✎</button>
            </td>
          </tr>
        </tbody>
      </table>

      <p v-else class="empty">{{ search ? 'Нет организаций по запросу' : 'Организации не найдены' }}</p>
    </template>

    <div v-if="showModal" class="overlay" @click.self="showModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2 class="modal-title">{{ editingId ? 'Редактировать организацию' : 'Новая организация' }}</h2>
        </div>

        <div class="modal-body">
          <form @submit.prevent="save" class="modal-form">
            <div class="form-row">
              <div class="field flex-1">
                <label>Название</label>
                <input v-model="form.name" placeholder="ООО «Ромашка»" />
              </div>
              <div class="field field-inn">
                <label>ИНН</label>
                <input v-model="form.inn" placeholder="7701234567" />
              </div>
            </div>
            <div class="form-row">
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
              <input v-model="form.address" placeholder="г. Москва, ул. Ленина, д. 1" />
            </div>
            <div class="form-row">
              <div class="field flex-1">
                <label>Телефон</label>
                <input v-model="form.phone" placeholder="+7 495 000-00-00" />
              </div>
              <div class="field flex-1">
                <label>Email</label>
                <input v-model="form.email" placeholder="info@example.com" />
              </div>
            </div>
            <div class="field">
              <label>Контактное лицо</label>
              <input v-model="form.contactPerson" placeholder="Иванов Иван Иванович" />
            </div>

            <div v-if="deleteError" class="error-msg">{{ deleteError }}</div>
          </form>
        </div>

        <div class="modal-footer">
          <button
            v-if="editingId"
            type="button"
            class="btn-danger"
            @click="remove"
          >
            Удалить организацию
          </button>
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
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.no-access {
  color: #ef4444;
  font-size: 14px;
  padding: 32px 0;
}

.search-bar {
  margin-bottom: 16px;
}

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

.loading {
  color: #64748b;
  font-size: 14px;
}

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
}

.cell-name { font-weight: 600; }

.contact-person { font-size: 13px; color: #0f172a; }
.contact-email { font-size: 12px; color: #64748b; }

.col-actions {
  width: 1%;
  white-space: nowrap;
}

.btn-icon {
  padding: 4px 8px;
  border: none;
  background: none;
  color: #64748b;
  cursor: pointer;
  font-size: 14px;
  &:hover { color: #3b82f6; }
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
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal {
  background: #fff;
  border-radius: 12px;
  width: 100%;
  max-width: 560px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  padding: 24px 24px 0;
  flex-shrink: 0;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-shrink: 0;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-row {
  display: flex;
  gap: 12px;
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
    outline: none;
    &:focus { border-color: #3b82f6; }
  }
}

.flex-1 { flex: 1; }
.field-inn { width: 160px; }

.modal-actions-right {
  display: flex;
  gap: 8px;
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

.error-msg {
  color: #ef4444;
  font-size: 13px;
}
</style>
