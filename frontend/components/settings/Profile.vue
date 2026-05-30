<script setup lang="ts">
const auth = useAuthStore();
const { $api } = useNuxtApp();

const currentPassword = ref('');
const newPassword = ref('');
const newPasswordConfirm = ref('');
const error = ref('');
const success = ref('');
const submitting = ref(false);

async function handleChangePassword() {
  error.value = '';
  success.value = '';

  if (newPassword.value !== newPasswordConfirm.value) {
    error.value = 'Пароли не совпадают';
    return;
  }

  submitting.value = true;
  try {
    await $api.put('/auth/password', {
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
    });
    success.value = 'Пароль изменён';
    currentPassword.value = '';
    newPassword.value = '';
    newPasswordConfirm.value = '';
  } catch (err: any) {
    error.value = err?.response?.data?.message || 'Ошибка при смене пароля';
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="card">
    <h2 class="card-title">Профиль</h2>

    <div class="info-row">
      <span class="info-label">Имя</span>
      <span class="info-value">{{ auth.user?.name || '—' }}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Email</span>
      <span class="info-value">{{ auth.user?.email }}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Роли</span>
      <span class="info-value">{{ auth.user?.roles?.map((r) => r.name).join(', ') || '—' }}</span>
    </div>
  </div>

  <div class="card password-card">
    <h2 class="card-title">Смена пароля</h2>

    <form @submit.prevent="handleChangePassword" class="password-form">
      <div class="field">
        <label>Текущий пароль</label>
        <input v-model="currentPassword" type="password" placeholder="••••••" />
      </div>
      <div class="field">
        <label>Новый пароль</label>
        <input v-model="newPassword" type="password" placeholder="••••••" />
      </div>
      <div class="field">
        <label>Подтверждение</label>
        <input v-model="newPasswordConfirm" type="password" placeholder="••••••" />
      </div>

      <p v-if="error" class="error-msg">{{ error }}</p>
      <p v-if="success" class="success-msg">{{ success }}</p>

      <button type="submit" class="btn-primary" :disabled="submitting">
        {{ submitting ? 'Сохранение...' : 'Сменить пароль' }}
      </button>
    </form>
  </div>
</template>

<style scoped lang="scss">
.card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
}

.password-card {
  margin-top: 16px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;

  &:last-child {
    border-bottom: none;
  }
}

.info-label {
  width: 120px;
  font-size: 13px;
  color: #64748b;
  flex-shrink: 0;
}

.info-value {
  font-size: 14px;
  color: #0f172a;
}

.password-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 320px;
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

    &:focus {
      border-color: #3b82f6;
    }
  }
}

.error-msg {
  color: #ef4444;
  font-size: 13px;
}

.success-msg {
  color: #16a34a;
  font-size: 13px;
}

.btn-primary {
  align-self: flex-start;
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
</style>
