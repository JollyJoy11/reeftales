<script setup>
import { computed, watch } from 'vue'
import draggable from 'vuedraggable'
import AppTimePicker from '@/components/common/AppTimePicker.vue'

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
    <h5 class="section-title">Trip Timeline</h5>

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
            title="Drag to reorder activity"
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
              Day {{ entry.day_number || 1 }}
            </div>

            <span class="entry-note-label">
              Activity note #{{ index + 1 }}
            </span>
          </div>

          <div class="timeline-fields">
            <div class="field-small">
              <label class="form-label">Day</label>
              <input
                :value="entry.day_number"
                type="number"
                min="1"
                :max="maxDays"
                class="form-control"
                @input="updateItem(index, 'day_number', $event.target.value)"
              />
              <small class="day-limit-hint">Max Day {{ maxDays }}</small>
            </div>

            <div class="field-small">
              <label class="form-label">Time</label>
              <AppTimePicker
                :model-value="entry.activity_time"
                @update:model-value="updateItem(index, 'activity_time', $event)"
              />
            </div>

            <div class="field-medium">
              <label class="form-label">Activity</label>
              <select
                :value="entry.activity_id"
                class="form-select"
                @change="updateItem(index, 'activity_id', $event.target.value)"
              >
                <option value="">Choose existing activity</option>
                <option
                  v-for="activity in activities"
                  :key="activity.id"
                  :value="activity.id"
                >
                  {{ activity.name }}
                </option>
              </select>
            </div>

            <div class="field-medium">
              <label class="form-label">Custom activity</label>
              <input
                :value="entry.custom_activity_name"
                type="text"
                class="form-control"
                placeholder="e.g. Night diving"
                @input="updateItem(index, 'custom_activity_name', $event.target.value)"
              />
            </div>

            <div class="field-full">
              <label class="form-label">Notes</label>
              <textarea
                :value="entry.notes"
                rows="2"
                class="form-control"
                placeholder="Notes about this activity..."
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
      Add Activity
    </button>
  </div>
</template>

<style scoped>
.section-title {
  color: #2f4858;
  font-weight: 800;
  margin-bottom: 14px;
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
  background: rgba(24,151,160,0.12);
  color: #1897a0;
  border: 1px dashed rgba(24,151,160,0.35);
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
  background: #fbf9f1;
  color: #94a3b8;
  width: 34px;
  height: 34px;
  border-radius: 50%;
}

.remove-icon-btn:hover {
  color: #dc3545;
  background: #fff1f2;
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
  color: #2f4858;
  font-size: 0.82rem;
  font-weight: 700;
}

.day-limit-hint {
  display: block;
  margin-top: 4px;
  color: #7c6f63;
  font-size: 0.72rem;
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
  background: rgba(24,151,160,0.08);
  color: #94a3b8;
  display: grid;
  place-items: center;
  cursor: grab;
}

.timeline-drag-handle:hover {
  background: rgba(24,151,160,0.16);
  color: #1897a0;
}

.timeline-drag-handle:active {
  cursor: grabbing;
}

.timeline-chosen {
  border-color: #1897a0 !important;
  background: #deefec !important;
}

.timeline-active {
  opacity: 0.8;
  transform: rotate(0.5deg);
}

.timeline-ghost {
  opacity: 0.35;
  border: 2px dashed #1897a0 !important;
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

:global(body.dark-mode) .section-title {
  color: #f8fafc;
}

:global(body.dark-mode) .paper-entry {
  background: #253244;
  border-color: rgba(255,255,255,0.12);
}

:global(body.dark-mode) .remove-icon-btn {
  background: #2d3748;
  border-color: rgba(255,255,255,0.1);
  color: #cbd5e1;
}

:global(body.dark-mode) .entry-note-label {
  color: #cbd5e1;
}

:global(body.dark-mode) .form-label {
  color: #f8fafc;
}
</style>
