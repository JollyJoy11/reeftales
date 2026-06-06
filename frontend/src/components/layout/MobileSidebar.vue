<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import NavbarSearch from '@/components/layout/NavbarSearch.vue'

defineProps({
  mainNavLinks: Array,
  currentTheme: String,
  currentLanguage: String,
  authStore: Object,
  profileInitial: String,
  userLevel: String,
  isSectionActive: Function
})

const emit = defineEmits([
  'toggle-theme',
  'change-language',
  'logout'
])

const closeBtn = ref(null)
const { t } = useI18n()

function closeMobileMenu() {
  closeBtn.value?.click()
}

function handleMobileLogout() {
  emit('logout')
  closeMobileMenu()
}

function handleThemeToggle() {
  emit('toggle-theme')
}

function handleLanguageChange(language) {
  emit('change-language', language)
}
</script>

<template>
  <div class="offcanvas offcanvas-end reef-mobile-menu" tabindex="-1" id="mobileMenu">
    <div class="offcanvas-header reef-menu-header">
      <RouterLink to="/" class="mobile-brand" @click="closeMobileMenu">
        <img src="/images/reeftale_logo_c.png" alt="Reef Tales logo" />
        <div>
          <strong>Reef Tales</strong>
          <small>{{ t('mobile.tagline') }}</small>
        </div>
      </RouterLink>

      <button
        ref="closeBtn"
        type="button"
        class="reef-close-btn"
        data-bs-dismiss="offcanvas"
      >
        <i class="bi bi-x-lg"></i>
      </button>
    </div>

    <div class="offcanvas-body reef-menu-body">
      <template v-if="authStore.isLoggedIn">
        <section class="profile-card">
          <div class="profile-top">
            <div class="mobile-profile-avatar">
              <img
                v-if="authStore.user?.profile_image"
                :src="authStore.user.profile_image"
                :alt="`${authStore.user?.username || 'User'} profile photo`"
              />
              <span v-else>{{ profileInitial }}</span>
            </div>

            <div>
              <small>{{ t('nav.greeting', { name: authStore.user?.username || 'Explorer' }) }}</small>
              <strong>{{ userLevel }}</strong>
            </div>
          </div>

          <RouterLink to="/dashboard" class="account-row" @click="closeMobileMenu">
            <i class="bi bi-journal-richtext"></i>
            <span>{{ t('nav.myLogbook') }}</span>
            <i class="bi bi-chevron-right ms-auto"></i>
          </RouterLink>

          <RouterLink to="/settings" class="account-row" @click="closeMobileMenu">
            <i class="bi bi-gear-fill"></i>
            <span>{{ t('nav.settings') }}</span>
            <i class="bi bi-chevron-right ms-auto"></i>
          </RouterLink>
        </section>
      </template>

      <NavbarSearch variant="mobile" @selected="closeMobileMenu" />

      <div class="mobile-section-label">
        <span>{{ t('mobile.navigate') }}</span>
      </div>

      <ul class="mobile-menu-list nav-card">
        <li v-for="link in mainNavLinks" :key="link.label">
          <RouterLink
            :to="link.to"
            class="reef-mobile-link"
            :class="{ 'section-active': isSectionActive(link.section) }"
            @click="closeMobileMenu"
          >
            <span class="link-icon">
              <i
                :class="{
                  'bi bi-compass': link.section === 'discovery',
                  'bi bi-journal-richtext': link.section === 'community',
                  'bi bi-map-fill': link.section === 'planner'
                }"
              />
            </span>

            <span>{{ link.label }}</span>
            <i class="bi bi-chevron-right ms-auto"></i>
          </RouterLink>
        </li>
      </ul>

      <div class="mobile-section-label">
        <span>{{ t('mobile.preferences') }}</span>
      </div>

      <div class="preference-card">
        <button
          class="preference-row"
          type="button"
          :aria-pressed="currentTheme === 'dark'"
          @click="handleThemeToggle"
        >
          <span class="link-icon">
            <i :class="currentTheme === 'light' ? 'bi bi-moon-stars-fill' : 'bi bi-brightness-high-fill'"></i>
          </span>

          <span>{{ currentTheme === 'light' ? t('mobile.darkMode') : t('mobile.lightMode') }}</span>

          <small class="ms-auto">
            {{ currentTheme === 'light' ? t('common.light') : t('common.dark') }}
          </small>
        </button>

        <div class="dropdown">
          <button
            class="preference-row dropdown-toggle"
            type="button"
            data-bs-toggle="dropdown"
          >
            <span class="link-icon">
              <i class="bi bi-globe2"></i>
            </span>

            <span>{{ t('nav.language') }}</span>
            <small class="ms-auto">{{ currentLanguage }}</small>
          </button>

          <ul class="dropdown-menu w-100 reef-language-menu">
            <li>
              <button
                class="dropdown-item"
                :class="{ active: currentLanguage === 'English' }"
                type="button"
                @click="handleLanguageChange('English')"
              >
                {{ t('common.english') }}
              </button>
            </li>
            <li>
              <button
                class="dropdown-item"
                :class="{ active: currentLanguage === '中文' }"
                type="button"
                @click="handleLanguageChange('中文')"
              >
                {{ t('common.chinese') }}
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div class="mobile-bottom-section">
        <template v-if="!authStore.isLoggedIn">
          <RouterLink to="/login" class="mobile-login-btn" @click="closeMobileMenu">
            {{ t('nav.login') }}
          </RouterLink>

          <RouterLink to="/register" class="mobile-register-btn" @click="closeMobileMenu">
            {{ t('mobile.startExploring') }}
          </RouterLink>
        </template>

        <template v-else>
          <button class="mobile-logout-btn" @click="handleMobileLogout">
            <i class="bi bi-box-arrow-right"></i>
            {{ t('nav.logout') }}
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reef-mobile-menu {
  width: min(86vw, 380px);
  background: #fffaf2;
  border-left: none;
  overflow-y: auto;
}

