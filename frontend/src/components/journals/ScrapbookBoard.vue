<script setup>
import { ref } from 'vue'

import ScrapbookItem from './ScrapbookItem.vue'

defineProps({
  items: {
    type: Array,
    default: () => []
  },
  activeMediaId: {
    type: [String, Number],
    default: null
  },
  emptyMessage: {
    type: String,
    default: 'Your arranged memories will appear here.'
  }
})

const rootEl = ref(null)
const emit = defineEmits(['media-select', 'blank-select'])

defineExpose({ rootEl })
</script>

<template>
  <div
    ref="rootEl"
    class="scrapbook-board"
    :class="{ empty: !items.length }"
    @pointerdown.self="emit('blank-select')"
  >
    <div v-if="!items.length" class="scrapbook-empty-state">
      <slot name="empty">
        <i class="bi bi-layout-wtf"></i>
        <span>{{ emptyMessage }}</span>
      </slot>
    </div>

    <slot>
      <ScrapbookItem
        v-for="item in items"
        :key="item.id"
        :item="item"
        :selected="
          activeMediaId &&
          item.type === 'media' &&
          String(item.mediaId) === String(activeMediaId)
        "
        @select="item.type === 'media' && item.mediaId && emit('media-select', item.mediaId)"
      />
    </slot>
  </div>
</template>

<style scoped>
.scrapbook-board {
  position: relative;
  width: 100%;
  max-width: 620px;
  justify-self: center;
  aspect-ratio: 4 / 5;
  min-height: 0;
  border: 1px dashed #c4a484;
  border-radius: 22px;
  background:
    linear-gradient(rgba(196,164,132,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(196,164,132,0.04) 1px, transparent 1px),
    linear-gradient(180deg, #fdfbf5 0%, #fbf7ef 100%);
  background-size: 32px 32px;
  overflow: visible;
  box-shadow: inset 0 0 30px rgba(196,164,132,0.08);
}

.scrapbook-board.empty {
  display: grid;
  place-items: center;
}

.scrapbook-empty-state {
  color: #94a3b8;
  display: grid;
  place-items: center;
  gap: 8px;
  font-weight: 800;
  text-align: center;
}

.scrapbook-empty-state i {
  font-size: 2rem;
  color: var(--accent);
}

@media (max-width: 768px) {
  .scrapbook-board {
    width: 100%;
    max-width: 430px;
    aspect-ratio: 4 / 5.3;
  }
}
</style>

