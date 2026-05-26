<script setup>
import { VueDatePicker } from '@vuepic/vue-datepicker'

defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

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
}

.reef-time-picker .time-input-icon {
  position: absolute;
  left: 14px;
  top: 23px;
  z-index: 2;
  color: #1897a0;
  font-size: 1rem;
  transform: translateY(-50%);
  pointer-events: none;
}

.reef-time-picker .dp--theme-light {
  --dp-menu-padding: 8px;
  --dp-time-font-size: 1.35rem;
  --dp-time-inc-dec-button-size: 24px;
  --dp-button-icon-height: 16px;
  --dp-overlay-height: auto;
}

.reef-time-picker .dp--input-icon,
.reef-time-picker .dp--input-icons {
  display: none !important;
}

.reef-time-picker .dp__input,
.reef-time-picker .dp--input {
  min-height: 44px;
  border-radius: 14px;
  border: 1px solid #eadfca;
  background: #fffdf8;
  padding-left: 42px !important;
  color: #1f2a44;
  font-weight: 600;
}

.reef-time-picker .dp__menu,
.reef-time-picker .dp--menu {
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid #eadfca;
  min-width: 240px;
  box-shadow: 0 18px 40px rgba(0,0,0,0.12);
}

.reef-time-picker .dp--menu-inner {
  padding: 8px !important;
}

.reef-time-picker .dp__overlay,
.reef-time-picker .dp--overlay {
  border-radius: 18px;
  height: auto !important;
  min-height: 0 !important;
}

.reef-time-picker .dp--overlay-container,
.reef-time-picker .dp--time-picker-overlay-container,
.reef-time-picker .dp--tp-wrap {
  height: auto !important;
  min-height: 0 !important;
  overflow: visible !important;
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

body.dark-mode .reef-time-picker .dp__input,
body.dark-mode .reef-time-picker .dp--input {
  background: #2d3748;
  border-color: rgba(255,255,255,0.08);
  color: #f8fafc;
}

body.dark-mode .reef-time-picker .time-input-icon {
  color: #62c3c9;
}
</style>
