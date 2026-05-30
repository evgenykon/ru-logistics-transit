<script setup lang="ts">
definePageMeta({ middleware: 'auth' });

const { $api } = useNuxtApp();
const auth = useAuthStore();

const activeTab = ref<'users' | 'roles'>('users');

// users tab
const users = ref<any[]>([]);
const loadingUsers = ref(true);
const search = ref('');

const canReadUsers = computed(() => auth.hasRole('admin') || auth.hasPermission('users:read'));
const canEditUsers = computed(() => auth.hasRole('admin') || auth.hasPermission('users:edit'));
const ADMIN_USER_ID = 'user_admin';

const filteredUsers = computed(() => {
  if (!canReadUsers.value) return [];
  const q = search.value.toLowerCase().trim();
  if (!q) return users.value;
  return users.value.filter(
    (u) =>
      (u.name && u.name.toLowerCase().includes(q)) ||
      u.email.toLowerCase().includes(q),
  );
});

// roles tab
const roles = ref<any[]>([]);
const allPermissions = ref<any[]>([]);
const organizations = ref<any[]>([]);
const loadingRoles = ref(true);

const canReadRoles = computed(() => auth.hasRole('admin') || auth.hasPermission('roles:read'));
const canEditRoles = computed(() => auth.hasRole('admin') || auth.hasPermission('roles:edit'));

const roleDeleteError = ref('');
const userDeleteError = ref('');

const showRoleModal = ref(false);
const editingRole = ref<any | null>(null);
const roleForm = ref({ name: '', description: '', permissionIds: [] as string[] });

function openCreateRole() {
  roleDeleteError.value = '';
  editingRole.value = null;
  roleForm.value = { name: '', description: '', permissionIds: [] };
  showRoleModal.value = true;
}

function openEditRole(role: any) {
  roleDeleteError.value = '';
  editingRole.value = role;
  roleForm.value = {
    name: role.name,
    description: role.description || '',
    permissionIds: role.permissions.map((p: any) => p.id),
  };
  showRoleModal.value = true;
}

function togglePermission(permId: string) {
  const idx = roleForm.value.permissionIds.indexOf(permId);
  if (idx === -1) {
    roleForm.value.permissionIds.push(permId);
  } else {
    roleForm.value.permissionIds.splice(idx, 1);
  }
}

async function saveRole() {
  const payload = {
    name: roleForm.value.name,
    description: roleForm.value.description || undefined,
    permissionIds: roleForm.value.permissionIds,
  };

  if (editingRole.value) {
    await $api.put(`/roles/${editingRole.value.id}`, payload);
  } else {
    await $api.post('/roles', payload);
  }

  showRoleModal.value = false;
  await loadRoles();
}

async function deleteCurrentRole() {
  if (!editingRole.value) return;
  roleDeleteError.value = '';
  try {
    await $api.delete(`/roles/${editingRole.value.id}`);
    showRoleModal.value = false;
    await loadRoles();
  } catch (err: any) {
    roleDeleteError.value = err?.response?.data?.message || 'Ошибка при удалении роли';
  }
}

// user modal (create/edit)
const showUserModal = ref(false);
const editingUserId = ref<string | null>(null);
const userForm = ref({
  email: '',
  name: '',
  phone: '',
  password: '',
  roleIds: [] as string[],
  organizationId: '',
});

function openCreateUser() {
  editingUserId.value = null;
  userForm.value = { email: '', name: '', phone: '', password: '', roleIds: [], organizationId: '' };
  showUserModal.value = true;
}

function openEditUser(user: any) {
  editingUserId.value = user.id;
  userForm.value = {
    email: user.email,
    name: user.name || '',
    phone: user.phone || '',
    password: '',
    roleIds: user.roles.map((r: any) => r.id),
    organizationId: user.organizationId || '',
  };
  showUserModal.value = true;
}

function toggleUserRole(roleId: string) {
  const idx = userForm.value.roleIds.indexOf(roleId);
  if (idx === -1) {
    userForm.value.roleIds.push(roleId);
  } else {
    userForm.value.roleIds.splice(idx, 1);
  }
}

async function saveUser() {
  const payload = {
    email: userForm.value.email,
    name: userForm.value.name || undefined,
    phone: userForm.value.phone || undefined,
    roleIds: userForm.value.roleIds,
    organizationId: userForm.value.organizationId || undefined,
  } as any;

  if (userForm.value.password) {
    payload.password = userForm.value.password;
  }

  if (editingUserId.value) {
    await $api.put(`/users/${editingUserId.value}`, payload);
  } else {
    await $api.post('/users', payload);
  }

  showUserModal.value = false;
  await loadUsers();
}

