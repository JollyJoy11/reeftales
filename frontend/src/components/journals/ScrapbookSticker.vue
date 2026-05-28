<script setup>
import MoodStickerFace from './MoodStickerFace.vue'

defineProps({
  item: {
    type: Object,
    required: true
  }
})
</script>

<template>
  <div class="scrapbook-sticker" :class="`shape-${item.stickerShape || 'stamp'}`">
    <MoodStickerFace
      v-if="item.type === 'mood'"
      :mood="item.mood"
      :face-svg="item.faceSvg"
    />
    <span>{{ item.stickerText }}</span>
    <small v-if="item.type === 'mood'">MOOD</small>
  </div>
</template>

<style scoped>
.scrapbook-sticker {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 3px;
  color: var(--sticker-color);
  background: color-mix(in srgb, var(--sticker-color) 9%, #fffdf8);
  border: 2px solid var(--sticker-color);
  border-radius: 12px;
  font-size: 0.82rem;
  font-weight: 900;
  text-align: center;
  letter-spacing: 0.08em;
  box-shadow: 0 8px 18px rgba(0,0,0,0.1);
}

.scrapbook-sticker.shape-circle {
  border-radius: 50%;
}

.scrapbook-sticker.shape-ticket {
  border-radius: 18px 6px 18px 6px;
}

.scrapbook-sticker.shape-stamp {
  border-radius: 12px;
}

.scrapbook-sticker span {
  border-top: 1px solid currentColor;
  border-bottom: 1px solid currentColor;
  padding: 2px 4px;
}

.scrapbook-sticker small {
  font-size: 0.58rem;
  letter-spacing: 0.12em;
}
</style>
