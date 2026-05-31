<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { VueDatePicker } from '@vuepic/vue-datepicker'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  label: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const calendarOpen = ref(false)
const oneDayTrip = ref(false)
const isWideScreen = ref(false)
let mediaQuery

const calendarCount = computed(() => {
  return isWideScreen.value && !oneDayTrip.value ? 2 : false
})

const calendarKey = computed(() => {
  return `${oneDayTrip.value ? 'single-day' : 'range'}-${calendarCount.value || 'one'}`
})

function pad(value) {
  return String(value).padStart(2, '0')
}

function toDateString(value) {
  if (!value) return null

  if (typeof value === 'string') {
    return value.slice(0, 10)
  }

  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
}

function formatDate(value) {
  const dateString = toDateString(value)
  if (!dateString) return ''

  const [year, month, day] = dateString.split('-')
  return `${month}/${day}/${year}`
}

function pickerValue() {
  return oneDayTrip.value
    ? props.modelValue[0] || null
    : props.modelValue
}

function handleUpdate(value) {
  if (oneDayTrip.value) {
    const selectedDate = toDateString(value)
    emit('update:modelValue', selectedDate ? [selectedDate, selectedDate] : [])
    return
  }

  if (!Array.isArray(value)) {
    emit('update:modelValue', [])
    return
  }

  emit('update:modelValue', [
    toDateString(value[0]),
    toDateString(value[1])
  ])
}

function toggleOneDayTrip() {
  if (!oneDayTrip.value) {
    oneDayTrip.value = true

    if (props.modelValue[0]) {
      emit('update:modelValue', [
        props.modelValue[0],
        props.modelValue[0]
      ])
    }
  } else {
    oneDayTrip.value = false

    if (props.modelValue[0]) {
      emit('update:modelValue', [
        props.modelValue[0],
        props.modelValue[0]
      ])
    }
  }
}

function syncMediaQuery() {
  isWideScreen.value = mediaQuery?.matches || false
}

watch(
  () => props.modelValue,
  (value) => {
    const start = value?.[0]
    const end = value?.[1]

    oneDayTrip.value = Boolean(start && end && start === end)
  },
  { immediate: true }
)

onMounted(() => {
  mediaQuery = window.matchMedia('(min-width: 768px)')
  syncMediaQuery()
  mediaQuery.addEventListener('change', syncMediaQuery)
})

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener('change', syncMediaQuery)
})
</script>

<template>
  <div class="reef-date-picker">
    <div class="date-picker-header" :class="{ 'without-label': !label }">
      <label v-if="label" class="form-label fw-bold mb-0">
        {{ label }}
      </label>

      <button
        class="one-day-toggle"
        type="button"
        :class="{ active: oneDayTrip }"
        @click="toggleOneDayTrip"
      >
        <span class="toggle-track">
          <span class="toggle-thumb"></span>
        </span>
        <span>One-day trip</span>
      </button>
    </div>

    <div class="date-range-fields" :class="{ 'one-day': oneDayTrip }">
      <i class="bi bi-calendar3 date-input-icon" aria-hidden="true"></i>

      <button class="date-field" type="button" @click="calendarOpen = true">
        <span class="date-field-label">
          {{ oneDayTrip ? 'Trip Date' : 'Start Date' }}
        </span>
        <span class="date-field-value">
          {{ formatDate(modelValue[0]) || (oneDayTrip ? 'Select date' : 'Select start date') }}
        </span>
      </button>

      <button
        v-if="!oneDayTrip"
        class="date-field"
        type="button"
        @click="calendarOpen = true"
      >
        <span class="date-field-label">End Date</span>
        <span class="date-field-value">
          {{ formatDate(modelValue[1]) || 'Select end date' }}
        </span>
      </button>
    </div>

    <div v-if="calendarOpen" class="inline-calendar">
      <VueDatePicker
        :key="calendarKey"
        :model-value="pickerValue()"
        :range="!oneDayTrip"
        model-type="yyyy-MM-dd"
        :inline="{ input: false }"
        :multi-calendars="calendarCount"
        :enable-time-picker="false"
        :time-picker="false"
        :clearable="false"
        hide-input-icon
        month-name-format="long"
        @update:model-value="handleUpdate"
      >
        <template #clear-icon></template>

        <template #action-row="{ selectDate, disabled }">
          <div class="date-action-row">
            <button class="date-action-btn cancel" type="button" @click="calendarOpen = false">
              Cancel
            </button>

            <button
              class="date-action-btn select"
              type="button"
              :disabled="disabled"
              @click="selectDate(); calendarOpen = false"
            >
              Select
            </button>
          </div>
        </template>
      </VueDatePicker>
    </div>
  </div>
