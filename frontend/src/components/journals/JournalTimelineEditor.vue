<script setup>
import AppTimePicker from '@/components/common/AppTimePicker.vue'

const props = defineProps({
  modelValue: {
    type: Array,
    required: true
  },
  activities: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

function updateItem(index, key, value) {
  const updated = [...props.modelValue]
  updated[index] = { ...updated[index], [key]: value }
  emit('update:modelValue', updated)
}

function addEntry() {
  emit('update:modelValue', [
    ...props.modelValue,
    {
      day_number: 1,
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
</script>

<template>
  <div>
    <h5 class="fw-bold mb-3">Trip Timeline</h5>

    <div v-for="(entry, index) in modelValue" :key="index" class="timeline-entry">
      <div class="row g-2">
        <div class="col-6 col-md-2">
          <label class="form-label">Day</label>
          <input :value="entry.day_number" type="number" min="1" class="form-control" @input="updateItem(index, 'day_number', $event.target.value)" />
        </div>

        <div class="col-6 col-md-3">
          <label class="form-label">Time</label>
          <AppTimePicker
            :model-value="entry.activity_time"
            @update:model-value="updateItem(index, 'activity_time', $event)"
            />
        </div>

        <div class="col-12 col-md-7">
          <label class="form-label">Activity</label>
          <select :value="entry.activity_id" class="form-select" @change="updateItem(index, 'activity_id', $event.target.value)">
            <option value="">Choose existing activity</option>
            <option v-for="activity in activities" :key="activity.id" :value="activity.id">
              {{ activity.name }}
            </option>
          </select>
        </div>

        <div class="col-12">
          <input :value="entry.custom_activity_name" type="text" class="form-control" placeholder="Or type custom activity, e.g. Night diving" @input="updateItem(index, 'custom_activity_name', $event.target.value)" />
        </div>

        <div class="col-12">
          <textarea :value="entry.notes" rows="2" class="form-control" placeholder="Notes about this activity..." @input="updateItem(index, 'notes', $event.target.value)"></textarea>
        </div>
      </div>

      <button v-if="modelValue.length > 1" type="button" class="mini-remove-btn" @click="removeEntry(index)">
        <i class="bi bi-dash-circle"></i> Remove activity
      </button>
    </div>

    <button type="button" class="btn btn-outline-primary" @click="addEntry">
      <i class="bi bi-plus-circle"></i>
      Add Activity
    </button>
  </div>
</template>

<style scoped>
.timeline-entry {
  background: #fbf9f1;
  border: 1px solid #eadfca;
  border-radius: 18px;
  padding: 16px;
  margin-bottom: 14px;
}

.mini-remove-btn {
  margin-top: 10px;
  border: none;
  background: transparent;
  color: #dc3545;
  font-size: 0.85rem;
}
</style>