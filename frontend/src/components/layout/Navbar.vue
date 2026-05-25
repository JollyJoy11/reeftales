<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()
const route = useRoute()

const searchQuery = ref('')
const showSuggestions = ref(false)

const currentTheme = ref(localStorage.getItem('theme') || 'light')
const currentLanguage = ref(localStorage.getItem('language') || 'English')

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
})
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
          <a class="nav-action-btn" href="#" role="button" data-bs-toggle="dropdown">
            <i class="bi bi-person-circle fs-4"></i>
          </a>

          <ul class="dropdown-menu dropdown-menu-end shadow border-0 nav-dropdown">
            <li><RouterLink to="/dashboard" class="dropdown-item">My Journeys</RouterLink></li>
            <li><RouterLink to="/" class="dropdown-item">Saved Islands</RouterLink></li>
            <li><RouterLink to="/settings" class="dropdown-item">Settings</RouterLink></li>
            <li><hr class="dropdown-divider" /></li>
            <li><button class="dropdown-item" @click="handleLogout">Logout</button></li>
          </ul>
        </li>
      </ul>

      <!-- Mobile Offcanvas Button -->
      <button class="btn d-lg-none ms-auto" type="button" data-bs-toggle="offcanvas" data-bs-target="#mobileMenu">
        <i class="bi bi-list fs-2"></i>
      </button>
    </div>
  </nav>

  <!-- Mobile Offcanvas Menu -->
  <div class="offcanvas offcanvas-end" tabindex="-1" id="mobileMenu">
    <div class="offcanvas-header">
      <h5 class="offcanvas-title fw-bold navbar-brand">Reef Tales</h5>
      <button type="button" class="btn-close" data-bs-dismiss="offcanvas"></button>
    </div>

    <div class="offcanvas-body">
      <!-- Mobile Search -->
      <div class="input-group mb-4">
        <span class="input-group-text bg-light">
          <i class="bi bi-search"></i>
        </span>

        <input
          v-model="searchQuery"
          class="form-control"
          type="search"
          placeholder="Search..."
        />
      </div>

      <ul class="navbar-nav gap-2">
        <li v-for="link in mainNavLinks" :key="link.label">
          <RouterLink
            :to="link.to"
            class="nav-link mobile-nav-link"
            :class="{ 'section-active': isSectionActive(link.section) }"
          >
            {{ link.label }}
          </RouterLink>
        </li>

        <li>
          <button class="btn btn-light w-100 mb-2" @click="toggleTheme">
            <i :class="currentTheme === 'light' ? 'bi bi-moon-stars' : 'bi bi-brightness-high'"></i>
            Toggle Theme
          </button>
        </li>

        <li class="dropdown">
          <button class="btn btn-light w-100 dropdown-toggle" data-bs-toggle="dropdown">
            <i class="bi bi-globe2"></i>
            {{ currentLanguage }}
          </button>

          <ul class="dropdown-menu w-100">
            <li><button class="dropdown-item" @click="changeLanguage('English')">English</button></li>
            <li><button class="dropdown-item" @click="changeLanguage('Bahasa Melayu')">Bahasa Melayu</button></li>
            <li><button class="dropdown-item" @click="changeLanguage('中文')">中文</button></li>
          </ul>
        </li>

        <hr />

        <template v-if="!authStore.isLoggedIn">
          <li><RouterLink to="/login" class="btn btn-outline-primary w-100 mb-2">Login</RouterLink></li>
          <li><RouterLink to="/register" class="btn btn-primary w-100">Register</RouterLink></li>
        </template>

        <template v-else>
          <li><RouterLink to="/dashboard" class="nav-link">My Journeys</RouterLink></li>
          <li><RouterLink to="/saved-islands" class="nav-link">Saved Islands</RouterLink></li>
          <li><RouterLink to="/settings" class="nav-link">Settings</RouterLink></li>
          <li><button class="btn btn-outline-danger w-100 mt-3" @click="handleLogout">Logout</button></li></template>
      </ul>
    </div>
  </div>
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

.offcanvas .navbar-nav,
.offcanvas .navbar-nav li {
  width: 100%;
}

.offcanvas .btn,
.offcanvas .nav-link {
  width: 100%;
  display: block;
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

.main-nav-item .nav-link.section-active,
.offcanvas .mobile-nav-link.section-active  {
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
</style>