<script setup>
defineProps({
  message: {
    type: String,
    required: true
  }
})
</script>

<template>
  <div class="loading-state">
    <div class="spinner-border text-info" role="status"></div>
    <p>{{ message }}</p>
  </div>
</template>

<style scoped>
.loading-state {
  min-height: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: #64748b;
}

.loading-state p {
  margin: 0;
}
</style>