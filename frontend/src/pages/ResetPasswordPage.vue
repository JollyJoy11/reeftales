<script setup>
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import Stamp from '@/components/Stamp.vue'
import { resetPassword } from '@/services/authService'
import { useToastStore } from '@/stores/toastStore'

const route = useRoute()
const router = useRouter()
const toastStore = useToastStore()

const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')

const passwordRules = computed(() => ({
  length: password.value.length >= 8 && password.value.length <= 16,
  uppercase: /[A-Z]/.test(password.value),
  lowercase: /[a-z]/.test(password.value),
  number: /\d/.test(password.value)
}))

const isPasswordValid = computed(() =>
  Object.values(passwordRules.value).every(Boolean)
)

function validateForm() {
  if (!password.value || !confirmPassword.value) {
    errorMessage.value = 'Please enter and confirm your new password.'
    return false
  }

  if (!isPasswordValid.value) {
    errorMessage.value =
      'Password must be 8-16 characters and include uppercase, lowercase, and a number.'
    return false
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match.'
    return false
  }

  return true
}

async function handleResetPassword() {
  try {
    errorMessage.value = ''

    if (!validateForm()) return

    loading.value = true
    await resetPassword(route.params.token, password.value)

    toastStore.success('Password reset successfully. Please log in.')
    router.push('/login')
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message || 'Unable to reset password.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="postcard-card">
      <div class="postcard-left">
        <Stamp image="/images/stamp-turtle.jpg" />

        <h2>Set A New Password</h2>
        <p>Choose a secure password before returning to your Reef Tales account.</p>
      </div>

      <div class="postcard-right">
        <h1>Reset Password</h1>
        <p class="subtitle">Your reset link is valid for 30 minutes.</p>

        <p v-if="errorMessage" class="text-danger small">
          {{ errorMessage }}
        </p>

        <form @submit.prevent="handleResetPassword" novalidate>
          <div class="mb-3">
            <label class="form-label">New password</label>
            <div class="input-group">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                class="form-control"
                placeholder="Create a new password"
                autocomplete="new-password"
                required
                maxlength="16"
              />

              <button class="btn btn-outline-secondary" type="button" @click="showPassword = !showPassword">
                <i :class="showPassword ? 'bi bi-eye-slash-fill' : 'bi bi-eye-fill'"></i>
              </button>
            </div>

            <ul class="password-rules mt-2 list-unstyled">
              <li :class="{ valid: passwordRules.length }">
                <i :class="passwordRules.length ? 'bi bi-check-circle-fill' : 'bi bi-circle'"></i>
                8-16 characters
              </li>
              <li :class="{ valid: passwordRules.uppercase }">
                <i :class="passwordRules.uppercase ? 'bi bi-check-circle-fill' : 'bi bi-circle'"></i>
                At least 1 uppercase letter
              </li>
              <li :class="{ valid: passwordRules.lowercase }">
                <i :class="passwordRules.lowercase ? 'bi bi-check-circle-fill' : 'bi bi-circle'"></i>
                At least 1 lowercase letter
              </li>
              <li :class="{ valid: passwordRules.number }">
                <i :class="passwordRules.number ? 'bi bi-check-circle-fill' : 'bi bi-circle'"></i>
                At least 1 number
              </li>
            </ul>
          </div>

          <div class="mb-3">
            <label class="form-label">Confirm new password</label>
            <div class="input-group">
              <input
                v-model="confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                class="form-control"
                placeholder="Confirm your new password"
                autocomplete="new-password"
                required
                maxlength="16"
              />

              <button class="btn btn-outline-secondary" type="button" @click="showConfirmPassword = !showConfirmPassword">
                <i :class="showConfirmPassword ? 'bi bi-eye-slash-fill' : 'bi bi-eye-fill'"></i>
              </button>
            </div>
          </div>

          <button class="btn btn-primary w-100" :disabled="loading">
            {{ loading ? 'Resetting password...' : 'Reset password' }}
          </button>
        </form>

        <div class="auth-links">
          <RouterLink to="/login">Back to login</RouterLink>
        </div>
      </div>
  </div>
</template>

<style scoped>
.postcard-card {
  width: min(900px, 100%);
  min-height: 500px;
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

.password-rules {
  font-size: 0.82rem;
  color: #6c757d;
  margin-bottom: 0;
}

.password-rules li {
  margin-bottom: 4px;
  transition: 0.2s ease;
}

.password-rules .valid {
  color: #198754;
}

.auth-links {
  margin-top: 18px;
  display: flex;
  justify-content: center;
  font-size: 0.9rem;
}

.auth-links a {
  color: #1f4e5f;
  font-weight: 800;
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
</style>