.reef-menu-header {
  padding: 22px 22px 16px;
  border-bottom: none;
}

.mobile-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
}

.mobile-brand img {
  width: 48px;
  height: 48px;
  object-fit: contain;
}

.mobile-brand strong {
  display: block;
  font-family: 'Spectral', serif;
  color: var(--brand-reef-strong);
  font-size: 24px;
  line-height: 1;
}

.mobile-brand small {
  color: #6b7280;
  font-size: 12px;
  font-weight: 700;
}

.reef-close-btn {
  width: 48px;
  height: 48px;
  border: 1px solid #e7ddd1;
  border-radius: 50%;
  background: transparent;
  color: var(--accent-strong);
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.reef-close-btn:hover {
  background: var(--surface);
}

.reef-menu-body {
  padding: 12px 22px 28px;
  overflow-y: auto;
}

/* Profile */
.profile-card {
  background: var(--surface);
  border: 1px solid #e7ddd1;
  border-radius: 24px;
  overflow: hidden;
  margin-bottom: 22px;
}

.profile-top {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 10px 22px;
  background: #fffaf2;
}

.mobile-profile-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 4px solid #fff;
  box-shadow: 0 4px 14px rgba(47, 72, 88, 0.14);
}

.mobile-profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-top small,
.profile-top strong {
  display: block;
}

.profile-top small {
  color: var(--text-primary);
  font-weight: 600;
}

.profile-top strong {
  color: var(--accent);
  font-size: 18px;
  font-weight: 900;
}

.account-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 22px;
  text-decoration: none;
  color: var(--text-primary);
  font-weight: 800;
  border-top: 1px solid #ece3d8;
  background: var(--surface);
}

.account-row i:first-child {
  color: var(--accent);
  font-size: 20px;
}

.account-row:hover {
  background: #f8efe4;
  color: var(--accent-strong);
}

/* Section label */
.mobile-section-label {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 22px 0 12px;
  color: var(--accent-strong);
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.mobile-section-label::after {
  content: "";
  flex: 1;
  border-top: 1px dashed var(--border);
}

/* Navigation */
.mobile-menu-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-card {
  background: var(--surface);
  border: 1px solid #e7ddd1;
  border-radius: 18px;
  overflow: hidden;
}

.preference-card {
  background: var(--surface);
  border: 1px solid #e7ddd1;
  border-radius: 18px;
  overflow: visible;
}

.reef-mobile-link,
.preference-row {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 8px 20px;
  margin: 0;
  border: none;
  border-bottom: 1px solid #ece3d8;
  background: transparent;
  color: var(--text-primary);
  text-decoration: none;
  font-weight: 800;
  transition: 0.2s ease;
}

.nav-card li:last-child .reef-mobile-link,
.preference-card > .dropdown:last-child .preference-row {
  border-bottom: none;
}

.preference-card > .preference-row:first-child {
  border-radius: 17px 17px 0 0;
}

.preference-card > .dropdown:last-child .preference-row {
  border-radius: 0 0 17px 17px;
}

.preference-row.dropdown-toggle::after {
  display: none;
}

.reef-mobile-link:hover,
.preference-row:hover,
.reef-mobile-link.section-active {
  background: #f8efe4;
  color: var(--accent-strong);
}

.link-icon {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #fffaf2;
  border: 1px solid #e7ddd1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
  font-size: 18px;
  flex-shrink: 0;
}

.reef-mobile-link.section-active .link-icon {
  background: var(--accent-soft);
  border-color: rgba(var(--accent-rgb),0.25);
}

.preference-row small {
  color: #6b7280;
  font-size: 14px;
  font-weight: 700;
}

.reef-language-menu {
  border: none;
  border-radius: 16px;
  padding: 8px;
  background: var(--surface);
  box-shadow: 0 14px 28px rgba(47, 72, 88, 0.14);
  z-index: 3000;
}

.reef-language-menu .dropdown-item.active {
  background: var(--accent-soft);
  color: var(--accent-strong);
  font-weight: 900;
}

/* Bottom buttons */
.mobile-bottom-section {
  margin-top: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.mobile-login-btn,
.mobile-register-btn {
  width: 100%;
  border-radius: 999px;
  padding: 8px 16px;
  font-weight: 900;
  text-align: center;
  text-decoration: none;
  display: block;
  margin-bottom: 10px;
}

.mobile-login-btn {
  border: 1px solid var(--accent);
  color: var(--accent);
  background: transparent;
}

.mobile-register-btn {
  background: var(--accent);
  color: white;
  border: 1px solid var(--accent);
}

.mobile-logout-btn {
  width: 100%;
  min-height: 54px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 8px 20px;
  border-radius: 16px;
  border: 1.5px dashed #e4a3a3;
  background: #fffafa;
  color: #b83245;
  font-size: 16px;
  font-weight: 900;
  transition: 0.22s ease;
}

.mobile-logout-btn:hover {
  background: #fff1f1;
  border-color: #d95f6b;
  color: #9f2435;
}
</style>


