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
    <h5 class="fw-bold mb-3">Marine Sightings</h5>

    <div v-for="(sighting, index) in modelValue" :key="index" class="sighting-entry">
      <div class="row g-2">
        <div class="col-12 col-md-7">
          <label class="form-label">Species</label>
          <select :value="sighting.species_id" class="form-select" @change="updateItem(index, 'species_id', $event.target.value)">
            <option value="">Choose existing species</option>
            <option v-for="species in speciesList" :key="species.id" :value="species.id">
              {{ species.name }}
            </option>
          </select>
        </div>

        <div class="col-12 col-md-5">
          <label class="form-label">Quantity</label>
          <input :value="sighting.quantity" type="number" min="1" class="form-control" @input="updateItem(index, 'quantity', $event.target.value)" />
        </div>

        <div class="col-12">
          <input :value="sighting.custom_species_name" type="text" class="form-control" placeholder="Or type custom species, e.g. Dolphin pod" @input="updateItem(index, 'custom_species_name', $event.target.value)" />
        </div>

        <div class="col-12">
          <textarea :value="sighting.notes" rows="2" class="form-control" placeholder="Notes about the sighting..." @input="updateItem(index, 'notes', $event.target.value)"></textarea>
        </div>
      </div>

      <button v-if="modelValue.length > 1" type="button" class="mini-remove-btn" @click="removeEntry(index)">
        Remove sighting
      </button>
    </div>

    <button type="button" class="btn btn-outline-primary" @click="addEntry">
      <i class="bi bi-plus-circle"></i>
      Add Sighting
    </button>
  </div>
</template>

<style scoped>
.sighting-entry {
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