<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import Stamp from '@/components/Stamp.vue'
import { useToastStore } from '@/stores/toastStore'

const router = useRouter()
const authStore = useAuthStore()
const toastStore = useToastStore()
const { t } = useI18n()

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const showPassword = ref(false)
const loading = ref(false)

async function handleLogin() {
  try {
    errorMessage.value = ''

    if (!email.value || !password.value) {
      errorMessage.value = 'Please enter both email and password.'
      return
    }

    loading.value = true

    await authStore.login(email.value, password.value)

    toastStore.success(t('toast.loginSuccess'))
    const redirectPath = router.currentRoute.value.query.redirect || '/'
    router.push(redirectPath)
  } catch (error) {
    toastStore.danger(
      error.response?.data?.message || t('toast.loginFailed')
    )
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="postcard-card">
      <div class="postcard-left">
        <Stamp image="/images/stamp-turtle.jpg" />

        <h2>Welcome Back</h2>
        <p>Continue your island memories and marine discoveries.</p>
      </div>

      <div class="postcard-right">
        <h1>Login</h1>
        <p class="subtitle">Sign in to your Reef Tales account.</p>

        <p v-if="errorMessage" class="text-danger small">
          {{ errorMessage }}
        </p>

        <form @submit.prevent="handleLogin" novalidate>
          <div class="mb-3">
            <label class="form-label">Email</label>
            <input
              v-model="email"
              type="email"
              class="form-control"
              placeholder="Enter your email"
              autocomplete="email"
              required
            />
          </div>

          <div class="mb-2">
            <label class="form-label">Password</label>
            <div class="input-group">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                class="form-control"
                placeholder="Enter your password"
                autocomplete="new-password"
                required
                maxlength="16"
              />

              <button class="btn btn-outline-secondary" type="button" @click="showPassword = !showPassword">
                <i :class="showPassword ? 'bi bi-eye-slash-fill' : 'bi bi-eye-fill'"></i>
              </button>
            </div>
          </div>

          <div class="text-end mb-3">
            <RouterLink to="/forgot-password" class="small auth-link">
              Forgot password?
            </RouterLink>
          </div>

          <button class="btn btn-primary w-100" :disabled="loading">
            {{ loading ? 'Logging in...' : 'Login' }}
          </button>
        </form>

        <div class="auth-links">
          <span>No account?</span>
          <RouterLink to="/register">Register</RouterLink>
        </div>
      </div>
  </div>
</template>

<style scoped>
.postcard-card {
  width: min(900px, 100%);
  min-height: 480px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  padding: 10px;
  background: repeating-linear-gradient(
    135deg,
    #e85d5d 0 12px,
    #ffffff 12px 24px,
    #2c9ab7 24px 36px,
    #ffffff 36px 48px
  );
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.15);
  position: relative;
  z-index: 2;
}

.postcard-left {
  position: relative;
  padding: 40px;
  background:
    linear-gradient(rgba(31, 78, 95, 0.1), rgba(31, 78, 95, 0.35)),
    url('/images/postcard.jpg');
  background-size: cover;
  background-position: center;
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: end;
}

.postcard-left h2 {
  color: white;
}

.postcard-right {
  padding: 48px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: var(--surface-soft);
  border-left: 1px solid rgba(0,0,0,0.06);
}

.subtitle {
  color: #6c757d;
}

.form-control {
  border-radius: 12px;
  padding: 12px 14px;
  border-color: #C4A484;
}

.btn {
  border-radius: 12px;
  padding: 12px;
}

.auth-link,
.auth-links a {
  color: #1f4e5f;
}

.auth-links {
  margin-top: 18px;
  display: flex;
  justify-content: center;
  gap: 8px;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .postcard-card {
    grid-template-columns: 1fr;
  }

  .postcard-left {
    min-height: 220px;
  }

  .postcard-right {
    padding: 32px 24px;
  }
}

.input-group .form-control {
  border-right: none;
}

.input-group .btn-outline-secondary {
  border-left: none;
  border-color: #C4A484;
  color: #1e293b;
  background: var(--surface);
}

.input-group .btn-outline-secondary:hover,
.input-group .btn-outline-secondary:focus,
.input-group .btn-outline-secondary:active {
  background: var(--surface) !important;
  color: #1e293b !important;
  border-color: #C4A484 !important;
  box-shadow: none !important;
}
</style>
