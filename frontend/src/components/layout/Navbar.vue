<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/authStore'
import { useSavedIslandStore } from '@/stores/savedIslandStore'
import { getMyJournalSummary } from '@/services/journalService'
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead
} from '@/services/notificationService'
import MobileSidebar from '@/components/layout/MobileSidebar.vue'
import NavbarSearch from '@/components/layout/NavbarSearch.vue'
import { calculateExplorerProgress } from '@/utils/explorerProgress'
import { setI18nLanguage } from '@/i18n'

const authStore = useAuthStore()
const savedIslandStore = useSavedIslandStore()
const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const currentTheme = ref(localStorage.getItem('theme') || 'light')
const currentLanguage = ref(localStorage.getItem('language') || 'English')
const journalSummary = ref({
  journal_count: 0,
  species_count: 0,
  public_count: 0
})
const notifications = ref([])

const profileInitial = computed(() => {
  return authStore.user?.username?.charAt(0)?.toUpperCase() || 'U'
})

const mainNavLinks = computed(() => [
  {
    label: t('nav.discovery'),
    to: '/discovery',
    section: 'discovery'
  },
  {
    label: t('nav.community'),
    to: '/community',
    section: 'community'
  },
  {
    label: t('nav.planner'),
    to: '/planner',
    section: 'planner'
  }
])

function isSectionActive(section) {
  if (section === 'discovery') {
    return route.path.startsWith('/discovery')
  }

  if (section === 'community') {
    return (
      route.path.startsWith('/community') ||
      route.path.startsWith('/journal')
    )
  }

  if (section === 'planner') {
    return route.path.startsWith('/planner')
  }

  return false
}

function handleLogout() {
  authStore.logout()
  savedIslandStore.clear()
  router.push('/')
}

const userLevel = computed(() => {
  const progress = calculateExplorerProgress({
    journalCount: Number(journalSummary.value.journal_count || 0),
    speciesCount: Number(journalSummary.value.species_count || 0),
    publicCount: Number(journalSummary.value.public_count || 0)
  })

  return progress.tier.name
})

const unreadNotificationCount = computed(() =>
  notifications.value.filter(item => !item.is_read).length
)

async function loadProfileStats() {
  if (!authStore.isLoggedIn) {
    journalSummary.value = {
      journal_count: 0,
      species_count: 0,
      public_count: 0
    }
    return
  }

  try {
    journalSummary.value = await getMyJournalSummary()
  } catch {
    journalSummary.value = {
      journal_count: 0,
      species_count: 0,
      public_count: 0
    }
  }
}

async function loadNotifications() {
  if (!authStore.isLoggedIn) {
    notifications.value = []
    return
  }

  try {
    notifications.value = await getNotifications()
  } catch {
    notifications.value = []
  }
}

function notificationRoute(notification) {
  return notification.journal_id
    ? `/journal/${notification.journal_id}`
    : '/dashboard'
}

function notificationText(notification) {
  const actor = notification.actor_name || 'Someone'
  const title = notification.journal_title || 'your diary'

  if (notification.type === 'journal_like') {
    return t('nav.liked', { actor, title })
  }

  if (notification.type === 'journal_comment') {
    return t('nav.commented', { actor, title })
  }

  return notification.message
}

async function handleNotificationOpen(notification) {
  if (!notification.is_read) {
    await markNotificationRead(notification.id)
    notification.is_read = 1
  }
}

async function handleReadAllNotifications() {
  await markAllNotificationsRead()
  notifications.value = notifications.value.map(item => ({
    ...item,
    is_read: 1
  }))
}

function applyTheme(theme) {
  currentTheme.value = theme
  localStorage.setItem('theme', theme)
  document.body.classList.toggle('dark-mode', theme === 'dark')
}

function applyLanguage(language) {
  currentLanguage.value = language
  localStorage.setItem('language', language)
  setI18nLanguage(language)
}

