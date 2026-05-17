<script setup>
defineProps({
  icon: {
    type: String,
    default: 'bi bi-compass'
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  }
})
</script>

<template>
  <div class="empty-state">
    <i :class="icon"></i>
    <h5>{{ title }}</h5>
    <p>{{ message }}</p>
  </div>
</template>

<style scoped>
.empty-state {
  min-height: 280px;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 22px;
  background: #fbf9f1;
  border: 1px dashed #c4a484;
  text-align: center;
  color: #64748b;
  padding: 32px;
}

.empty-state i {
  font-size: 2.4rem;
  color: #1897a0;
  margin-bottom: 12px;
}

.empty-state h5 {
  color: #2f4858;
  font-weight: 700;
}
</style>