async function deleteCurrentUser() {
  if (!editingUserId.value) return;
  userDeleteError.value = '';
  try {
    await $api.delete(`/users/${editingUserId.value}`);
    showUserModal.value = false;
    await loadUsers();
  } catch (err: any) {
    userDeleteError.value = err?.response?.data?.message || 'Ошибка при удалении пользователя';
  }
}

// user roles modal
const showUserRolesModal = ref(false);
const editingUserRoles = ref<any | null>(null);
const userRoleIds = ref<string[]>([]);

function openUserRoles(user: any) {
  editingUserRoles.value = user;
  userRoleIds.value = user.roles.map((r: any) => r.id);
  showUserRolesModal.value = true;
}

function toggleUserRoleOnly(roleId: string) {
  const idx = userRoleIds.value.indexOf(roleId);
  if (idx === -1) {
    userRoleIds.value.push(roleId);
  } else {
    userRoleIds.value.splice(idx, 1);
  }
}

async function saveUserRoles() {
  if (!editingUserRoles.value) return;
  await $api.put(`/users/${editingUserRoles.value.id}/roles`, { roleIds: userRoleIds.value });
  showUserRolesModal.value = false;
  await loadUsers();
}

// data loading
async function loadUsers() {
  const { data } = await $api.get('/users');
  users.value = data;
}

async function loadRoles() {
  const { data } = await $api.get('/roles');
  roles.value = data;
}

async function loadPermissions() {
  const { data } = await $api.get('/permissions');
  allPermissions.value = data;
}

async function loadOrganizations() {
  try {
    const { data } = await $api.get('/organizations');
    organizations.value = data;
  } catch {
    organizations.value = [];
  }
}

onMounted(async () => {
  try {
    await Promise.all([loadUsers(), loadRoles(), loadPermissions(), loadOrganizations()]);
  } finally {
    loadingUsers.value = false;
    loadingRoles.value = false;
  }
});
</script>