</template>

<style scoped>
.reef-date-picker {
  position: relative;
  display: grid;
  gap: 10px;
}

.date-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.date-picker-header.without-label {
  justify-content: flex-end;
}

.one-day-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px dashed #c4a484;
  border-radius: 999px;
  padding: 7px 12px;
  background: #fbf9f1;
  color: #5b4636;
  font-size: 0.84rem;
  font-weight: 700;
  box-shadow: 0 8px 18px rgba(0,0,0,0.04);
}

.one-day-toggle.active {
  border-color: #1897a0;
  background: #deefec;
  color: #0f766e;
}

.toggle-track {
  width: 34px;
  height: 18px;
  padding: 2px;
  border-radius: 999px;
  background: #d8cdbb;
  transition: background 0.2s ease;
}

.toggle-thumb {
  display: block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fffdf8;
  transition: transform 0.2s ease;
}

.one-day-toggle.active .toggle-track {
  background: #1897a0;
}

.one-day-toggle.active .toggle-thumb {
  transform: translateX(16px);
}

.date-range-fields {
  position: relative;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  width: 100%;
  padding: 6px 8px 6px 42px;
  border: 1px solid #eadfca;
  border-radius: 16px;
  background: #fffdf8;
}

.date-input-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  color: #1897a0;
  font-size: 1rem;
  transform: translateY(-50%);
  pointer-events: none;
}

.date-range-fields.one-day {
  grid-template-columns: 1fr;
}

.date-field {
  min-width: 0;
  border: none;
  border-radius: 12px;
  padding: 8px 10px;
  background: transparent;
  text-align: left;
}

.date-field:hover {
  background: rgba(24, 151, 160, 0.08);
}

.date-field-label {
  display: block;
  margin-bottom: 2px;
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 700;
}

.date-field-value {
  display: block;
  min-height: 24px;
  color: #1e293b;
  font-size: 0.95rem;
}

.inline-calendar {
  position: absolute;
  top: calc(100% + 10px);
  left: 0;
  z-index: 30;
  width: 100%;
  border: 1px solid #eadfca;
  border-radius: 20px;
  background: #fffdf8;
  box-shadow: 0 15px 35px rgba(27, 167, 177, 0.08);
  padding: 14px;
}

.reef-date-picker :deep(.dp--theme-light) {
  --dp-background-color: #fffdf8;
  --dp-border-color: #eadfca;
  --dp-border-radius: 16px;
  --dp-primary-color: #1897a0;
  --dp-primary-text-color: #ffffff;
  --dp-hover-color: rgba(24, 151, 160, 0.08);
  --dp-text-color: #475569;
  --dp-menu-min-width: 100%;
}

.reef-date-picker :deep(.dp--main),
.reef-date-picker :deep(.dp--menu),
.reef-date-picker :deep(.dp--menu-inner),
.reef-date-picker :deep(.dp--menu-content-wrapper) {
  width: 100% !important;
}

.reef-date-picker :deep(.dp--menu-inner) {
  gap: 18px;
}

.reef-date-picker :deep(.dp--calendar-next) {
  margin-inline-start: 0;
}

