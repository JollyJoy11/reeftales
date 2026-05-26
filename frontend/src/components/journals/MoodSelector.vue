<script setup>
import {
  Waves,
  Sparkles,
  Compass,
  Fish,
  Moon,
  TreePalm
} from 'lucide-vue-next'

const iconMap = {
  waves: Waves,
  sparkles: Sparkles,
  compass: Compass,
  palmtree: TreePalm,
  fish: Fish,
  moon: Moon
}

defineProps({
  modelValue: {
    type: String,
    default: 'relaxed'
  }
})

const emit = defineEmits(['update:modelValue'])

const moodOptions = [
  { value: 'peaceful', icon: 'waves', label: 'Peaceful' },
  { value: 'excited', icon: 'sparkles', label: 'Excited' },
  { value: 'adventurous', icon: 'compass', label: 'Adventurous' },
  { value: 'relaxed', icon: 'palmtree', label: 'Relaxed' },
  { value: 'amazed', icon: 'fish', label: 'Amazed' },
  { value: 'tired', icon: 'moon', label: 'Tired' }
]
</script>

<template>
  <div>
    <label class="form-label fw-bold">What was your trip vibe?</label>

    <div class="emoji-mood-grid">
      <button
        v-for="mood in moodOptions"
        :key="mood.value"
        type="button"
        class="emoji-mood-btn"
        :class="{ selected: modelValue === mood.value }"
        @click="emit('update:modelValue', mood.value)"
      >
        <component
          :is="iconMap[mood.icon]"
          class="mood-icon"
        />
        <span>{{ mood.label }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.mood-icon {
  width: 28px;
  height: 28px;
  stroke-width: 2;
}

.emoji-mood-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}

.emoji-mood-btn {
  border: 1px solid #eadfca;
  background: #fbf9f1;
  border-radius: 18px;
  padding: 14px;
  display: grid;
  gap: 4px;
  place-items: center;
  color: #2f4858;
}

.emoji-mood-btn.selected,
.emoji-mood-btn:hover {
  border-color: #1897a0;
  background: #deefec;
}

.emoji-mood-btn.selected .mood-icon {
  color: #1897a0;
}

@media (max-width: 768px) {
  .emoji-mood-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>