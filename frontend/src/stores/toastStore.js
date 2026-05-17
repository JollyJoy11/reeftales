import { defineStore } from 'pinia'

export const useToastStore = defineStore('toast', {
  state: () => ({
    message: '',
    variant: 'success',
    visible: false,
    timer: null
  }),

  actions: {
    show(message, variant = 'success') {
      this.message = message
      this.variant = variant
      this.visible = true

      clearTimeout(this.timer)

      this.timer = setTimeout(() => {
        this.hide()
      }, 3500)
    },

    success(message) {
      this.show(message, 'success')
    },

    danger(message) {
      this.show(message, 'danger')
    },

    hide() {
      this.visible = false
      this.message = ''
      clearTimeout(this.timer)
    }
  }
})