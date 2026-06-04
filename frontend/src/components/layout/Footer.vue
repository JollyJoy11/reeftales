<script setup>
import { useI18n } from 'vue-i18n'
import { ref, watch } from 'vue'

import { setI18nLanguage } from '@/i18n'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()
const { t } = useI18n()
const currentLanguage = ref(authStore.user?.language || localStorage.getItem('language') || 'English')

function applyLanguage(language) {
  currentLanguage.value = language
  localStorage.setItem('language', language)
  setI18nLanguage(language)
}

function settingsPayload(overrides = {}) {
  const user = authStore.user || {}

  return {
    appearance_theme: user.appearance_theme || localStorage.getItem('theme') || 'light',
    font_size: user.font_size || 'normal',
    larger_text: Boolean(user.larger_text),
    reduced_motion: Boolean(user.reduced_motion),
    high_contrast: Boolean(user.high_contrast),
    notify_likes: user.notify_likes !== 0,
    notify_comments: user.notify_comments !== 0,
    default_journal_visibility: user.default_journal_visibility || 'public',
    language: user.language || currentLanguage.value || 'English',
    ...overrides
  }
}

async function persistFooterSettings(overrides) {
  if (!authStore.isLoggedIn) return

  try {
    await authStore.saveSettings(settingsPayload(overrides))
  } catch {
    await authStore.loadCurrentUser().catch(() => {})
  }
}

async function changeLanguage(event) {
  const language = event.target.value

  applyLanguage(language)
  await persistFooterSettings({ language })
}

watch(
  () => authStore.user?.language,
  language => {
    applyLanguage(language || localStorage.getItem('language') || 'English')
  },
  { immediate: true }
)
</script>

<template>
  <footer class="border-top py-5">
    <div class="container">
      <div class="row">
        <div class="col-md-4 mb-3">
          <div class="website-brand">
            <img src="/images/reeftale_logo_c.png" alt="Reef Tales logo" class="brand-logo" />
            <h4 class="fw-bold">Reef Tales</h4>
          </div>

          <p class="text-muted">
            {{ t('footer.description') }}
          </p>
        </div>

        <div class="col-md-2 mb-3">
          <h6 class="fw-bold">{{ t('footer.discover') }}</h6>
          <ul class="list-unstyled footer-links">
            <li><RouterLink to="/discovery">{{ t('nav.discovery') }}</RouterLink></li>
            <li><RouterLink to="/community">{{ t('nav.community') }}</RouterLink></li>
            <li><RouterLink to="/planner">{{ t('nav.planner') }}</RouterLink></li>
          </ul>
        </div>

        <div class="col-md-2 mb-3">
          <h6 class="fw-bold">{{ t('footer.account') }}</h6>
          <ul class="list-unstyled footer-links">
            <template v-if="authStore.isLoggedIn">
              <li><RouterLink to="/dashboard">{{ t('nav.myLogbook') }}</RouterLink></li>
              <li><RouterLink to="/settings">{{ t('nav.settings') }}</RouterLink></li>
            </template>

            <template v-else>
              <li><RouterLink to="/login">{{ t('nav.login') }}</RouterLink></li>
              <li><RouterLink to="/register">{{ t('nav.register') }}</RouterLink></li>
            </template>
          </ul>
        </div>

        <div class="col-md-4 mb-3">
          <h6 class="fw-bold">{{ t('footer.accessibility') }}</h6>
          <p class="text-muted mb-2">{{ t('footer.language') }}</p>

          <select
            class="form-select"
            :value="currentLanguage"
            @change="changeLanguage"
          >
            <option value="English">{{ t('common.english') }}</option>
            <option value="中文">{{ t('common.chinese') }}</option>
          </select>
        </div>
      </div>

      <hr />

      <div class="text-center text-muted">
        {{ t('footer.copyright') }}
      </div>
    </div>
  </footer>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Spectral:ital,wght@1,700&display=swap');

footer {
  background: #efe7dc;
}

.website-brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.website-brand h4{
  padding-top: 8px;
  font-family: 'Spectral', serif;
  color: var(--accent);
  font-size: 36px;
}

.brand-logo {
  width: 45px;
  height: 45px;
  object-fit: contain;
}

.footer-links a {
  color: #6b7280;
  text-decoration: none;
}

.footer-links a:hover {
  color: #D66967;
}

.form-select {
  border-color: #C4A484;
  background: var(--surface);
}
</style>
