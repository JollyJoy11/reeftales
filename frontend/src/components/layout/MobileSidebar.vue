<script setup>
import { ref } from 'vue'

defineProps({
  searchQuery: String,
  mainNavLinks: Array,
  currentTheme: String,
  currentLanguage: String,
  authStore: Object,
  profileInitial: String,
  userLevel: String,
  isSectionActive: Function
})

const emit = defineEmits([
  'update:searchQuery',
  'toggle-theme',
  'change-language',
  'logout'
])

const closeBtn = ref(null)

function closeMobileMenu() {
  closeBtn.value?.click()
}

function handleMobileLogout() {
  emit('logout')
  closeMobileMenu()
}
</script>

<template>
  <div class="offcanvas offcanvas-end reef-mobile-menu" tabindex="-1" id="mobileMenu">
    <div class="offcanvas-header reef-menu-header">
      <RouterLink to="/" class="mobile-brand" @click="closeMobileMenu">
        <img src="/images/reeftale_logo_c.png" alt="Reef Tales logo" />
        <div>
          <strong>Reef Tales</strong>
          <small>Explore islands, reefs & stories</small>
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
              <small>Hi, {{ authStore.user?.username || 'Explorer' }}</small>
              <strong>{{ userLevel }}</strong>
            </div>
          </div>

          <RouterLink to="/dashboard" class="account-row" @click="closeMobileMenu">
            <i class="bi bi-journal-richtext"></i>
            <span>My Logbook</span>
            <i class="bi bi-chevron-right ms-auto"></i>
          </RouterLink>

          <RouterLink to="/settings" class="account-row" @click="closeMobileMenu">
            <i class="bi bi-gear-fill"></i>
            <span>Settings</span>
            <i class="bi bi-chevron-right ms-auto"></i>
          </RouterLink>
        </section>
      </template>

      <div class="mobile-search-card">
        <i class="bi bi-search"></i>
        <input
          :value="searchQuery"
          @input="emit('update:searchQuery', $event.target.value)"
          type="search"
          placeholder="Search islands, marine life..."
        />
      </div>

      <div class="mobile-section-label">
        <span>Navigate</span>
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
        <span>Preferences</span>
      </div>

      <div class="preference-card">
        <button class="preference-row" @click="emit('toggle-theme')">
          <span class="link-icon">
            <i :class="currentTheme === 'light' ? 'bi bi-moon-stars-fill' : 'bi bi-brightness-high-fill'"></i>
          </span>

          <span>{{ currentTheme === 'light' ? 'Dark Mode' : 'Light Mode' }}</span>

          <small class="ms-auto">
            {{ currentTheme === 'light' ? 'Light' : 'Dark' }}
          </small>
        </button>

        <div class="dropdown">
          <button class="preference-row dropdown-toggle" data-bs-toggle="dropdown">
            <span class="link-icon">
              <i class="bi bi-globe2"></i>
            </span>

            <span>Language</span>
            <small class="ms-auto">{{ currentLanguage }}</small>
          </button>

          <ul class="dropdown-menu w-100 reef-language-menu">
            <li><button class="dropdown-item" @click="emit('change-language', 'English')">English</button></li>
            <li><button class="dropdown-item" @click="emit('change-language', 'Bahasa Melayu')">Bahasa Melayu</button></li>
            <li><button class="dropdown-item" @click="emit('change-language', '中文')">中文</button></li>
          </ul>
        </div>
      </div>

      <div class="mobile-bottom-section">
        <template v-if="!authStore.isLoggedIn">
          <RouterLink to="/login" class="mobile-login-btn" @click="closeMobileMenu">
            Login
          </RouterLink>

          <RouterLink to="/register" class="mobile-register-btn" @click="closeMobileMenu">
            Start Exploring
          </RouterLink>
        </template>

        <template v-else>
          <button class="mobile-logout-btn" @click="handleMobileLogout">
            <i class="bi bi-box-arrow-right"></i>
            Logout
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
  color: #1897a0;
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
  color: #147d84;
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.reef-close-btn:hover {
  background: #fffdf8;
}

.reef-menu-body {
  padding: 12px 22px 28px;
  overflow-y: auto;
}

/* Profile */
.profile-card {
  background: #fffdf8;
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
  background: #deefec;
  color: #1897a0;
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
  color: #2f4858;
  font-weight: 600;
}

.profile-top strong {
  color: #1897a0;
  font-size: 18px;
  font-weight: 900;
}

.account-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 22px;
  text-decoration: none;
  color: #2f4858;
  font-weight: 800;
  border-top: 1px solid #ece3d8;
  background: #fffdf8;
}

.account-row i:first-child {
  color: #1897a0;
  font-size: 20px;
}

.account-row:hover {
  background: #f8efe4;
  color: #147d84;
}

/* Search */
.mobile-search-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fffdf8;
  border: 1px solid #ddd5ca;
  border-radius: 999px;
  padding: 8px 18px;
  margin-bottom: 22px;
}

.mobile-search-card i {
  color: #6b7280;
  font-size: 20px;
}

.mobile-search-card input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
}

/* Section label */
.mobile-section-label {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 22px 0 12px;
  color: #147d84;
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.mobile-section-label::after {
  content: "";
  flex: 1;
  border-top: 1px dashed #d8cdbb;
}

/* Navigation */
.mobile-menu-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-card {
  background: #fffdf8;
  border: 1px solid #e7ddd1;
  border-radius: 18px;
  overflow: hidden;
}

.preference-card {
  background: #fffdf8;
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
  color: #2f4858;
  text-decoration: none;
  font-weight: 800;
  transition: 0.2s ease;
}

.nav-card li:last-child .reef-mobile-link,
.preference-card > .dropdown:last-child .preference-row {
  border-bottom: none;
}

.reef-mobile-link:hover,
.preference-row:hover,
.reef-mobile-link.section-active {
  background: #f8efe4;
  color: #147d84;
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
  color: #1897a0;
  font-size: 18px;
  flex-shrink: 0;
}

.reef-mobile-link.section-active .link-icon {
  background: #deefec;
  border-color: rgba(24, 151, 160, 0.25);
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
  background: #fffdf8;
  box-shadow: 0 14px 28px rgba(47, 72, 88, 0.14);
  z-index: 3000;
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
  border: 1px solid #1897a0;
  color: #1897a0;
  background: transparent;
}

.mobile-register-btn {
  background: #1897a0;
  color: white;
  border: 1px solid #1897a0;
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