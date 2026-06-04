<script setup>
import { onMounted } from 'vue'

const props = defineProps({
  message: {
    type: String,
    required: true
  },
  variant: {
    type: String,
    default: 'danger'
  },
  duration: {
    type: Number,
    default: 3500
  }
})

const emit = defineEmits(['close'])

onMounted(() => {
  setTimeout(() => {
    emit('close')
  }, props.duration)
})
</script>

<template>
  <div class="app-toast" :class="variant">
    <i
      :class="variant === 'success'
        ? 'bi bi-check-circle'
        : 'bi bi-exclamation-circle'"
    ></i>

    <span>{{ message }}</span>

    <button type="button" @click="emit('close')">
      <i class="bi bi-x"></i>
    </button>
  </div>
</template>

<style scoped>
.app-toast {
  position: fixed;
  top: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2000;
  min-width: 300px;
  max-width: 420px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 16px;
  background: var(--surface-soft);
  color: var(--text-primary);
  border: 1px solid #eadfca;
  box-shadow: 0 12px 30px rgba(0,0,0,0.16);
  font-weight: 800;
}

.app-toast > i {
  flex: 0 0 auto;
  font-size: 1.1rem;
}

.app-toast.danger {
  border-color: #dc3545;
  background-color: #fff1f2;
  color: #7f1d1d;
}

.app-toast.success {
  border-color: #0f8f62;
  background-color: #dcfce7;
  color: #064e3b;
}

.app-toast button {
  margin-left: auto;
  margin-right: 0;
  padding-right: 0;
  border: none;
  background: transparent;
  color: inherit;
}

@media (max-width: 576px) {
  .app-toast {
    left: 16px;
    right: 16px;
    transform: none;
    top: 80px;
    min-width: unset;
    max-width: unset;
  }
}
</style>
