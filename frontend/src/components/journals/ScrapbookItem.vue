<script setup>
import { computed } from 'vue'

import ScrapbookItemToolbar from './ScrapbookItemToolbar.vue'
import ScrapbookPolaroid from './ScrapbookPolaroid.vue'
import ScrapbookSticker from './ScrapbookSticker.vue'
import ScrapbookTextNote from './ScrapbookTextNote.vue'

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  editable: {
    type: Boolean,
    default: false
  },
  positioned: {
    type: Boolean,
    default: true
  },
  selected: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'select',
  'remove',
  'rotate',
  'change-tape',
  'toggle-attachment',
  'change-text-color',
  'change-sticker-shape',
  'bring-front',
  'send-back',
  'update-text'
])

const itemStyle = computed(() => {
  const style = {
    '--item-rotation': `${props.item.rotation || 0}deg`,
    '--tape-color': props.item.tapeColor || '#a9d8d6',
    '--sticker-color': props.item.stickerColor || '#1897a0'
  }

  if (props.positioned) {
    style.left = `${(props.item.xPct ?? 0) * 100}%`
    style.top = `${(props.item.yPct ?? 0) * 100}%`
    style.width = `${(props.item.wPct ?? 0.24) * 100}%`
    style.height = `${(props.item.hPct ?? 0.18) * 100}%`
    style.zIndex = props.item.zIndex ?? 1
  }

  return style
})
</script>

<template>
  <div
    class="scrapbook-item"
    :class="{ positioned }"
    :style="itemStyle"
  >
    <div
      class="scrapbook-item-card"
      tabindex="0"
      :class="[
        `type-${item.type}`,
        `attachment-${item.attachment || 'none'}`,
        `tape-${item.tapePlacement || 'top-center'}`,
        { selected }
      ]"
      @focusin="emit('select')"
      @pointerdown="emit('select')"
    >
      <button
        v-if="editable"
        type="button"
        class="remove-layout-item"
        title="Remove from board"
        @click.stop="emit('remove')"
      >
        <i class="bi bi-x"></i>
      </button>

      <ScrapbookItemToolbar
        v-if="editable"
        :item="item"
        :visible="selected"
        @rotate="emit('rotate', $event)"
        @change-tape="emit('change-tape')"
        @toggle-attachment="emit('toggle-attachment')"
        @change-text-color="emit('change-text-color')"
        @change-sticker-shape="emit('change-sticker-shape')"
        @bring-front="emit('bring-front')"
        @send-back="emit('send-back')"
      />

      <ScrapbookPolaroid
        v-if="item.type === 'media'"
        :item="item"
      />

      <ScrapbookTextNote
        v-else-if="item.type === 'text'"
        :item="item"
        :editable="editable"
        @update:text="emit('update-text', $event)"
      />

      <ScrapbookSticker
        v-else-if="item.type === 'sticker' || item.type === 'mood'"
        :item="item"
      />
    </div>
  </div>
</template>

<style scoped>
.scrapbook-item {
  width: 100%;
  height: 100%;
}

.scrapbook-item.positioned {
  position: absolute;
}

.scrapbook-item-card {
  position: relative;
  width: 100%;
  height: 100%;
  background: var(--surface);
  box-shadow: 0 10px 22px rgba(0,0,0,0.14);
  transform: rotate(var(--item-rotation));
  transform-origin: center;
  outline: none;
  transition:
    box-shadow 0.16s ease,
    filter 0.16s ease,
    transform 0.22s ease;
}

.scrapbook-item-card.type-media {
  padding: 12px 12px 48px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.12);
  border: 1px solid rgba(234,223,202,0.72);
}

.scrapbook-item-card.type-text {
  border: 1px dashed #d7be8c;
  box-shadow: 0 8px 18px rgba(0,0,0,0.1);
}

.scrapbook-item-card.type-sticker,
.scrapbook-item-card.type-mood {
  background: transparent;
  border: none;
  box-shadow: none;
}

.scrapbook-item-card.selected {
  transform:
    rotate(calc(var(--item-rotation) + 4deg))
    translateY(-5px)
    scale(1.05);

  box-shadow:
    0 18px 30px rgba(0,0,0,0.18),
    0 0 0 4px rgba(24,151,160,0.16),
    0 0 30px rgba(24,151,160,0.34),
    0 0 54px rgba(24,151,160,0.18);

  filter: saturate(1.08);
  z-index: 999 !important;
}

.scrapbook-item-card.type-media.selected {
  border-color: rgba(24,151,160,0.52);
}

.remove-layout-item {
  position: absolute;
  top: -14px;
  right: -14px;
  z-index: 3;
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 50%;
  background: var(--surface-soft);
  color: #dc3545;
  display: grid;
  place-items: center;
}
</style>
