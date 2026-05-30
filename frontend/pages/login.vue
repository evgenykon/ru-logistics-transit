<script setup lang="ts">
definePageMeta({ middleware: 'guest', layout: false });

const auth = useAuthStore();
const router = useRouter();

const email = ref('');
const password = ref('');
const error = ref('');
const submitting = ref(false);

async function handleLogin() {
  error.value = '';
  submitting.value = true;
  try {
    await auth.login(email.value, password.value);
    await router.push('/');
  } catch (err: any) {
    error.value = err?.response?.data?.message || 'Ошибка входа';
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <img src="/images/logo.png" alt="Транзит" class="login-logo" />
      <h1 class="login-title">Транзит</h1>
      <p class="login-subtitle">Простая Система Логистики</p>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="field">
          <label for="email">Email</label>
          <input id="email" v-model="email" type="text" placeholder="admin" autocomplete="email" />
        </div>

        <div class="field">
          <label for="password">Пароль</label>
          <input id="password" v-model="password" type="password" placeholder="••••••" autocomplete="current-password" />
        </div>

        <p v-if="error" class="error">{{ error }}</p>

        <button type="submit" class="btn-primary" :disabled="submitting">
          {{ submitting ? 'Вход...' : 'Войти' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped lang="scss">
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
}

.login-card {
  background: #1e293b;
  border-radius: 16px;
  padding: 48px 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
}

.login-logo {
  display: block;
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  object-fit: contain;
}

.login-title {
  font-family: 'Roboto Flex', system-ui, sans-serif;
  font-size: 28px;
  font-weight: 700;
  color: #f1f5f9;
  text-align: center;
  margin-bottom: 4px;
}

.login-subtitle {
  font-size: 14px;
  color: #94a3b8;
  text-align: center;
  margin-bottom: 32px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: 13px;
    font-weight: 500;
    color: #cbd5e1;
  }

  input {
    padding: 10px 14px;
    border-radius: 8px;
    border: 1px solid #334155;
    background: #0f172a;
    color: #f1f5f9;
    font-size: 14px;
    outline: none;
    transition: border-color 0.15s;

    &::placeholder {
      color: #475569;
    }

    &:focus {
      border-color: #3b82f6;
    }
  }
}

.error {
  color: #ef4444;
  font-size: 13px;
  text-align: center;
}

.btn-primary {
  padding: 10px 16px;
  border-radius: 8px;
  border: none;
  background: #3b82f6;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: #2563eb;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
