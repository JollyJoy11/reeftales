<script setup>
import { useToastStore } from '@/stores/toastStore'
import AppAlert from '@/components/common/AppAlert.vue'

const toastStore = useToastStore()
</script>

<template>
  <AppAlert
    v-if="toastStore.visible"
    :message="toastStore.message"
    :variant="toastStore.variant"
    @close="toastStore.hide()"
  />
  
  <router-view />
</template>