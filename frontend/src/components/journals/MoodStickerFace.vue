<script setup>
import { computed } from 'vue'

const props = defineProps({
  mood: {
    type: String,
    default: 'joyful'
  },
  faceSvg: {
    type: String,
    default: ''
  }
})

const moodFaces = {
  joyful: `<svg viewBox="0 0 48 48"><circle cx="17" cy="19" r="2"/><circle cx="31" cy="19" r="2"/><path d="M16 30q8 8 16 0"/></svg>`,
  relaxed: `<svg viewBox="0 0 48 48"><path d="M15 21q3-3 6 0M27 21q3-3 6 0M17 31h14"/></svg>`,
  amazed: `<svg viewBox="0 0 48 48"><circle cx="17" cy="19" r="2"/><circle cx="31" cy="19" r="2"/><ellipse cx="24" cy="31" rx="5.2" ry="6.8"/></svg>`,
  adventurous: `<svg viewBox="0 0 48 48"><path d="M15 18l6 4M33 18l-6 4"/><circle cx="19" cy="23" r="2.5"/><circle cx="29" cy="23" r="2.5"/><path d="M17 31q7-4 14 0"/></svg>`,
  peaceful: `<svg viewBox="0 0 48 48"><ellipse cx="18" cy="21" rx="3" ry="2"/><ellipse cx="30" cy="21" rx="3" ry="2"/><path d="M18 31q6 3 12 0"/></svg>`,
  tired: `<svg viewBox="0 0 48 48"><path d="M15 21h7M26 21h7"/><circle cx="18" cy="23" r="1.6"/><circle cx="30" cy="23" r="1.6"/><path d="M18 32h12"/></svg>`,
  excited: `<svg viewBox="0 0 48 48"><circle cx="17" cy="19" r="2"/><circle cx="31" cy="19" r="2"/><path d="M16 30q8 8 16 0"/></svg>`
}

const svg = computed(() => props.faceSvg || moodFaces[props.mood] || moodFaces.joyful)
</script>

<template>
  <div class="mood-sticker-face" v-html="svg"></div>
</template>

<style scoped>
.mood-sticker-face {
  width: 30px;
  height: 30px;
}

.mood-sticker-face :deep(svg) {
  width: 100%;
  height: 100%;
  fill: none;
  stroke: currentColor;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