<template>
  <div class="page">
    <h1 class="page-title">Пользователи</h1>

    <div class="tabs">
      <button
        class="tab"
        :class="{ active: activeTab === 'users' }"
        @click="activeTab = 'users'"
      >
        Пользователи
      </button>
      <button
        class="tab"
        :class="{ active: activeTab === 'roles' }"
        @click="activeTab = 'roles'"
      >
        Роли
      </button>
    </div>

    <div v-if="activeTab === 'users'">
      <div v-if="!canReadUsers" class="no-access">
        Недостаточно прав для просмотра пользователей
      </div>

      <template v-else>
        <div class="section-header">
          <div class="search-bar">
            <input
              v-model="search"
              type="text"
              placeholder="Поиск по имени или логину..."
              class="search-input"
            />
          </div>
          <button v-if="canEditUsers" class="btn-primary" @click="openCreateUser">
            + Добавить пользователя
          </button>
        </div>

        <table class="data-table" v-if="filteredUsers.length">
          <thead>
            <tr>
              <th>Имя</th>
              <th>Логин</th>
              <th>Телефон</th>
              <th>Роли</th>
              <th>Организации</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="u in filteredUsers"
              :key="u.id"
              :class="{ clickable: canEditUsers }"
              @click="canEditUsers && openEditUser(u)"
            >
              <td class="cell-name">{{ u.name || '—' }}</td>
              <td>{{ u.email }}</td>
              <td>{{ u.phone || '—' }}</td>
              <td>
                <span v-for="(r, i) in u.roles" :key="r.id" class="role-badge">
                  {{ r.name }}<span v-if="i < u.roles.length - 1"> </span>
                </span>
                <span v-if="!u.roles.length" class="no-role">—</span>
              </td>
              <td>{{ u.organization?.name || '—' }}</td>
            </tr>
          </tbody>
        </table>

        <p v-else class="empty">
          {{ search ? 'Нет пользователей по вашему запросу' : 'Пользователи не найдены' }}
        </p>
      </template>
    </div>

    <div v-else>
      <div v-if="!canReadRoles" class="no-access">
        Недостаточно прав для просмотра ролей
      </div>

      <template v-else>
        <div class="section-header">
          <h2 class="section-title">Список ролей</h2>
          <button v-if="canEditRoles" class="btn-primary" @click="openCreateRole">
            + Создать роль
          </button>
        </div>

        <div v-if="loadingRoles" class="loading">Загрузка...</div>

        <div v-else class="list">
          <div v-for="role in roles" :key="role.id" class="card">
            <div class="card-body">
              <div class="card-name">{{ role.name }}</div>
              <div v-if="role.description" class="card-desc">{{ role.description }}</div>
              <div class="card-roles">
                {{ role.permissions?.map((p: any) => p.name).join(', ') }}
              </div>
            </div>
            <button
              v-if="canEditRoles"
              class="btn-ghost"
              @click="openEditRole(role)"
            >
              ✎
            </button>
          </div>

          <p v-if="!roles.length" class="empty">Роли не найдены</p>
        </div>
      </template>
    </div>

    <!-- role modal -->
    <div v-if="showRoleModal" class="overlay" @click.self="showRoleModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2 class="modal-title">{{ editingRole ? 'Редактировать роль' : 'Создать роль' }}</h2>
        </div>

        <div class="modal-body">
          <form @submit.prevent="saveRole" class="modal-form">
            <div class="field">
              <label>Название</label>
              <input v-model="roleForm.name" placeholder="operator" />
            </div>
            <div class="field">
              <label>Описание</label>
              <input v-model="roleForm.description" placeholder="Оператор системы" />
            </div>

            <div class="field">
              <label>Доступы</label>
              <div class="perms-scroll">
                <label v-for="perm in allPermissions" :key="perm.id" class="perm-row">
                  <input
                    type="checkbox"
                    :checked="roleForm.permissionIds.includes(perm.id)"
                    @change="togglePermission(perm.id)"
                  />
                  <span class="perm-name">{{ perm.name }}</span>
                  <span v-if="perm.description" class="perm-desc">{{ perm.description }}</span>
                </label>
              </div>
            </div>

            <div v-if="roleDeleteError" class="error-msg">{{ roleDeleteError }}</div>
          </form>
        </div>

        <div class="modal-footer">
          <button v-if="editingRole && editingRole.id !== 'role_admin'" type="button" class="btn-danger" @click="deleteCurrentRole">
            Удалить роль
          </button>
          <div class="modal-actions-right">
            <button type="button" class="btn-primary" @click="saveRole">
              {{ editingRole ? 'Сохранить' : 'Создать' }}
            </button>
            <button type="button" class="btn-ghost" @click="showRoleModal = false">
              Отмена
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- user create/edit modal -->
    <div v-if="showUserModal" class="overlay" @click.self="showUserModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2 class="modal-title">{{ editingUserId ? 'Редактировать пользователя' : 'Добавить пользователя' }}</h2>
        </div>

        <div class="modal-body">
          <div v-if="editingUserId === ADMIN_USER_ID" class="protected-notice">
            Системного пользователя admin нельзя редактировать
          </div>

          <form @submit.prevent="saveUser" class="modal-form">
            <div class="field">
              <label>Логин</label>
              <input v-model="userForm.email" type="text" placeholder="ivanov" :disabled="editingUserId === ADMIN_USER_ID" />
            </div>
            <div class="field">
              <label>Имя</label>
              <input v-model="userForm.name" type="text" placeholder="Иван Иванов" :disabled="editingUserId === ADMIN_USER_ID" />
            </div>
            <div class="field">
              <label>Телефон</label>
              <input v-model="userForm.phone" type="text" placeholder="+7 900 000-00-00" autocomplete="off" :disabled="editingUserId === ADMIN_USER_ID" />
            </div>
            <div class="field">
              <label>{{ editingUserId ? 'Новый пароль (оставьте пустым, чтобы не менять)' : 'Пароль' }}</label>
              <input v-model="userForm.password" type="password" placeholder="••••••" autocomplete="new-password" :disabled="editingUserId === ADMIN_USER_ID" />
            </div>

            <div class="field">
              <label>Роли</label>
              <div class="perms-scroll">
                <label v-for="role in roles" :key="role.id" class="perm-row">
                  <input
                    type="checkbox"
                    :checked="userForm.roleIds.includes(role.id)"
                    @change="toggleUserRole(role.id)"
                    :disabled="editingUserId === ADMIN_USER_ID"
                  />
                  <span class="perm-name">{{ role.name }}</span>
                  <span v-if="role.description" class="perm-desc">{{ role.description }}</span>
                </label>
              </div>
            </div>

            <div class="field">
              <label>Организации</label>
              <select
                v-model="userForm.organizationId"
                class="select-input"
                :disabled="editingUserId === ADMIN_USER_ID"
              >
                <option value="">— Без организации —</option>
                <option v-for="org in organizations" :key="org.id" :value="org.id">
                  {{ org.name }} ({{ org.inn }})
                </option>
              </select>
            </div>

            <div v-if="userDeleteError" class="error-msg">{{ userDeleteError }}</div>
          </form>
        </div>

        <div class="modal-footer">
          <button
            v-if="editingUserId && editingUserId !== ADMIN_USER_ID"
            type="button"
            class="btn-danger"
            @click="deleteCurrentUser"
          >
            Удалить пользователя
          </button>
          <div class="modal-actions-right">
            <button
              v-if="editingUserId !== ADMIN_USER_ID"
              type="button"
              class="btn-primary"
              @click="saveUser"
            >
              {{ editingUserId ? 'Сохранить' : 'Создать' }}
            </button>
            <button type="button" class="btn-ghost" @click="showUserModal = false">Закрыть</button>
          </div>
        </div>
      </div>
    </div>

    <!-- user roles modal -->
    <div v-if="showUserRolesModal" class="overlay" @click.self="showUserRolesModal = false">
      <div class="modal">
        <h2 class="modal-title">
          Роли пользователя
          <span class="modal-subtitle">{{ editingUserRoles?.name || editingUserRoles?.email }}</span>
        </h2>

        <div v-if="editingUserRoles?.id === ADMIN_USER_ID" class="protected-notice">
          Системному пользователю admin нельзя изменить доступы
        </div>

        <form @submit.prevent="saveUserRoles" class="modal-form">
          <div class="field">
            <label>Назначенные роли</label>
            <div class="perms-scroll">
              <label
                v-for="role in roles"
                :key="role.id"
                class="perm-row"
                :class="{ disabled: editingUserRoles?.id === ADMIN_USER_ID }"
              >
                <input
                  type="checkbox"
                  :checked="userRoleIds.includes(role.id)"
                  @change="toggleUserRoleOnly(role.id)"
                  :disabled="editingUserRoles?.id === ADMIN_USER_ID"
                />
                <span class="perm-name">{{ role.name }}</span>
                <span v-if="role.description" class="perm-desc">{{ role.description }}</span>
                <span v-if="editingUserRoles?.id === ADMIN_USER_ID" class="lock-icon">🔒</span>
              </label>
            </div>
          </div>

          <div v-if="editingUserRoles?.id !== ADMIN_USER_ID" class="modal-actions">
            <button type="submit" class="btn-primary">Сохранить</button>
            <button type="button" class="btn-ghost" @click="showUserRolesModal = false">
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.page-title {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 24px;
}

