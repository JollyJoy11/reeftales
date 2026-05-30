<script setup>
const props = defineProps({
  modelValue: {
    type: Array,
    required: true
  },
  speciesList: {
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
      species_id: '',
      custom_species_name: '',
      quantity: 1,
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
    <h5 class="section-title">Marine Sightings</h5>

    <div
      v-for="(sighting, index) in modelValue"
      :key="index"
      class="paper-entry"
    >
      <button
        v-if="modelValue.length > 1"
        type="button"
        class="remove-icon-btn"
        @click="removeEntry(index)"
      >
        <i class="bi bi-trash3-fill"></i>
      </button>

      <div class="paper-entry-header">
        <span class="encounter-label">
          <i class="bi bi-stars"></i>
          Encounter #{{ index + 1 }}
        </span>
      </div>

      <div class="sighting-fields">
        <div class="field-medium">
          <label class="form-label">Species</label>
          <select
            :value="sighting.species_id"
            class="form-select"
            @change="updateItem(index, 'species_id', $event.target.value)"
          >
            <option value="">Choose existing species</option>
            <option
              v-for="species in speciesList"
              :key="species.id"
              :value="species.id"
            >
              {{ species.name }}
            </option>
          </select>
        </div>

        <div class="field-small">
          <label class="form-label">Quantity</label>
          <input
            :value="sighting.quantity"
            type="number"
            min="1"
            class="form-control"
            @input="updateItem(index, 'quantity', $event.target.value)"
          />
        </div>

        <div class="field-medium">
          <label class="form-label">Custom species</label>
          <input
            :value="sighting.custom_species_name"
            type="text"
            class="form-control"
            placeholder="e.g. Dolphin pod"
            @input="updateItem(index, 'custom_species_name', $event.target.value)"
          />
        </div>

        <div class="field-full">
          <label class="form-label">Notes</label>
          <textarea
            :value="sighting.notes"
            rows="2"
            class="form-control"
            placeholder="Notes about the sighting..."
            @input="updateItem(index, 'notes', $event.target.value)"
          ></textarea>
        </div>
      </div>
    </div>

    <button type="button" class="btn btn-outline-primary" @click="addEntry">
      <i class="bi bi-plus-circle"></i>
      Add Sighting
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
  padding: 20px;
  margin-bottom: 18px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.04);
}

.paper-entry-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
}

.encounter-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #1897a0;
  font-family: 'Spectral', serif;
  font-size: 1rem;
  font-style: italic;
  font-weight: 800;
}

.encounter-label i {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(24,151,160,0.12);
  display: grid;
  place-items: center;
  font-size: 0.9rem;
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

.sighting-fields {
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

@media (max-width: 768px) {
  .sighting-fields {
    grid-template-columns: 1fr;
  }

  .field-small,
  .field-medium,
  .field-full {
    grid-column: 1;
    max-width: none;
  }
}
</style>
