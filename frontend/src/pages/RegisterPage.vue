<script setup>
import { ref, computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import AuthLayout from '@/layouts/AuthLayout.vue'
import Stamp from '@/components/Stamp.vue'
import { useToastStore } from '@/stores/toastStore'

const router = useRouter()
const authStore = useAuthStore()
const toastStore = useToastStore()

const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const errorMessage = ref('')
const loading = ref(false)

const usernameRules = computed(() => ({
  length: username.value.length >= 3 && username.value.length <= 20,
  validCharacters: /^[a-zA-Z0-9_]+$/.test(username.value)
}))

const isUsernameValid = computed(() => {
  return Object.values(usernameRules.value).every(Boolean)
})

const isEmailValid = computed(() => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)
})

const passwordRules = computed(() => ({
  length: password.value.length >= 8 && password.value.length <= 16,
  uppercase: /[A-Z]/.test(password.value),
  lowercase: /[a-z]/.test(password.value),
  number: /\d/.test(password.value)
}))

const isPasswordValid = computed(() => {
  return Object.values(passwordRules.value).every(Boolean)
})

function validateForm() {
  if (!username.value || !email.value || !password.value || !confirmPassword.value) {
    errorMessage.value = 'Please fill in all fields.'
    return false
  }

  if (!isUsernameValid.value) {
    errorMessage.value =
      'Username must be 3-20 characters and contain only letters, numbers, or underscores.'
    return false
  }

  if (!isEmailValid.value) {
    errorMessage.value =
      'Please enter a valid email address.'
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

async function handleRegister() {
  try {
    errorMessage.value = ''

    if (!validateForm()) return

    loading.value = true

    await authStore.register(username.value, email.value, password.value)

    toastStore.success('Account created successfully! Please log in.')
    router.push('/login')
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message || 'Registration failed. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthLayout>
    <div class="postcard-card">
      <div class="postcard-left">
        <Stamp image="/images/stamp-turtle.jpg" />

        <h2>Start Your Journey</h2>
        <p>Create your travel diary and record the marine life you discover.</p>
      </div>

      <div class="postcard-right d-flex flex-column justify-content-center">
          <h1>Register</h1>
          <p class="subtitle">Create your Reef Tales account.</p>

          <p v-if="errorMessage" class="text-danger small">
            {{ errorMessage }}
          </p>

          <form @submit.prevent="handleRegister" novalidate>
            <div class="mb-3">
              <label class="form-label">Username</label>

              <input
                v-model="username"
                type="text"
                class="form-control"
                placeholder="Choose a username"
                autocomplete="username"
                required
              />

              <ul class="password-rules mt-2 list-unstyled">
                <li :class="{ valid: usernameRules.length }">
                  <i :class="usernameRules.length
                    ? 'bi bi-check-circle-fill'
                    : 'bi bi-circle'"></i>

                  3-20 characters
                </li>

                <li :class="{ valid: usernameRules.validCharacters }">
                  <i :class="usernameRules.validCharacters
                    ? 'bi bi-check-circle-fill'
                    : 'bi bi-circle'"></i>

                  Letters, numbers, underscores only
                </li>
              </ul>
            </div>

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

              <p
                v-if="email"
                class="small mt-2"
                :class="isEmailValid ? 'text-success' : 'text-danger'"
              >
                <i :class="isEmailValid
                  ? 'bi bi-check-circle-fill'
                  : 'bi bi-x-circle-fill'"></i>

                {{ isEmailValid
                  ? 'Valid email address'
                  : 'Invalid email address' }}
              </p>
            </div>

            <div class="mb-3">
              <label class="form-label">Password</label>
              <div class="input-group">
                <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  class="form-control"
                  placeholder="Create a password"
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
                  <i :class="passwordRules.length
                    ? 'bi bi-check-circle-fill'
                    : 'bi bi-circle'"></i>

                  8-16 characters
                </li>

                <li :class="{ valid: passwordRules.uppercase }">
                  <i :class="passwordRules.uppercase
                    ? 'bi bi-check-circle-fill'
                    : 'bi bi-circle'"></i>

                  At least 1 uppercase letter
                </li>

                <li :class="{ valid: passwordRules.lowercase }">
                  <i :class="passwordRules.lowercase
                    ? 'bi bi-check-circle-fill'
                    : 'bi bi-circle'"></i>

                  At least 1 lowercase letter
                </li>

                <li :class="{ valid: passwordRules.number }">
                  <i :class="passwordRules.number
                    ? 'bi bi-check-circle-fill'
                    : 'bi bi-circle'"></i>

                  At least 1 number
                </li>
              </ul>
            </div>

            <div class="mb-3">
              <label class="form-label">Confirm Password</label>

              <div class="input-group">
                <input
                  v-model="confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  class="form-control"
                  placeholder="Confirm your password"
                  autocomplete="new-password"
                  required
                />

                <button class="btn btn-outline-secondary" type="button" @click="showConfirmPassword = !showConfirmPassword">
                  <i :class="showConfirmPassword ? 'bi bi-eye-slash-fill' : 'bi bi-eye-fill'"></i>
                </button>
              </div>

              <p
                v-if="confirmPassword"
                class="small mt-2"
                :class="password === confirmPassword ? 'text-success' : 'text-danger'"
              >
                <i :class="password === confirmPassword
                  ? 'bi bi-check-circle-fill'
                  : 'bi bi-x-circle-fill'"></i>

                {{ password === confirmPassword
                  ? 'Passwords match'
                  : 'Passwords do not match' }}
              </p>
            </div>

            <button class="btn btn-primary w-100" :disabled="loading">
              {{ loading ? 'Creating account...' : 'Register' }}
            </button>
          </form>

          <div class="auth-links">
            <span>Already have an account?</span>
            <RouterLink to="/login">Login</RouterLink>
          </div>
      </div>
    </div>
  </AuthLayout>
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
  padding: 42px 48px;
  background: #fbf9f1;
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
  background: #fffdf8;
}

.input-group .btn-outline-secondary:hover,
.input-group .btn-outline-secondary:focus,
.input-group .btn-outline-secondary:active {
  background: #fffdf8 !important;
  color: #1e293b !important;
  border-color: #C4A484 !important;
  box-shadow: none !important;
}
</style>