.tabs {
  display: flex;
  gap: 0;
  border-bottom: 2px solid #e2e8f0;
  margin-bottom: 24px;
}

.tab {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  cursor: pointer;

  &:hover {
    color: #334155;
  }

  &.active {
    color: #3b82f6;
    border-bottom-color: #3b82f6;
  }
}

.loading {
  color: #64748b;
  font-size: 14px;
}

.no-access {
  color: #ef4444;
  font-size: 14px;
  padding: 32px 0;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.search-bar {
  flex: 1;
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

  &:focus {
    border-color: #3b82f6;
  }

  &::placeholder {
    color: #94a3b8;
  }
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

  tr:last-child td {
    border-bottom: none;
  }

  tr:hover td {
    background: #f8fafc;
  }

  tr.clickable {
    cursor: pointer;
  }
}

.cell-name {
  font-weight: 600;
}

.role-badge {
  display: inline-block;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 500;
  color: #3b82f6;
  background: #eff6ff;
  border-radius: 4px;
}

.no-role {
  color: #94a3b8;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 16px;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-name {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.card-desc {
  font-size: 12px;
  color: #64748b;
}

.card-roles {
  font-size: 12px;
  color: #3b82f6;
}

.empty {
  color: #94a3b8;
  font-size: 14px;
  text-align: center;
  padding: 32px;
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
}

.btn-ghost {
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #64748b;
  font-size: 13px;
  cursor: pointer;
  flex-shrink: 0;

  &:hover {
    background: #f8fafc;
  }
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

  &:hover {
    background: #dc2626;
  }
}

.error-msg {
  color: #ef4444;
  font-size: 13px;
}

.modal-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-top: 8px;
}

.modal-actions-right {
  display: flex;
  gap: 8px;
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
  width: 100%;
  max-width: 480px;
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

  input[type="text"],
  .select-input {
    padding: 8px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 13px;
    color: #0f172a;
    outline: none;
    background: #fff;

    &:focus {
      border-color: #3b82f6;
    }

    &:disabled {
      background: #f1f5f9;
      color: #94a3b8;
      cursor: not-allowed;
    }
  }
}

.perms-scroll {
  max-height: 240px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.perm-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;

  &:hover {
    background: #f8fafc;
  }

  &.disabled {
    cursor: not-allowed;
    opacity: 0.6;

    &:hover {
      background: transparent;
    }
  }

  input[type="checkbox"] {
    margin: 0;
  }
}

.lock-icon {
  margin-left: auto;
  font-size: 12px;
}

.protected-notice {
  background: #fef2f2;
  color: #ef4444;
  font-size: 13px;
  padding: 10px 12px;
  border-radius: 6px;
  margin-bottom: 16px;
}

.modal-subtitle {
  display: block;
  font-size: 13px;
  font-weight: 400;
  color: #64748b;
  margin-top: 4px;
}

.perm-name {
  font-weight: 500;
  color: #0f172a;
  min-width: 100px;
}

.perm-desc {
  color: #94a3b8;
  font-size: 12px;
}

</style>
