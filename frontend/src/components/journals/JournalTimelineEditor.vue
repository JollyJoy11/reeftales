<script setup>
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import draggable from 'vuedraggable'
import AppTimePicker from '@/components/common/AppTimePicker.vue'

const { t } = useI18n()

const draggableTimeline = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emit('update:modelValue', value)
  }
})

const props = defineProps({
  modelValue: {
    type: Array,
    required: true
  },
  activities: {
    type: Array,
    default: () => []
  },
  maxDays: {
    type: Number,
    default: 1
  }
})

const emit = defineEmits(['update:modelValue'])

function updateItem(index, key, value) {
  const updated = [...props.modelValue]
  const nextValue = key === 'day_number' ? Number(value) : value

  updated[index] = { ...updated[index], [key]: nextValue }
  emit('update:modelValue', updated)
}

function addEntry() {
  emit('update:modelValue', [
    ...props.modelValue,
    {
      id: crypto.randomUUID(),
      day_number: Math.min(props.maxDays, props.modelValue.length + 1),
      activity_time: '',
      activity_id: '',
      custom_activity_name: '',
      notes: ''
    }
  ])
}

function removeEntry(index) {
  emit('update:modelValue', props.modelValue.filter((_, i) => i !== index))
}

watch(
  () => props.maxDays,
  () => {
    const clamped = props.modelValue.map(entry => ({
      ...entry,
      day_number: Math.min(Math.max(Number(entry.day_number) || 1, 1), props.maxDays)
    }))

    if (clamped.some((entry, index) => entry.day_number !== props.modelValue[index].day_number)) {
      emit('update:modelValue', clamped)
    }
  }
)
</script>

<template>
  <div>
    <div class="section-heading">
      <div>
        <h5 class="section-title">
          {{ t('createJournal.timelineTitle', { count: maxDays }) }}
          <span class="requirement-badge recommended">{{ t('createJournal.recommended') }}</span>
        </h5>
        <p>{{ t('createJournal.timelineIntro') }}</p>
      </div>
    </div>

    <draggable
      v-model="draggableTimeline"
      item-key="id"
      handle=".timeline-drag-handle"
      ghost-class="timeline-ghost"
      chosen-class="timeline-chosen"
      drag-class="timeline-active"
    >
      <template #item="{ element: entry, index }">
        <div class="paper-entry">
          <button
            type="button"
            class="timeline-drag-handle"
            :title="t('createJournal.dragActivity')"
          >
            <i class="bi bi-grip-vertical"></i>
          </button>

          <button
            v-if="modelValue.length > 1"
            type="button"
            class="remove-icon-btn"
            @click="removeEntry(index)"
          >
            <i class="bi bi-trash3-fill"></i>
          </button>

          <div class="paper-entry-header">
            <div class="day-stamp">
              {{ t('createJournal.dayNumber', { number: entry.day_number || 1 }) }}
            </div>

            <span class="entry-note-label">
              {{ t('createJournal.activityNote', { number: index + 1 }) }}
            </span>
          </div>

          <div class="timeline-fields">
            <div class="field-small">
              <label class="form-label">{{ t('createJournal.day') }}</label>
              <input
                :value="entry.day_number"
                type="number"
                min="1"
                :max="maxDays"
                class="form-control"
                @input="updateItem(index, 'day_number', $event.target.value)"
              />
            </div>

            <div class="field-small">
              <label class="form-label">{{ t('createJournal.time') }}</label>
              <AppTimePicker
                :model-value="entry.activity_time"
                @update:model-value="updateItem(index, 'activity_time', $event)"
              />
            </div>

            <div class="field-medium">
              <label class="form-label">{{ t('createJournal.activity') }}</label>
              <select
                :value="entry.activity_id"
                class="form-select"
                @change="updateItem(index, 'activity_id', $event.target.value)"
              >
                <option value="">{{ t('createJournal.chooseActivity') }}</option>
                <option
                  v-for="activity in activities"
                  :key="activity.id"
                  :value="activity.id"
                >
                  {{ activity.name }}
                </option>
                <option value="custom">
                  {{ t('createJournal.otherActivity') }}
                </option>
              </select>
            </div>

            <div v-if="entry.activity_id === 'custom'" class="field-medium">
              <label class="form-label">{{ t('createJournal.customActivity') }}</label>
              <input
                :value="entry.custom_activity_name"
                type="text"
                class="form-control"
                :placeholder="t('createJournal.customActivityPlaceholder')"
                @input="updateItem(index, 'custom_activity_name', $event.target.value)"
              />
            </div>

            <div class="field-full">
              <label class="form-label">{{ t('createJournal.notes') }}</label>
              <textarea
                :value="entry.notes"
                rows="2"
                class="form-control"
                :placeholder="t('createJournal.activityNotesPlaceholder')"
                @input="updateItem(index, 'notes', $event.target.value)"
              ></textarea>
            </div>
          </div>
        </div>
      </template>
    </draggable>

    <button
      type="button"
      class="btn btn-outline-primary"
      @click="addEntry"
    >
      <i class="bi bi-plus-circle"></i>
      {{ t('createJournal.addActivity') }}
    </button>
  </div>
