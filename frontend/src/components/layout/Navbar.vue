<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useSavedIslandStore } from '@/stores/savedIslandStore'
import { getMyJournalSummary } from '@/services/journalService'
import MobileSidebar from '@/components/layout/MobileSidebar.vue'

const authStore = useAuthStore()
const savedIslandStore = useSavedIslandStore()
const route = useRoute()

const searchQuery = ref('')
const showSuggestions = ref(false)

const currentTheme = ref(localStorage.getItem('theme') || 'light')
const currentLanguage = ref(localStorage.getItem('language') || 'English')
const journalSummary = ref({
  journal_count: 0,
  species_count: 0,
  public_count: 0
})

const profileInitial = computed(() => {
  return authStore.user?.username?.charAt(0)?.toUpperCase() || 'U'
})

const mainNavLinks = [
  {
    label: 'Discovery',
    to: '/discovery',
    section: 'discovery'
  },
  {
    label: 'Community Diaries',
    to: '/community',
    section: 'community'
  },
  {
    label: 'Trip Planner',
    to: '/planner',
    section: 'planner'
  }
]

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
}

const userLevel = computed(() => {
  const journalCount = Number(journalSummary.value.journal_count || 0)
  const speciesCount = Number(journalSummary.value.species_count || 0)
  const publicCount = Number(journalSummary.value.public_count || 0)
  const score = journalCount + Math.floor(speciesCount / 3) + publicCount

  if (score >= 12) return 'Ocean Explorer III'
  if (score >= 7) return 'Reef Explorer II'
  if (score >= 3) return 'Island Voyager I'
  return 'New Tide Explorer'
})

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

const suggestions = [
  { label: 'Maldives', type: 'Island', path: '/discovery/island/1' },
  { label: 'Sea Turtle', type: 'Marine Life', path: '/discovery?mode=marine' },
  { label: 'Sipadan Journal', type: 'Journal', path: '/community' }
]

function toggleTheme() {
  currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light'
  localStorage.setItem('theme', currentTheme.value)
  document.body.classList.toggle('dark-mode', currentTheme.value === 'dark')
}

function changeLanguage(language) {
  currentLanguage.value = language
  localStorage.setItem('language', language)
}

onMounted(() => {
  document.body.classList.toggle('dark-mode', currentTheme.value === 'dark')
  loadProfileStats()
})

watch(
  () => authStore.isLoggedIn,
  () => loadProfileStats()
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
      <div class="search-wrapper d-none d-lg-block position-relative">
        <div class="input-group search-box">
          <span class="input-group-text border-end-0">
            <i class="bi bi-search"></i>
          </span>

          <input
            v-model="searchQuery"
            @focus="showSuggestions = true"
            class="form-control border-start-0"
            type="search"
            placeholder="Search islands, marine life..."
          />
        </div>

        <div v-if="showSuggestions && searchQuery" class="search-suggestions shadow-sm">
          <RouterLink
            v-for="item in suggestions"
            :key="item.label"
            :to="item.path"
            class="suggestion-item"
          >
            <span>{{ item.label }}</span>
            <small>{{ item.type }}</small>
          </RouterLink>
        </div>
      </div>

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
            <li><button class="dropdown-item" @click="changeLanguage('English')">English</button></li>
            <li><button class="dropdown-item" @click="changeLanguage('Bahasa Melayu')">Bahasa Melayu</button></li>
            <li><button class="dropdown-item" @click="changeLanguage('中文')">中文</button></li>
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
            Login
          </RouterLink>
        </li>

        <li v-if="!authStore.isLoggedIn" class="nav-item">
          <RouterLink to="/register" class="btn btn-primary">
            Register
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
                <small>Hi, {{ authStore.user?.username || 'Explorer' }}</small>
                <strong>{{ userLevel }}</strong>
              </div>
            </li>

            <li>
              <RouterLink to="/dashboard" class="dropdown-item profile-menu-item">
                <i class="bi bi-journal-richtext"></i>
                My Logbook
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/settings" class="dropdown-item profile-menu-item">
                <i class="bi bi-gear"></i>
                Settings
              </RouterLink>
            </li>
            <li><hr class="dropdown-divider" /></li>
            <li>
              <button class="dropdown-item profile-menu-item" @click="handleLogout">
                <i class="bi bi-box-arrow-right"></i>
                Logout
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
    v-model:search-query="searchQuery"
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
  background: #efe7dc;
}

.navbar-brand {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: 'Spectral', serif;
  color: #1897a0;
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

.search-box {
  width: 300px;
}

.search-box .form-control,
.search-box .input-group-text {
  box-shadow: none;
  border-color: #d8cdbb !important;
  background: #fffdf8;
  font-size: 14px;
}

.search-suggestions {
  position: absolute;
  top: 38px;
  left: 0;
  width: 300px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  z-index: 1000;
}

.suggestion-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 14px;
  text-decoration: none;
  color: #1e293b;
}

.suggestion-item:hover {
  background: #f8f9fa;
}

.suggestion-item small {
  color: #6c757d;
}

.theme-switch {
  width: 54px;
  height: 30px;
  border: none;
  border-radius: 999px;
  background: #d8cdbb;
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

.profile-trigger {
  width: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #fffdf8;
  border: 1px solid rgba(24,151,160,0.24);
  color: #1897a0;
  font-weight: 900;
  text-decoration: none;
  box-shadow: 0 8px 18px rgba(47,72,88,0.08);
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
  border: 1px dashed #d8cdbb !important;
  border-radius: 18px;
  background: #fffdf8;
}

.profile-dropdown-header {
  display: grid;
  grid-template-columns: 50px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  padding: 10px 10px 12px;
  border-bottom: 1px dashed #d8cdbb;
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
  background: #deefec;
  color: #1897a0;
  font-weight: 900;
}

.profile-dropdown-header small,
.profile-dropdown-header strong {
  display: block;
}

.profile-dropdown-header small {
  color: #64748b;
  font-weight: 700;
}

.profile-dropdown-header strong {
  color: #2f4858;
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
  background: #deefec;
  color: #147d84;
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

:global(body.dark-mode) .profile-trigger,
:global(body.dark-mode) .profile-dropdown {
  background: #253244;
  border-color: rgba(255,255,255,0.14) !important;
}

:global(body.dark-mode) .profile-dropdown-header {
  border-color: rgba(255,255,255,0.12);
}

:global(body.dark-mode) .profile-dropdown-header strong,
:global(body.dark-mode) .profile-menu-item {
  color: #f8fafc;
}

:global(body.dark-mode) .profile-dropdown-header small {
  color: #cbd5e1;
}

:global(body.dark-mode) .profile-menu-item:hover {
  background: rgba(38,210,222,0.14);
  color: #62c3c9;
}
</style>