function settingsPayload(overrides = {}) {
  const user = authStore.user || {}

  return {
    appearance_theme: user.appearance_theme || currentTheme.value || 'light',
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

async function persistNavbarSettings(overrides) {
  if (!authStore.isLoggedIn) return

  try {
    await authStore.saveSettings(settingsPayload(overrides))
  } catch {
    await authStore.loadCurrentUser().catch(() => {})
  }
}

async function toggleTheme() {
  const nextTheme = currentTheme.value === 'light' ? 'dark' : 'light'
  applyTheme(nextTheme)
  await persistNavbarSettings({ appearance_theme: nextTheme })
}

async function changeLanguage(language) {
  applyLanguage(language)
  await persistNavbarSettings({ language })
}

onMounted(() => {
  applyTheme(authStore.user?.appearance_theme || localStorage.getItem('theme') || currentTheme.value)
  applyLanguage(authStore.user?.language || localStorage.getItem('language') || currentLanguage.value)
  loadProfileStats()
  loadNotifications()
})

watch(
  () => authStore.isLoggedIn,
  () => {
    loadProfileStats()
    loadNotifications()
  }
)

watch(
  () => authStore.user?.appearance_theme,
  theme => {
    applyTheme(theme || localStorage.getItem('theme') || 'light')
  }
)

watch(
  () => authStore.user?.language,
  language => {
    applyLanguage(language || localStorage.getItem('language') || 'English')
  }
)
</script>

<template>
  <nav class="navbar shadow-sm py-3">
    <div class="container d-flex align-items-center">
      <!-- Logo -->
      <RouterLink to="/" class="navbar-brand fw-bold me-4">
        <img src="/images/reeftale_logo_c.png" alt="Reef Tales logo" class="brand-logo" />
        <span>Reef Tales</span>
      </RouterLink>
      
      <!-- Search -->
      <NavbarSearch class="d-none d-lg-block" />

      <!-- Desktop Navigation -->
      <ul class="navbar-nav ms-auto d-none d-lg-flex flex-row align-items-center gap-4">

        <!-- Main Navigation -->
        <li class="nav-item nav-links-group d-flex align-items-center">
          <template v-for="link in mainNavLinks" :key="link.label">
            <div class="main-nav-item">
              <RouterLink
                :to="link.to"
                class="nav-link"
                :class="{ 'section-active': isSectionActive(link.section) }"
              >
                {{ link.label }}
              </RouterLink>
            </div>
          </template>
        </li>

        <!-- Language Dropdown -->
        <li class="nav-item dropdown">
          <button
            class="nav-action-btn"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <i class="bi bi-globe2"></i>
          </button>

          <ul class="dropdown-menu dropdown-menu-end shadow border-0 nav-dropdown">
            <li><button class="dropdown-item" @click="changeLanguage('English')">{{ t('common.english') }}</button></li>
            <li><button class="dropdown-item" @click="changeLanguage('中文')">{{ t('common.chinese') }}</button></li>
          </ul>
        </li>

        <li v-if="authStore.isLoggedIn" class="nav-item dropdown">
          <button
            class="nav-action-btn notification-trigger"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
            @click="loadNotifications"
          >
            <i class="bi bi-bell"></i>
            <span v-if="unreadNotificationCount">{{ unreadNotificationCount }}</span>
          </button>

          <ul class="dropdown-menu dropdown-menu-end shadow border-0 nav-dropdown notification-dropdown">
            <li class="notification-heading">
              <strong>{{ t('nav.notifications') }}</strong>
              <button
                v-if="notifications.length"
                type="button"
                @click="handleReadAllNotifications"
              >
                {{ t('nav.markAllRead') }}
              </button>
            </li>

            <li v-if="!notifications.length" class="notification-empty">
              {{ t('nav.noNotifications') }}
            </li>

            <li
              v-for="notification in notifications"
              :key="notification.id"
            >
              <RouterLink
                :to="notificationRoute(notification)"
                class="notification-item"
                :class="{ unread: !notification.is_read }"
                @click="handleNotificationOpen(notification)"
              >
                <span class="notification-icon">
                  <i :class="notification.type === 'journal_like' ? 'bi bi-heart' : 'bi bi-chat-dots'"></i>
                </span>

                <span>
                  {{ notificationText(notification) }}
                  <small>{{ new Date(notification.created_at).toLocaleDateString() }}</small>
                </span>
              </RouterLink>
            </li>
          </ul>
        </li>

        <!-- Theme Toggle -->
        <li class="nav-item">
          <button class="theme-switch" type="button" @click="toggleTheme">
            <span class="theme-switch-circle">
              <i :class="currentTheme === 'light' ? 'bi bi-sun' : 'bi bi-moon-stars'"></i>
            </span>
          </button>
        </li>

        <!-- Guest buttons -->
        <li v-if="!authStore.isLoggedIn" class="nav-item">
          <RouterLink to="/login" class="btn btn-outline-primary ms-lg-2">
            {{ t('nav.login') }}
          </RouterLink>
        </li>

        <li v-if="!authStore.isLoggedIn" class="nav-item">
          <RouterLink to="/register" class="btn btn-primary">
            {{ t('nav.register') }}
          </RouterLink>
        </li>

        <!-- Logged-in profile dropdown -->
        <li v-if="authStore.isLoggedIn" class="nav-item dropdown ms-lg-2">
          <a class="profile-trigger" href="#" role="button" data-bs-toggle="dropdown">
            <img
              v-if="authStore.user?.profile_image"
              :src="authStore.user.profile_image"
              :alt="`${authStore.user?.username || 'User'} profile photo`"
            />
            <span v-else>{{ profileInitial }}</span>
          </a>

          <ul class="dropdown-menu dropdown-menu-end shadow border-0 nav-dropdown profile-dropdown">
            <li class="profile-dropdown-header">
              <img
                v-if="authStore.user?.profile_image"
                :src="authStore.user.profile_image"
                :alt="`${authStore.user?.username || 'User'} profile photo`"
              />
              <span v-else>{{ profileInitial }}</span>

              <div>
                <small>{{ t('nav.greeting', { name: authStore.user?.username || 'Explorer' }) }}</small>
                <strong>{{ userLevel }}</strong>
              </div>
            </li>

            <li>
              <RouterLink to="/dashboard" class="dropdown-item profile-menu-item">
                <i class="bi bi-journal-richtext"></i>
                {{ t('nav.myLogbook') }}
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/settings" class="dropdown-item profile-menu-item">
                <i class="bi bi-gear"></i>
                {{ t('nav.settings') }}
              </RouterLink>
            </li>
            <li><hr class="dropdown-divider" /></li>
            <li>
              <button class="dropdown-item profile-menu-item" @click="handleLogout">
                <i class="bi bi-box-arrow-right"></i>
                {{ t('nav.logout') }}
              </button>
            </li>
          </ul>
        </li>
      </ul>

      <!-- Mobile Offcanvas Button -->
      <button
        class="btn d-lg-none ms-auto mobile-menu-btn"
        type="button"
        data-bs-toggle="offcanvas"
        data-bs-target="#mobileMenu"
      >
        <i class="bi bi-list fs-2"></i>
      </button>
    </div>
  </nav>

  <MobileSidebar
    :main-nav-links="mainNavLinks"
    :current-theme="currentTheme"
    :current-language="currentLanguage"
    :auth-store="authStore"
    :profile-initial="profileInitial"
    :user-level="userLevel"
    :is-section-active="isSectionActive"
    @toggle-theme="toggleTheme"
    @change-language="changeLanguage"
    @logout="handleLogout"
  />
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Spectral:ital,wght@1,700&display=swap');

nav{
  position: sticky;
  top: 0;
  z-index: 1040;
  width: 100%;
  max-width: 100%;
  background: #efe7dc;
  border-bottom: 1px solid rgba(196,164,132,0.28);
  backdrop-filter: blur(14px);
}

.navbar > .container {
  max-width: min(100%, 1320px);
  gap: 14px;
}

.navbar-brand {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: 'Spectral', serif;
  color: var(--accent);
  font-size: 26px;
}

.navbar-brand span{
  padding-top: 2px;
}

.brand-logo {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.mobile-menu-btn {
  width: 46px;
  height: 46px;
  display: inline-grid;
  place-items: center;
  flex: 0 0 auto;
  border: 1px solid rgba(var(--accent-rgb),0.24);
  border-radius: 50%;
  background: var(--surface);
  color: var(--accent-strong);
  padding: 0;
  box-shadow: 0 8px 18px rgba(47,72,88,0.08);
}

.mobile-menu-btn i {
  font-size: 1.6rem !important;
  line-height: 1;
}

.mobile-menu-btn:hover,
.mobile-menu-btn:focus-visible,
.mobile-menu-btn[aria-expanded="true"] {
  background: var(--accent-soft);
  border-color: rgba(var(--accent-rgb),0.34);
  color: var(--accent-strong);
}

.theme-switch {
  width: 54px;
  height: 30px;
  border: none;
  border-radius: 999px;
  background: var(--border);
  padding: 3px;
  display: flex;
  align-items: center;
}

.theme-switch-circle {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    transform 0.25s ease,
    background 0.25s ease,
    color 0.25s ease;
}

.nav-dropdown {
  position: absolute !important;
  top: 50px !important;
  right: 0 !important;
  left: auto !important;
  margin-top: 0 !important;
  min-width: 180px;
}

.navbar-nav {
  align-items: center;
}

.nav-action-btn {
  position: relative;
  width: 38px;
  height: 38px;
  border: none;
  background: transparent;
  color: #1e293b;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}

.notification-trigger span {
  position: absolute;
  top: 2px;
  right: 1px;
  min-width: 17px;
  height: 17px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #d96c82;
  color: #ffffff;
  font-size: 0.68rem;
  font-weight: 900;
}

.notification-dropdown {
  width: 330px;
  padding: 10px;
  border: 1px dashed var(--border) !important;
  border-radius: 18px;
  background: var(--surface);
}

.notification-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 8px 10px;
  border-bottom: 1px dashed var(--border);
}

.notification-heading strong {
  color: var(--text-primary);
}

.notification-heading button {
  border: none;
  background: transparent;
  color: var(--accent);
  font-size: 0.78rem;
  font-weight: 900;
}

.notification-empty {
  padding: 18px 8px 10px;
  color: var(--text-secondary);
  font-size: 0.88rem;
  font-weight: 700;
  text-align: center;
}

.notification-item {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 10px;
  padding: 10px 8px;
  border-radius: 12px;
  color: var(--text-primary);
  font-size: 0.86rem;
  font-weight: 700;
  text-decoration: none;
}

.notification-item:hover,
.notification-item.unread {
  background: var(--accent-soft);
}

.notification-icon {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--surface);
  color: var(--accent);
}

.notification-item small {
  display: block;
  margin-top: 3px;
  color: var(--text-secondary);
  font-size: 0.74rem;
}

.profile-trigger {
  width: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--surface);
  border: 2px solid var(--surface);
  outline: 1px solid rgba(var(--accent-rgb),0.42);
  color: var(--accent);
  font-weight: 900;
  text-decoration: none;
  box-shadow: 0 8px 18px rgba(47,72,88,0.16);
  overflow: hidden;
}

.profile-trigger img,
.profile-dropdown-header img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-dropdown {
  min-width: 250px;
  padding: 10px;
  border: 1px dashed var(--border) !important;
  border-radius: 18px;
  background: var(--surface);
}

.profile-dropdown-header {
  display: grid;
  grid-template-columns: 50px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  padding: 10px 10px 12px;
  border-bottom: 1px dashed var(--border);
  margin-bottom: 8px;
}

.profile-dropdown-header > span,
.profile-dropdown-header > img {
  width: 50px;
  height: 50px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 2px solid var(--surface);
  outline: 1px solid rgba(var(--accent-rgb),0.36);
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 900;
}

.profile-dropdown-header small,
.profile-dropdown-header strong {
  display: block;
}

.profile-dropdown-header small {
  color: var(--text-secondary);
  font-weight: 700;
}

.profile-dropdown-header strong {
  color: var(--text-primary);
  font-size: 0.9rem;
}

.profile-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 12px;
  padding: 9px 10px;
  font-weight: 800;
}

