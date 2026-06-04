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
    <div v-if="$slots.actions" class="empty-actions">
      <slot name="actions"></slot>
    </div>
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
  background: var(--surface-soft);
  border: 1px dashed #c4a484;
  text-align: center;
  color: var(--text-secondary);
  padding: 32px;
}

.empty-state i {
  font-size: 2.4rem;
  color: var(--accent);
  margin-bottom: 12px;
}

.empty-state h5 {
  color: var(--text-primary);
  font-weight: 700;
}

.empty-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 8px;
}

.empty-actions :deep(a),
.empty-actions :deep(button) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid var(--accent);
  border-radius: 999px;
  padding: 9px 14px;
  background: var(--accent);
  color: #ffffff;
  font-family: inherit;
  font-size: 0.86rem;
  font-weight: 800;
  text-decoration: none;
}

.empty-actions :deep(a:hover),
.empty-actions :deep(button:hover) {
  background: var(--accent-strong);
  color: #ffffff;
}
</style>
