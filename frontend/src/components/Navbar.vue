<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()

const searchQuery = ref('')
const showSuggestions = ref(false)

const currentTheme = ref(localStorage.getItem('theme') || 'light')
const currentLanguage = ref(localStorage.getItem('language') || 'English')

function handleLogout() {
  authStore.logout()
}

const suggestions = [
  { label: 'Maldives', type: 'Island', path: '/islands/1' },
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
      <RouterLink to="/" class="navbar-brand fw-bold me-3">Reef Tales</RouterLink>
      
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
      <ul class="navbar-nav ms-auto d-none d-lg-flex flex-row align-items-center gap-3">
        <li class="nav-item"><RouterLink to="/discovery" class="nav-link">Discovery</RouterLink></li>
        <li class="nav-item"><RouterLink to="/community" class="nav-link">Community Diaries</RouterLink></li>
        <li class="nav-item"><RouterLink to="/planner" class="nav-link">Trip Planner</RouterLink></li>

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
          <a class="nav-action-btn" href="#" role="button" data-bs-toggle="dropdown"><i class="bi bi-person-circle fs-4"></i></a>

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
      <h5 class="offcanvas-title fw-bold">Reef Tales</h5>
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
        <li><RouterLink to="/discovery" class="nav-link">Discovery</RouterLink></li>
        <li><RouterLink to="/community" class="nav-link">Community Diaries</RouterLink></li>
        <li><RouterLink to="/planner" class="nav-link">Trip Planner</RouterLink></li>

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
nav{
  background: #efe7dc;
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

.navbar-nav > .nav-item > .nav-link.router-link-active,
.offcanvas .nav-link.router-link-active {
  color: #D66967 !important;
  font-weight: 600;
}

@media (min-width: 992px) {
  .nav-item {
    display: flex;
    align-items: center;
  }
}
</style>