.profile-menu-item:hover {
  background: var(--accent-soft);
  color: var(--accent-strong);
}

.main-nav-item .nav-link.section-active {
  color: #1ba7b1 !important;
  position: relative;
  font-weight: 600;
}

.main-nav-item {
  display: flex;
  align-items: center;
  position: relative;
}

.main-nav-item .nav-link {
  position: relative;
  display: inline-block;
  transition: color 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.nav-links-group {
  gap: 40px;
}

.main-nav-item .nav-link.section-active::after {
  content: "";
  position: absolute;
  left: -26px;
  bottom: -40px;
  width: 105px;
  height: 100px;
  background:
    url('/images/flipflop-swirl-indicator.png')
    center / contain no-repeat;
  pointer-events: none;
  animation: slipperFootstep 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

@keyframes slipperFootstep {
  0% {
    opacity: 0;
    transform: translateY(12px) rotate(-8deg) scale(0.9);
  }
  60% {
    transform: translateY(-2px) rotate(2deg) scale(1.02);
  }
  100% {
    opacity: 1;
    transform: translateY(0) rotate(0deg) scale(1);
  }
}

@media (min-width: 992px) {
  .nav-item {
    display: flex;
    align-items: center;
  }
}

@media (max-width: 991px) {
  nav.navbar {
    padding-block: 10px !important;
  }

  .navbar > .container {
    width: 100%;
    max-width: none;
    min-height: 54px;
    padding-inline: 16px;
    justify-content: space-between;
  }

  .navbar-brand {
    min-width: 0;
    max-width: calc(100% - 62px);
    margin-right: 0 !important;
    gap: 8px;
    font-size: clamp(1.35rem, 6vw, 1.65rem);
    white-space: nowrap;
  }

  .navbar-brand span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .brand-logo {
    width: 38px;
    height: 38px;
    flex: 0 0 auto;
  }

  .mobile-menu-btn {
    margin-left: 0 !important;
  }
}

@media (max-width: 360px) {
  .navbar > .container {
    padding-inline: 12px;
  }

  .navbar-brand {
    font-size: 1.25rem;
  }

  .brand-logo {
    width: 34px;
    height: 34px;
  }

  .mobile-menu-btn {
    width: 42px;
    height: 42px;
  }
}

:global(body.dark-mode) .mobile-menu-btn {
  background: #17243a;
  border-color: rgba(226,232,240,0.14);
  color: #f8fafc;
}

:global(body.dark-mode) .mobile-menu-btn:hover,
:global(body.dark-mode) .mobile-menu-btn:focus-visible,
:global(body.dark-mode) .mobile-menu-btn[aria-expanded="true"] {
  background: #253244;
  border-color: rgba(103,232,249,0.34);
  color: #e0faff;
}

:global(body.dark-mode) .mobile-menu-btn i {
  color: #67e8f9;
}
</style>

