<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

import Stamp from '@/components/Stamp.vue'
import { requestPasswordReset } from '@/services/authService'

const email = ref('')
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const devResetLink = ref('')

async function handleForgotPassword() {
  try {
    errorMessage.value = ''
    successMessage.value = ''
    devResetLink.value = ''

    if (!email.value) {
      errorMessage.value = 'Please enter your email address.'
      return
    }

    loading.value = true
    const response = await requestPasswordReset(email.value)

    successMessage.value = response.message
    devResetLink.value = response.resetLink || ''
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message || 'Unable to prepare password reset.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="postcard-card">
      <div class="postcard-left">
        <Stamp image="/images/stamp-turtle.jpg" />

        <h2>Find Your Way Back</h2>
        <p>We will prepare a secure link so you can set a new password.</p>
      </div>

      <div class="postcard-right">
        <h1>Forgot Password</h1>
        <p class="subtitle">Enter the email linked to your Reef Tales account.</p>

        <p v-if="errorMessage" class="text-danger small">
          {{ errorMessage }}
        </p>

        <p v-if="successMessage" class="text-success small">
          {{ successMessage }}
        </p>

        <form @submit.prevent="handleForgotPassword" novalidate>
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

          <button class="btn btn-primary w-100" :disabled="loading">
            {{ loading ? 'Preparing link...' : 'Send reset link' }}
          </button>
        </form>

        <div v-if="devResetLink" class="dev-reset-link">
          <strong>Development reset link</strong>
          <RouterLink :to="devResetLink.replace(/^https?:\/\/[^/]+/, '')">
            Open reset page
          </RouterLink>
        </div>

        <div class="auth-links">
          <span>Remember your password?</span>
          <RouterLink to="/login">Login</RouterLink>
        </div>
      </div>
  </div>
</template>

<style scoped>
.postcard-card {
  width: min(900px, 100%);
  min-height: 460px;
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

.dev-reset-link {
  display: grid;
  gap: 6px;
  margin-top: 14px;
  padding: 12px;
  border: 1px dashed var(--border);
  border-radius: 14px;
  background: var(--surface);
  font-size: 0.86rem;
}

.dev-reset-link strong {
  color: var(--text-primary);
}

.dev-reset-link a,
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
</style>
