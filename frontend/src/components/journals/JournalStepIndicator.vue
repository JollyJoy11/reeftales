<script setup>
const props = defineProps({
  step: {
    type: Number,
    required: true
  },
  maxStep: {
    type: Number,
    default: 1
  }
})

const emit = defineEmits(['update:step'])

const steps = [
  { number: 1, label: 'Basics', icon: 'bi bi-geo-alt' },
  { number: 2, label: 'Story', icon: 'bi bi-journal-text' },
  { number: 3, label: 'Timeline', icon: 'bi bi-clock-history' },
  { number: 4, label: 'Media', icon: 'bi bi-images' },
  { number: 5, label: 'Arrange', icon: 'bi bi-layout-wtf' },
  { number: 6, label: 'Publish', icon: 'bi bi-send' }
]

function goToStep(item) {
  if (item.number > props.maxStep) return
  emit('update:step', item.number)
}
</script>

<template>
  <div class="step-indicator">
    <template
      v-for="(item, index) in steps"
      :key="item.number"
    >
      <button
        type="button"
        class="step-pill"
        :class="{
          active: step === item.number,
          completed: maxStep > item.number && step !== item.number,
          disabled: item.number > maxStep
        }"
        :disabled="item.number > maxStep"
        @click="goToStep(item)"
      >
        <i :class="item.icon"></i>
        <span>{{ item.label }}</span>
      </button>

      <i
        v-if="index !== steps.length - 1"
        class="bi bi-chevron-right step-arrow"
      ></i>
    </template>
  </div>
</template>

<style scoped>
.step-indicator {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 24px;
}

.step-pill {
  border: none;
  padding: 10px 18px;
  border-radius: 999px;
  background: #f6f3eb;
  color: var(--text-secondary);
  font-weight: 700;
  transition: 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.step-pill.active {
  background: var(--accent);
  color: white;
}

.step-pill.completed {
  background: var(--accent-soft);
  color: var(--accent);
}

.step-pill.disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.step-arrow {
  color: #94a3b8;
  font-size: 0.8rem;
}
</style>
