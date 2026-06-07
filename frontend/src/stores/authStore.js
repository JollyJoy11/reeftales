import { defineStore } from 'pinia'
import {
  getCurrentUser,
  loginUser,
  registerUser,
  updateProfile,
  updateSettings
} from '@/services/authService'
import { setI18nLanguage } from '@/i18n'

function applyUserPreferences(user) {
  const theme = user?.appearance_theme || localStorage.getItem('theme') || 'light'
  const colorScheme = user?.color_scheme || localStorage.getItem('color_scheme') || 'teal'
  const colorSchemes = ['teal', 'sunset']
  const largeTextActive = Boolean(user?.larger_text) || user?.font_size === 'large'
  const smallTextActive = user?.font_size === 'small' && !largeTextActive

  localStorage.setItem('theme', theme)
  localStorage.setItem('color_scheme', colorScheme)
  localStorage.setItem('language', user?.language || localStorage.getItem('language') || 'English')
  setI18nLanguage(user?.language || localStorage.getItem('language') || 'English')

  document.body.classList.toggle('dark-mode', theme === 'dark')
  document.body.classList.toggle('large-text-mode', largeTextActive)
  document.body.classList.toggle('small-text-mode', smallTextActive)
  document.documentElement.classList.toggle('large-text-mode', largeTextActive)
  document.documentElement.classList.toggle('small-text-mode', smallTextActive)
  document.body.classList.toggle('reduced-motion-mode', Boolean(user?.reduced_motion))
  document.body.classList.toggle('high-contrast-mode', Boolean(user?.high_contrast))
  colorSchemes.forEach((scheme) =>
    document.body.classList.toggle(`color-scheme-${scheme}`, scheme === colorScheme)
  )

  window.requestAnimationFrame?.(() => {
    window.dispatchEvent(new CustomEvent('reef:layout-preferences-changed'))
  })
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    isDark: (state) => {
      const theme = state.user?.appearance_theme ?? localStorage.getItem('theme') ?? 'light'
      return theme === 'dark'
    }
  },

  actions: {
    async login(email, password) {
      const res = await loginUser(email, password)

      this.token = res.token
      this.user = res.user

      localStorage.setItem('token', this.token)
      localStorage.setItem('user', JSON.stringify(this.user))
      applyUserPreferences(this.user)
    },

    async register(username, email, password) {
      const res = await registerUser(username, email, password)
    },

    async loadCurrentUser() {
      if (!this.token) return null

      const user = await getCurrentUser()
      this.user = user
      localStorage.setItem('user', JSON.stringify(user))
      applyUserPreferences(user)
      return user
    },

    async saveProfile(data) {
      const user = await updateProfile(data)
      this.user = user
      localStorage.setItem('user', JSON.stringify(user))
      applyUserPreferences(user)
      return user
    },

    async saveSettings(data) {
      const user = await updateSettings(data)
      this.user = user
      localStorage.setItem('user', JSON.stringify(user))
      applyUserPreferences(user)
      return user
    },

    logout() {
      this.user = null
      this.token = null

      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }
})
