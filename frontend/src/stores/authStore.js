import { defineStore } from 'pinia'
import {
  loginUser,
  registerUser
} from '@/services/authService'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null
  }),

  getters: {
    isLoggedIn: (state) => !!state.token
  },

  actions: {
    async login(email, password) {
      const res = await loginUser(email, password)

      this.token = res.token
      this.user = res.user

      localStorage.setItem('token', this.token)
      localStorage.setItem('user', JSON.stringify(this.user))
    },

    async register(username, email, password) {
      const res = await registerUser(username, email, password)
    },

    logout() {
      this.user = null
      this.token = null

      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }
})