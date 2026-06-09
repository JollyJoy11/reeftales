import { defineStore } from 'pinia'
import {
  getCurrentUser,
  loginUser,
  registerUser,
  updateProfile,
  updateSettings
} from '@/services/authService'
import { normalizeLanguage, setI18nLanguage } from '@/i18n'

function applyUserPreferences(user) {
  const theme = user?.appearance_theme || localStorage.getItem('theme') || 'light'
  const colorScheme = user?.color_scheme || localStorage.getItem('color_scheme') || 'teal'
  const colorSchemes = ['teal', 'sunset']
  const largeTextActive = Boolean(user?.larger_text) || user?.font_size === 'large'
  const smallTextActive = user?.font_size === 'small' && !largeTextActive

  localStorage.setItem('theme', theme)
  localStorage.setItem('color_scheme', colorScheme)
  const language = normalizeLanguage(user?.language || localStorage.getItem('language') || 'English')

  localStorage.setItem('language', language)
  setI18nLanguage(language)

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

function saveStoredUser(user) {
  if (!user) return

  localStorage.setItem('user', JSON.stringify(user))
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
      this.user = {
        ...res.user,
        language: normalizeLanguage(res.user?.language || localStorage.getItem('language') || 'English')
      }

      localStorage.setItem('token', this.token)
      saveStoredUser(this.user)
      applyUserPreferences(this.user)
    },

    async register(username, email, password) {
      await registerUser(username, email, password)
    },

    async loadCurrentUser() {
      if (!this.token) return null

      const user = await getCurrentUser()
      const language = normalizeLanguage(localStorage.getItem('language') || user?.language || 'English')

      this.user = {
        ...user,
        language
      }
      saveStoredUser(this.user)
      applyUserPreferences(this.user)
      return this.user
    },

    async saveProfile(data) {
      const user = await updateProfile(data)
      const language = normalizeLanguage(this.user?.language || localStorage.getItem('language') || user?.language || 'English')

      this.user = {
        ...user,
        language
      }
      saveStoredUser(this.user)
      applyUserPreferences(this.user)
      return this.user
    },

    async saveSettings(data) {
      const settings = {
        ...data,
        language: normalizeLanguage(data.language || this.user?.language || localStorage.getItem('language') || 'English')
      }
      const user = await updateSettings(settings)

      this.user = {
        ...user,
        language: normalizeLanguage(settings.language || user?.language)
      }
      saveStoredUser(this.user)
      applyUserPreferences(this.user)
      return this.user
    },

    setLanguage(language) {
      const normalizedLanguage = setI18nLanguage(language)

      if (this.user) {
        this.user = {
          ...this.user,
          language: normalizedLanguage
        }
        saveStoredUser(this.user)
      }

      return normalizedLanguage
    },

    logout() {
      this.user = null
      this.token = null

      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }
})
