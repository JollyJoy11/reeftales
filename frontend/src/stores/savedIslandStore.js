import { defineStore } from 'pinia'
import {
  getSavedIslands,
  toggleSavedIsland
} from '@/services/savedIslandService'
import { useToastStore } from '@/stores/toastStore'

export const useSavedIslandStore = defineStore('savedIslands', {
  state: () => ({
    savedIslands: [],
    loaded: false
  }),

  getters: {
    savedIds: (state) => state.savedIslands.map(island => island.id),

    isSaved: (state) => {
      return (islandId) => state.savedIslands.some(
        island => Number(island.id) === Number(islandId)
      )
    }
  },

  actions: {
    async loadSavedIslands() {
      if (this.loaded) return

      this.savedIslands = await getSavedIslands()
      this.loaded = true
    },

    async toggle(island) {
      const toastStore = useToastStore()
      const response = await toggleSavedIsland(island.id)

      if (response.saved) {
        this.savedIslands.push(island)
        toastStore.success('Island saved.')
      } else {
        this.savedIslands = this.savedIslands.filter(
          savedIsland => Number(savedIsland.id) !== Number(island.id)
        )
        toastStore.success('Removed from saved islands.')
      }

      return response.saved
    },

    clear() {
      this.savedIslands = []
      this.loaded = false
    }
  }
})