.reef-date-picker :deep(.dp--calendar-header),
.reef-date-picker :deep(.dp--calendar-row) {
  display: grid !important;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  align-items: center;
  width: 100% !important;
}

.reef-date-picker :deep(.dp--calendar-header-item),
.reef-date-picker :deep(.dp--calendar-item) {
  width: auto !important;
  min-width: 0;
  display: flex;
  justify-content: center;
}

.reef-date-picker :deep(.dp--cell-inner) {
  margin: 0 auto;
}

.reef-date-picker :deep(.dp--menu) {
  border: none;
  box-shadow: none;
  padding: 0;
}

.reef-date-picker :deep(.dp--arrow-top),
.reef-date-picker :deep(.dp--arrow-bottom),
.reef-date-picker :deep(.dp--input-icon) {
  display: none !important;
}

.reef-date-picker :deep(.dp--month-year-wrap) {
  justify-content: space-between;
  padding: 0 6px;
}

.reef-date-picker :deep(.dp--month-year-select) {
  font-weight: 700;
  color: #1e293b;
}

.reef-date-picker :deep(.dp--calendar-header-item) {
  color: #94a3b8;
  font-weight: 700;
  padding: 8px 0;
}

.reef-date-picker :deep(.dp--cell-inner) {
  font-weight: 500;
  border-radius: 0 !important;
  transition: background-color 0.1s ease;
}

.reef-date-picker :deep(.dp--today) {
  border: 1px solid #1897a0 !important;
  border-radius: 50% !important;
}

.reef-date-picker :deep(.dp--range-start),
.reef-date-picker :deep(.dp--range-end),
.reef-date-picker :deep(.dp--range-border-start.dp--active),
.reef-date-picker :deep(.dp--range-border-end.dp--active),
.reef-date-picker :deep(.dp--active) {
  background: #1897a0 !important;
  color: white !important;
}

.reef-date-picker :deep(.dp--range-start),
.reef-date-picker :deep(.dp--range-border-start.dp--active) {
  border-top-left-radius: 50% !important;
  border-bottom-left-radius: 50% !important;
  border-top-right-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
}

.reef-date-picker :deep(.dp--range-end),
.reef-date-picker :deep(.dp--range-border-end.dp--active) {
  border-top-left-radius: 0 !important;
  border-bottom-left-radius: 0 !important;
  border-top-right-radius: 50% !important;
  border-bottom-right-radius: 50% !important;
}

.reef-date-picker :deep(.dp--range-between) {
  background: rgba(24, 151, 160, 0.12) !important;
  color: #0f766e !important;
}

.reef-date-picker :deep(.dp--active:not(.dp--range-start):not(.dp--range-end):not(.dp--range-border-start):not(.dp--range-border-end)) {
  border-radius: 50% !important;
}

.reef-date-picker :deep(.dp--cell-inner:hover) {
  background-color: rgba(24, 151, 160, 0.08);
  border-radius: 50% !important;
}

.reef-date-picker :deep(.dp--time-picker),
.reef-date-picker :deep(.dp--time-picker-inline),
.reef-date-picker :deep(.dp--button),
.reef-date-picker :deep(.dp--selection-preview) {
  display: none !important;
}

.date-action-row {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 10px 4px 0;
}

.date-action-btn {
  border: 1px solid #eadfca;
  border-radius: 999px;
  padding: 4px 10px;
  background: #fffdf8;
  color: #475569;
  font-size: 0.86rem;
}

.date-action-btn.select {
  border-color: #1897a0;
  background: #1897a0;
  color: #fff;
}

.date-action-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

@media (max-width: 575px) {
  .date-picker-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .date-picker-header.without-label {
    align-items: flex-end;
  }

  .date-range-fields {
    grid-template-columns: 1fr;
  }

  .inline-calendar {
    width: min(100%, calc(100vw - 32px));
  }
}
</style>
