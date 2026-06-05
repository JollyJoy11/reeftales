<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

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
const { t } = useI18n()

const steps = computed(() => [
  { number: 1, label: t('createJournal.steps.basics'), icon: 'bi bi-geo-alt' },
  { number: 2, label: t('createJournal.steps.story'), icon: 'bi bi-journal-text' },
  { number: 3, label: t('createJournal.steps.timeline'), icon: 'bi bi-clock-history' },
  { number: 4, label: t('createJournal.steps.media'), icon: 'bi bi-images' },
  { number: 5, label: t('createJournal.steps.arrange'), icon: 'bi bi-layout-wtf' },
  { number: 6, label: t('createJournal.steps.publish'), icon: 'bi bi-send' }
])

const totalSteps = computed(() => steps.value.length)

function goToStep(item) {
  if (item.number > props.maxStep) return
  emit('update:step', item.number)
}
</script>

<template>
  <div class="step-indicator-wrap">
    <div class="mobile-step-summary">
      <span>{{ t('createJournal.steps.summary', { step, total: totalSteps }) }}</span>
      <strong>{{ steps[step - 1]?.label }}</strong>
    </div>

    <div class="step-indicator" :aria-label="t('createJournal.steps.ariaLabel')">
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
          :aria-current="step === item.number ? 'step' : undefined"
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
  </div>
</template>

<style scoped>
.step-indicator-wrap {
  margin-bottom: 24px;
}

.mobile-step-summary {
  display: none;
}

.step-indicator {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
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

@media (max-width: 768px) {
  .step-indicator-wrap {
    display: grid;
    gap: 10px;
  }

  .mobile-step-summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 12px;
    border: 1px dashed var(--border);
    border-radius: 16px;
    background: var(--surface);
  }

  .mobile-step-summary span {
    color: var(--accent);
    font-size: 0.78rem;
    font-weight: 900;
    text-transform: uppercase;
  }

  .mobile-step-summary strong {
    color: var(--text-primary);
    font-size: 0.95rem;
  }

  .step-indicator {
    flex-wrap: nowrap;
    gap: 8px;
    overflow-x: auto;
    padding: 4px 2px 10px;
    scroll-padding-inline: 12px;
    scrollbar-width: none;
  }

  .step-indicator::-webkit-scrollbar {
    display: none;
  }

  .step-pill {
    min-width: 78px;
    flex: 0 0 78px;
    justify-content: center;
    flex-direction: column;
    gap: 4px;
    padding: 9px 8px;
    border-radius: 16px;
    font-size: 0.72rem;
    line-height: 1.1;
  }

  .step-pill i {
    font-size: 1.05rem;
  }

  .step-arrow {
    display: none;
  }
}
</style>
