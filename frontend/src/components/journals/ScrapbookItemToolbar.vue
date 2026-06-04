<script setup>
defineProps({
  item: {
    type: Object,
    required: true
  },
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'rotate',
  'change-tape',
  'toggle-attachment',
  'change-text-color',
  'change-sticker-shape',
  'bring-front',
  'send-back'
])
</script>

<template>
  <div class="scrapbook-item-tools" :class="{ visible }">
    <button type="button" title="Tilt left" @click.stop="emit('rotate', -2)">
      <i class="bi bi-arrow-counterclockwise"></i>
    </button>
    <button type="button" title="Tilt right" @click.stop="emit('rotate', 2)">
      <i class="bi bi-arrow-clockwise"></i>
    </button>
    <button
      v-if="item.type === 'media'"
      type="button"
      title="Change tape colour"
      @click.stop="emit('change-tape')"
    >
      Colour
    </button>
    <button
      v-if="item.type === 'media'"
      type="button"
      title="Switch tape or clip"
      @click.stop="emit('toggle-attachment')"
    >
      {{ item.attachment === 'clip' ? 'Use tape' : 'Use clip' }}
    </button>
    <button
      v-if="item.type === 'text'"
      type="button"
      title="Change note colour"
      @click.stop="emit('change-text-color')"
    >
      Colour
    </button>
    <button
      v-if="item.type === 'sticker' || item.type === 'mood'"
      type="button"
      title="Change sticker shape"
      @click.stop="emit('change-sticker-shape')"
    >
      Shape
    </button>
    <button type="button" title="Bring front" @click.stop="emit('bring-front')">
      Front
    </button>
    <button type="button" title="Send back" @click.stop="emit('send-back')">
      Back
    </button>
  </div>
</template>

<style scoped>
.scrapbook-item-tools {
  position: absolute;
  left: 50%;
  bottom: -72px;
  z-index: 8;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px;
  width: 230px;
  opacity: 0;
  pointer-events: none;
  transform: translateX(-50%);
  transition: opacity 0.16s ease;
}

:global(.scrapbook-item-card:hover) .scrapbook-item-tools,
:global(.scrapbook-item-card:focus-within) .scrapbook-item-tools,
.scrapbook-item-tools.visible {
  opacity: 1;
  pointer-events: auto;
}

.scrapbook-item-tools button {
  border: 1px solid #eadfca;
  border-radius: 999px;
  background: var(--surface);
  color: #1f4e5f;
  min-width: 28px;
  height: 26px;
  padding: 0 8px;
  font-size: 0.68rem;
  font-weight: 800;
  box-shadow: 0 6px 12px rgba(0,0,0,0.1);
}

@media (max-width: 768px) {
  .scrapbook-item-tools {
    bottom: -96px;
    width: 180px;
  }
}
</style>