</template>

<style scoped>
.section-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  color: var(--text-primary);
  font-weight: 800;
  margin-bottom: 4px;
}

.section-heading {
  margin-bottom: 14px;
}

.section-heading p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.86rem;
}

.requirement-badge {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 0.66rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.requirement-badge.recommended {
  background: #fff8db;
  color: #8a5b00;
  border: 1px solid rgba(201,145,46,0.28);
}

.paper-entry {
  position: relative;
  background: #ffffff;
  border: 1px dashed #eadfca;
  border-radius: 22px;
  padding: 20px 20px 20px 54px;
  margin-bottom: 18px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.04);
}

.paper-entry-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
}

.day-stamp {
  min-width: 64px;
  height: 44px;
  padding: 0 12px;
  border-radius: 14px;
  background: rgba(var(--accent-rgb),0.12);
  color: var(--accent);
  border: 1px dashed rgba(var(--accent-rgb),0.35);
  display: grid;
  place-items: center;
  font-size: 0.78rem;
  font-weight: 900;
  transform: rotate(-2deg);
}

.entry-note-label {
  color: #7c6f63;
  font-family: 'Spectral', serif;
  font-size: 0.98rem;
  font-style: italic;
  font-weight: 700;
}

.remove-icon-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  border: none;
  background: var(--surface-soft);
  color: #94a3b8;
  width: 34px;
  height: 34px;
  border-radius: 50%;
}

.remove-icon-btn:hover {
  color: #dc3545;
  background: var(--surface-soft);
}

.timeline-fields {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 14px;
}

.field-small {
  grid-column: span 3;
  max-width: 220px;
}

.field-medium {
  grid-column: span 6;
  max-width: 420px;
}

.field-full {
  grid-column: 1 / -1;
}

.form-label {
  color: var(--text-primary);
  font-size: 0.82rem;
  font-weight: 700;
}

.timeline-drag-handle {
  position: absolute;
  left: 14px;
  top: 20px;
  bottom: 20px;
  width: 28px;
  border: none;
  border-radius: 8px;
  background: rgba(var(--accent-rgb),0.08);
  color: #94a3b8;
  display: grid;
  place-items: center;
  cursor: grab;
}

.timeline-drag-handle:hover {
  background: rgba(var(--accent-rgb),0.16);
  color: var(--accent);
}

.timeline-drag-handle:active {
  cursor: grabbing;
}

.timeline-chosen {
  border-color: var(--accent) !important;
  background: var(--accent-soft) !important;
}

.timeline-active {
  opacity: 0.8;
  transform: rotate(0.5deg);
}

.timeline-ghost {
  opacity: 0.35;
  border: 2px dashed var(--accent) !important;
}

@media (max-width: 768px) {
  .timeline-fields {
    grid-template-columns: 1fr;
  }

  .field-small,
  .field-medium,
  .field-full {
    grid-column: 1;
    max-width: none;
  }

  .paper-entry {
    padding: 58px 16px 16px;
  }

  .timeline-drag-handle {
    left: 16px;
    right: 16px;
    top: 14px;
    bottom: auto;
    width: auto;
    height: 28px;
    border-radius: 999px;
  }

  .timeline-drag-handle i {
    transform: rotate(90deg);
  }

  .remove-icon-btn {
    top: 48px;
    right: 14px;
  }
}
</style>
