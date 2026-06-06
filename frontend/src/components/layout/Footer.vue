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
  <footer class="site-footer py-5">
    <div class="footer-waves" aria-hidden="true">
      <svg class="wave-svg wave-back" viewBox="0 0 1440 220" preserveAspectRatio="none">
        <path d="M0,38 C180,8 360,8 540,38 C720,68 900,68 1080,38 C1260,8 1350,20 1440,38 L1440,220 L0,220 Z" />
      </svg>

      <svg class="wave-svg wave-mid" viewBox="0 0 1440 220" preserveAspectRatio="none">
        <path d="M0,72 C220,24 420,28 640,72 C860,116 1040,108 1220,68 C1320,46 1380,50 1440,72 L1440,220 L0,220 Z" />
      </svg>

      <svg class="wave-svg wave-front" viewBox="0 0 1440 220" preserveAspectRatio="none">
        <path d="M0,98 C220,58 420,66 620,98 C820,136 1020,136 1220,88 C1340,58 1400,70 1440,98 L1440,220 L0,220 Z" />
      </svg>
    </div>

    <div class="container footer-content">
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

footer.site-footer {
  --footer-bg: #d1e8e5;
  --wave-back-color: #c5e0dc;
  --wave-mid-color: #8ad3cf;
  --wave-front-color: var(--footer-bg);
  --wave-back-opacity: 0.95;
  --wave-mid-opacity: 0.82;
  --wave-front-opacity: 1;
  --footer-wave-height: 170px;
  --footer-wave-overlap: 96px;

  position: relative;
  margin-top: calc(-1 * var(--footer-wave-overlap));
  padding-top: calc(4rem + var(--footer-wave-height) - 42px) !important;
  background:
    linear-gradient(
      180deg,
      transparent 0,
      transparent var(--footer-wave-height),
      var(--footer-bg) var(--footer-wave-height),
      var(--footer-bg) 100%
    );
  color: var(--text-primary);
  overflow: hidden;
}

.footer-waves {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: var(--footer-wave-height);
  overflow: hidden;
  pointer-events: none;
  z-index: 1;
}

.wave-svg {
  position: absolute;
  left: -8%;
  bottom: 0;
  width: 116%;
  height: 100%;
  transform-origin: center bottom;
}

.wave-svg path {
  transition: fill 0.3s ease;
}

.wave-back {
  fill: var(--wave-back-color);
  opacity: var(--wave-back-opacity);
  animation: waveDriftBack 34s ease-in-out infinite;
  animation-delay: -8s;
}

.wave-mid {
  fill: var(--wave-mid-color);
  opacity: var(--wave-mid-opacity);
  animation: waveDriftMid 26s ease-in-out infinite;
  animation-delay: -13s;
}

.wave-front {
  fill: var(--wave-front-color);
  opacity: var(--wave-front-opacity);
  animation: waveDriftFront 22s ease-in-out infinite;
  animation-delay: -5s;
}

@keyframes waveDriftBack {
  0% { transform: translateX(-5%) scaleX(1.08); }
  50% { transform: translateX(5%) scaleX(1.1); }
  100% { transform: translateX(-5%) scaleX(1.08); }
}

@keyframes waveDriftMid {
  0% { transform: translateX(7%) scaleX(1.1); }
  50% { transform: translateX(-7%) scaleX(1.07); }
  100% { transform: translateX(7%) scaleX(1.1); }
}

@keyframes waveDriftFront {
  0% { transform: translateX(-3.5%) scaleX(1.05); }
  50% { transform: translateX(3.5%) scaleX(1.07); }
  100% { transform: translateX(-3.5%) scaleX(1.05); }
}

.footer-content {
  position: relative;
  z-index: 5;
}

.website-brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.website-brand h4 {
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
  color: #244a58;
  text-decoration: none;
}

.footer-links a:hover {
  color: var(--accent);
}

.form-select {
  border: 1.5px solid rgba(var(--accent-rgb), 0.28);
  background: #fffdf8;
  color: var(--text-primary);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

footer.site-footer h6,
footer.site-footer .text-muted {
  color: #244a58 !important;
}

footer.site-footer hr {
  border-color: rgba(var(--accent-rgb), 0.18);
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .wave-svg {
    animation: none;
  }
}

:global(body.reduced-motion-mode) .wave-svg {
  animation: none !important;
}

@media (max-width: 767.98px) {
  footer.site-footer {
    --footer-wave-height: 120px;
    --footer-wave-overlap: 70px;
    padding-top: calc(3rem + var(--footer-wave-height) - 30px) !important;
  }

  .website-brand h4 {
    font-size: 30px;
  }
}
</style>
