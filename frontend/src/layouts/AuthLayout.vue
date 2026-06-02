<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const currentTheme = ref(localStorage.getItem('theme') || 'light')
const currentLanguage = ref(localStorage.getItem('language') || 'English')

function toggleTheme() {
  currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light'
  localStorage.setItem('theme', currentTheme.value)
  document.body.classList.toggle('dark-mode', currentTheme.value === 'dark')
}

function goBack() {
  router.back()
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
  <main class="auth-page">
    <video class="auth-bg-video" autoplay muted loop playsinline>
      <source src="/videos/auth-ocean.mp4" type="video/mp4" />
    </video>

    <button class="auth-back-btn" @click="goBack">
      <i class="bi bi-arrow-left"></i>
      <span>Back</span>
    </button>

    <slot />

    <div class="auth-floating-tools">
      <button class="auth-tool-btn" @click="toggleTheme">
        <i :class="currentTheme === 'light' ? 'bi bi-moon-stars' : 'bi bi-brightness-high'"></i>
      </button>

      <div class="dropup">
        <button class="auth-tool-btn" data-bs-toggle="dropdown">
          <i class="bi bi-globe2"></i>
        </button>

        <ul class="dropdown-menu dropdown-menu-end shadow border-0">
          <li><button class="dropdown-item" @click="changeLanguage('English')">English</button></li>
          <li><button class="dropdown-item" @click="changeLanguage('中文')">中文</button></li>
        </ul>
      </div>
    </div>
  </main>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
  background:
    linear-gradient(rgba(255,255,255,0.72), rgba(255,255,255,0.9)),
    url('/images/postcard.jpg');
  background-size: cover;
  background-position: center;
  position: relative;
  overflow: hidden;
}

.auth-bg-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
}

.auth-page::after {
  content: "";
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,0.267);
  z-index: 1;
}

.auth-floating-tools {
  position: fixed;
  right: 24px;
  bottom: 24px;
  display: flex;
  gap: 10px;
  z-index: 1050;
}

.auth-tool-btn {
  width: 42px;
  height: 42px;
  border: none;
  border-radius: 50%;
  background: #fbf9f1;
  color: #5b4636;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-tool-btn:hover {
  background: #efe7dc;
  color: #1897a0;
}

.auth-back-btn {
  position: fixed;
  top: 24px;
  left: 24px;
  z-index: 1200;
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  border-radius: 999px;
  padding: 10px 16px;
  background: #fbf9f1;
  color: #5b4636;
  box-shadow: 0 8px 24px rgba(0,0,0,0.16);
}

.auth-back-btn:hover {
  background: #efe7dc;
  color: #1897a0;
}
</style>

