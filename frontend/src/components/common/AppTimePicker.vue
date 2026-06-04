<script setup>
import { VueDatePicker } from '@vuepic/vue-datepicker'
import { useAuthStore } from '@/stores/authStore'

defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const authStore = useAuthStore()

function handleUpdate(value) {
  if (!value) {
    emit('update:modelValue', '')
    return
  }

  const rawHours = value.hours ?? value.getHours?.()
  const rawMinutes = value.minutes ?? value.getMinutes?.()

  if (rawHours === undefined || rawMinutes === undefined) {
    emit('update:modelValue', '')
    return
  }

  const hours = String(rawHours).padStart(2, '0')
  const minutes = String(rawMinutes).padStart(2, '0')

  emit('update:modelValue', `${hours}:${minutes}`)
}

function convertToPickerTime(time) {
  if (!time) return null

  const [hours, minutes] = time.split(':')

  return {
    hours: Number(hours),
    minutes: Number(minutes),
    seconds: 0
  }
}

function formatTime(value) {
  if (!value) return ''

  const rawHours = value.hours ?? value.getHours?.()
  const rawMinutes = value.minutes ?? value.getMinutes?.()

  if (rawHours === undefined || rawMinutes === undefined) return ''

  return `${String(rawHours).padStart(2, '0')}:${String(rawMinutes).padStart(2, '0')}`
}
</script>

<template>
  <div class="reef-time-picker">
    <i class="bi bi-clock time-input-icon" aria-hidden="true"></i>
    <VueDatePicker
      :model-value="convertToPickerTime(modelValue)"
      :dark="authStore.isDark"
      time-picker
      auto-apply
      hide-input-icon
      placeholder="Select time"
      :format="formatTime"
      :teleport="false"
      @update:model-value="handleUpdate"
    >
      <template #input-icon></template>
    </VueDatePicker>
  </div>
</template>

<style>
.reef-time-picker {
  position: relative;
  width: 100%;
}

.reef-time-picker .time-input-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  z-index: 2;
  color: var(--accent);
  font-size: 1rem;
  transform: translateY(-50%);
  pointer-events: none;
}

/* ── shared layout ── */
.reef-time-picker .dp--input-icon,
.reef-time-picker .dp--input-icons {
  display: none !important;
}

.reef-time-picker .dp--input-wrap,
.reef-time-picker .dp--menu-wrapper {
  width: 100%;
}

.reef-time-picker .dp--menu-inner {
  padding: 8px !important;
}

.reef-time-picker .dp__overlay,
.reef-time-picker .dp--overlay {
  border-radius: 10px;
}

.reef-time-picker .dp--overlay-container,
.reef-time-picker .dp--time-picker-overlay-container {
  min-height: 0 !important;
  overflow-y: auto !important;
}

.reef-time-picker .dp--tp-wrap {
  min-height: 0 !important;
}

.reef-time-picker .dp--time-input {
  height: 76px !important;
  min-height: 76px !important;
  padding: 0 10px;
}

.reef-time-picker .dp--time-col-reg-block,
.reef-time-picker .dp--time-col-reg-inline,
.reef-time-picker .dp--time-col-reg-with-button {
  padding: 0 10px;
}

.reef-time-picker .dp--time-display {
  padding: 2px 8px;
}

/* ── light theme ── */
.reef-time-picker .dp--theme-light {
  --dp-primary-color: #1897a0;
  --dp-primary-text-color: #ffffff;
  --dp-border-radius: 10px;
  --dp-menu-padding: 8px;
  --dp-time-font-size: 1.35rem;
  --dp-time-inc-dec-button-size: 24px;
  --dp-button-icon-height: 16px;
}

.reef-time-picker .dp--theme-light .dp__input,
.reef-time-picker .dp--theme-light .dp--input {
  height: 38px;
  min-height: 38px;
  border-radius: 10px;
  border: 1px solid #eadfca;
  background: #ffffff;
  padding-left: 42px !important;
  color: #1f2a44;
}

.reef-time-picker .dp--theme-light .dp__menu,
.reef-time-picker .dp--theme-light .dp--menu {
  width: 100%;
  min-width: 100%;
  max-width: 100%;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #eadfca;
  box-shadow: 0 18px 40px rgba(0,0,0,0.12);
}

/* ── dark theme ── */
.reef-time-picker .dp--theme-dark {
  --dp-primary-color: #26d2de;
  --dp-primary-text-color: #0b1120;
  --dp-background-color: #1f2b3f;
  --dp-text-color: #f8fafc;
  --dp-hover-color: #253244;
  --dp-hover-text-color: #f8fafc;
  --dp-secondary-color: #2c384d;
  --dp-border-color: rgba(255,255,255,0.12);
  --dp-border-color-hover: rgba(255,255,255,0.22);
  --dp-border-color-focus: #26d2de;
  --dp-icon-color: #9fb7ce;
  --dp-disabled-color: #2c384d;
  --dp-disabled-color-text: #64748b;
  --dp-scroll-bar-background: #253244;
  --dp-scroll-bar-color: #26d2de;
  --dp-border-radius: 10px;
  --dp-menu-padding: 8px;
  --dp-time-font-size: 1.35rem;
  --dp-time-inc-dec-button-size: 24px;
  --dp-button-icon-height: 16px;
}

.reef-time-picker .dp--theme-dark .dp__input,
.reef-time-picker .dp--theme-dark .dp--input {
  height: 38px;
  min-height: 38px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.12);
  background: #1f2b3f;
  padding-left: 42px !important;
  color: #f8fafc;
}

.reef-time-picker .dp--theme-dark .dp__input::placeholder {
  color: #9fb7ce;
}

.reef-time-picker .dp--theme-dark .dp__menu,
.reef-time-picker .dp--theme-dark .dp--menu {
  width: 100%;
  min-width: 100%;
  max-width: 100%;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.12);
  background: #1f2b3f;
  box-shadow: 0 18px 40px rgba(0,0,0,0.4);
}
</style>
