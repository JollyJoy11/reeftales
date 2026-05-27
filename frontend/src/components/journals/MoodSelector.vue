<script setup>
defineProps({
  modelValue: {
    type: String,
    default: 'joyful'
  }
})

const emit = defineEmits(['update:modelValue'])

const moodOptions = [
  {
    value: 'joyful',
    label: 'Joyful',
    color: '#d96c82',
    tilt: '-2deg',
    closedFace: `<svg viewBox="0 0 48 48"><path d="M14 21q4 4 8 0M26 21q4 4 8 0M16 30q8 7 16 0"/></svg>`,
    openFace: `<svg viewBox="0 0 48 48"><circle cx="17" cy="19" r="2"/><circle cx="31" cy="19" r="2"/><path d="M16 30q8 8 16 0"/></svg>`
  },
  {
    value: 'relaxed',
    label: 'Relaxed',
    color: '#2a9d8f',
    tilt: '2deg',
    closedFace: `<svg viewBox="0 0 48 48"><path d="M14 22h8M26 22h8M17 31h14"/></svg>`,
    openFace: `<svg viewBox="0 0 48 48"><path d="M15 21q3-3 6 0M27 21q3-3 6 0M17 31h14"/></svg>`
  },
  {
    value: 'amazed',
    label: 'Amazed',
    color: '#c9912e',
    tilt: '-1deg',

    closedFace: `<svg viewBox="0 0 48 48"><path d="M15 21q3 3 6 0"/><path d="M27 21q3 3 6 0"/><ellipse cx="24" cy="31" rx="4.8" ry="5.8"/></svg>`,
    openFace: `<svg viewBox="0 0 48 48"><circle cx="17" cy="19" r="2"/><circle cx="31" cy="19" r="2"/><ellipse cx="24" cy="31" rx="5.2" ry="6.8"/></svg>`
  },
  {
    value: 'adventurous',
    label: 'Adventurous',
    color: '#7c68b5',
    tilt: '2.5deg',
    closedFace: `<svg viewBox="0 0 48 48"><path d="M15 18l6 4M33 18l-6 4M17 31q7-3 14 0"/></svg>`,
    openFace: `<svg viewBox="0 0 48 48"><path d="M15 18l6 4M33 18l-6 4"/><circle cx="19" cy="23" r="2.5"/><circle cx="29" cy="23" r="2.5"/><path d="M17 31q7-4 14 0"/></svg>`
  },
  {
    value: 'peaceful',
    label: 'Peaceful',
    color: '#5fa87f',
    tilt: '-2deg',
    closedFace: `<svg viewBox="0 0 48 48"><path d="M14 22q4 4 8 0M26 22q4 4 8 0M18 31q6 3 12 0"/></svg>`,
    openFace: `<svg viewBox="0 0 48 48"><ellipse cx="18" cy="21" rx="3" ry="2"/><ellipse cx="30" cy="21" rx="3" ry="2"/><path d="M18 31q6 3 12 0"/></svg>`
  },
  {
    value: 'tired',
    label: 'Tired',
    color: '#7f929c',
    tilt: '1.5deg',
    closedFace: `<svg viewBox="0 0 48 48"><path d="M14 22h8M26 22h8M18 32h12"/></svg>`,
    openFace: `<svg viewBox="0 0 48 48"><path d="M15 21h7M26 21h7"/><circle cx="18" cy="23" r="1.6"/><circle cx="30" cy="23" r="1.6"/><path d="M18 32h12"/></svg>`
  }
]
</script>

<template>
  <div class="mood-journal-section">
    <label class="form-label fw-bold">
      Set the vibe for this voyage
    </label>

    <div class="mood-stamps-container">
      <button
        v-for="mood in moodOptions"
        :key="mood.value"
        type="button"
        class="mood-stamp-card"
        :class="{ active: modelValue === mood.value }"
        :style="{
          '--mood-color': mood.color,
          '--selected-tilt': mood.tilt
        }"
        @click="emit('update:modelValue', mood.value)"
      >
        <div
          class="stamp-seal"
        >
          <div
            class="face-svg"
            v-html="modelValue === mood.value ? mood.openFace : mood.closedFace"
          ></div>
        </div>

        <span class="mood-title-label">
          {{ mood.label }}
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.mood-journal-section {
  margin: 24px 0;
}

.mood-stamps-container {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 14px;
}

.mood-stamp-card {
  --selected-tilt: 0deg;
  min-height: 118px;
  border: 1px dashed #c4a484;
  border-radius: 16px;
  background:
    linear-gradient(180deg, rgba(255,255,255,0.5), rgba(251,249,241,0.8)),
    #fffdf8;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 12px 8px;
  cursor: pointer;
  transition: 0.22s ease;
}

.stamp-seal {
  width: 58px;
  height: 58px;
  border: 2px solid var(--mood-color);
  border-radius: 50%;
  color: var(--mood-color);
  background:
    radial-gradient(circle, rgba(255,255,255,0.82) 0 46%, transparent 47%),
    color-mix(in srgb, var(--mood-color) 12%, #fffdf8);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.22s ease;
  box-shadow: inset 0 0 0 4px rgba(255,255,255,0.58);
}

.face-svg {
  width: 30px;
  height: 30px;
}

.face-svg :deep(svg) {
  width: 100%;
  height: 100%;
  fill: none;
  stroke: currentColor;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.mood-title-label {
  font-size: 0.82rem;
  font-weight: 700;
  color: #6f6257;
}

.mood-stamp-card:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--mood-color) 55%, #c4a484);
}

.mood-stamp-card.active {
  transform: scale(1.08) rotate(var(--selected-tilt));
  border-color: var(--mood-color);
  background:
    linear-gradient(180deg, rgba(255,255,255,0.74), rgba(251,249,241,0.92)),
    color-mix(in srgb, var(--mood-color) 8%, #fffdf8);
  box-shadow:
    0 10px 22px rgba(0,0,0,0.08),
    0 0 0 4px color-mix(in srgb, var(--mood-color) 16%, transparent);
}

.mood-stamp-card.active .stamp-seal {
  background:
    radial-gradient(circle, rgba(255,253,248,0.92) 0 46%, transparent 47%),
    color-mix(in srgb, var(--mood-color) 18%, #fffdf8);
  box-shadow:
    inset 0 0 0 4px rgba(255,255,255,0.68),
    0 0 0 5px color-mix(in srgb, var(--mood-color) 12%, transparent),
    0 0 16px color-mix(in srgb, var(--mood-color) 28%, transparent);
}

.mood-stamp-card.active .face-svg {
  animation: wake-face 0.22s ease;
}

.mood-stamp-card.active .mood-title-label {
  color: var(--mood-color);
  text-shadow: none;
}

.mood-stamp-card:hover .stamp-seal {
  transform: translateY(-1px);
}

@keyframes wake-face {
  from {
    transform: scaleY(0.35);
    opacity: 0.55;
  }

  to {
    transform: scaleY(1);
    opacity: 1;
  }
}

@media (max-width: 992px) {
  .mood-stamps-container {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 576px) {
  .mood-stamps-container {
    grid-template-columns: repeat(2, 1fr);
  }

  .mood-stamp-card {
    min-height: 108px;
  }

  .stamp-seal {
    width: 52px;
    height: 52px;
  }
}
</style>
