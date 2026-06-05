<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import VueDraggableResizable from 'vue-draggable-resizable'

import ScrapbookBoard from './ScrapbookBoard.vue'
import ScrapbookItem from './ScrapbookItem.vue'

const props = defineProps({
  media: {
    type: Array,
    default: () => []
  },
  layoutItems: {
    type: Array,
    default: () => []
  },
  mood: {
    type: String,
    default: 'joyful'
  }
})

const emit = defineEmits(['update:layoutItems'])

const stickerOptions = [
  { label: 'Visited', text: 'VISITED', color: '#1897a0' },
  { label: 'Found', text: 'FOUND', color: '#5fa87f' },
  { label: 'Favorite', text: 'FAVE', color: '#d96c82' },
  { label: 'Dived', text: 'DIVE', color: '#2f4858' },
  { label: 'Wow', text: 'WOW', color: '#c9912e' }
]

const moodStickers = {
  joyful: { label: 'Joyful', color: '#d96c82' },
  relaxed: { label: 'Relaxed', color: '#2a9d8f' },
  amazed: { label: 'Amazed', color: '#c9912e' },
  adventurous: { label: 'Adventure', color: '#7c68b5' },
  peaceful: { label: 'Peaceful', color: '#5fa87f' },
  tired: { label: 'Tired', color: '#7f929c' }
}

const tapeColors = ['#a9d8d6', '#f3c3c7', '#f5df9a', '#b9d7a8', '#c9bfdf']
const tapePlacements = ['top-center', 'top-left', 'top-right']
const textColors = ['#fff8d9', '#deefec', '#f9d7dc', '#e5ddf3', '#f6f3eb']
const stickerShapes = ['stamp', 'circle', 'ticket']
const boardRef = ref(null)
const selectedItemId = ref('')
const isMobileCanvas = ref(false)
const canvasSize = ref({ width: 620, height: 775 })
let mobileMediaQuery
let resizeObserver

const activeMoodSticker = computed(() => {
  return moodStickers[props.mood] || moodStickers.joyful
})

const usedMediaIds = computed(() => {
  return props.layoutItems.map(item => item.mediaId)
})

const unusedMedia = computed(() => {
  return props.media.filter(item => !usedMediaIds.value.includes(item.id))
})

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function itemRatio(item, ratioKey, pxKey, baseValue) {
  if (typeof item[ratioKey] === 'number') return item[ratioKey]
  return (item[pxKey] || baseValue) / baseValue
}

function itemWidth(item) {
  const width = itemRatio(item, 'wPct', 'width', 620) * canvasSize.value.width
  return clamp(width, 56, canvasSize.value.width)
}

function itemHeight(item) {
  if (item.type === 'media') {
    return mediaHeightFromWidth(item, itemWidth(item))
  }

  const height = itemRatio(item, 'hPct', 'height', 775) * canvasSize.value.height
  return clamp(height, 48, canvasSize.value.height)
}

function mediaHeightFromWidth(item, width) {
  const horizontalFrame = 24
  const verticalFrame = item.caption ? 70 : 46
  return clamp((width - horizontalFrame) / (item.aspectRatio || 1.32) + verticalFrame, 90, canvasSize.value.height)
}

function resizableRatio(item) {
  return item.type === 'media' ? itemWidth(item) / itemHeight(item) : false
}

function itemX(item) {
  const width = itemWidth(item)
  const x = itemRatio(item, 'xPct', 'x', 620) * canvasSize.value.width
  return clamp(x, 0, Math.max(0, canvasSize.value.width - width))
}

function itemY(item) {
  const height = itemHeight(item)
  const y = itemRatio(item, 'yPct', 'y', 775) * canvasSize.value.height
  return clamp(y, 0, Math.max(0, canvasSize.value.height - height))
}

function responsivePatch(x, y, width, height) {
  return {
    x,
    y,
    width,
    height,
    xPct: x / canvasSize.value.width,
    yPct: y / canvasSize.value.height,
    wPct: width / canvasSize.value.width,
    hPct: height / canvasSize.value.height
  }
}

function responsiveResizePatch(item, x, y, width, height) {
  return responsivePatch(
    x,
    y,
    width,
    item.type === 'media' ? mediaHeightFromWidth(item, width) : height
  )
}

function mediaLayoutItem(mediaItem, index = props.layoutItems.length) {
  const aspectRatio = mediaItem.aspectRatio || 1.32
  const wPct = 0.32
  const baseWidth = 620 * wPct
  const baseHeight = (baseWidth - 24) / aspectRatio + (mediaItem.caption ? 70 : 46)

  return {
    id: crypto.randomUUID(),
    type: 'media',
    mediaId: mediaItem.id,
    previewUrl: mediaItem.coverDataUrl || mediaItem.previewUrl,
    mediaUrl: mediaItem.dataUrl || mediaItem.previewUrl,
    mediaType: mediaItem.media_type,
    caption: mediaItem.caption,
    aspectRatio,
    rotation: index % 2 === 0 ? -3 : 3,
    tapeColor: tapeColors[index % tapeColors.length],
    tapePlacement: tapePlacements[index % tapePlacements.length],
    attachment: index % 4 === 0 ? 'clip' : 'tape',
    zIndex: props.layoutItems.length + 1,
    xPct: 0.08 + (index % 3) * 0.07,
    yPct: 0.07 + (index % 3) * 0.05,
    wPct,
    hPct: baseHeight / 775,
    x: 40 + (index % 3) * 34,
    y: 40 + (index % 3) * 28,
    width: baseWidth,
    height: baseHeight
  }
}

function addPhoto(mediaItem) {
  emit('update:layoutItems', [...props.layoutItems, mediaLayoutItem(mediaItem)])
}

function addTextBox() {
  emit('update:layoutItems', [
    ...props.layoutItems,
    {
      id: crypto.randomUUID(),
      type: 'text',
      text: 'Write a small memory...',
      textColor: textColors[0],
      rotation: -2,
      zIndex: props.layoutItems.length + 1,
      xPct: 0.1,
      yPct: 0.1,
      wPct: 0.36,
      hPct: 0.14,
      x: 60,
      y: 70,
      width: 220,
      height: 90
    }
  ])
}

function addSticker(sticker) {
  emit('update:layoutItems', [
    ...props.layoutItems,
    {
      id: crypto.randomUUID(),
      type: 'sticker',
      stickerLabel: sticker.label,
      stickerText: sticker.text,
      stickerColor: sticker.color,
      stickerShape: 'stamp',
      rotation: props.layoutItems.length % 2 === 0 ? -5 : 4,
      zIndex: props.layoutItems.length + 1,
      xPct: 0.14 + (props.layoutItems.length % 4) * 0.04,
      yPct: 0.12 + (props.layoutItems.length % 4) * 0.04,
      wPct: 0.15,
      hPct: 0.1,
      x: 80 + (props.layoutItems.length % 4) * 24,
      y: 80 + (props.layoutItems.length % 4) * 22,
      width: 92,
      height: 68
    }
  ])
}

function addMoodSticker() {
  emit('update:layoutItems', [
    ...props.layoutItems,
    {
      id: crypto.randomUUID(),
      type: 'mood',
      stickerLabel: activeMoodSticker.value.label,
      stickerText: activeMoodSticker.value.label.toUpperCase(),
      stickerColor: activeMoodSticker.value.color,
      mood: props.mood,
      stickerShape: 'ticket',
      rotation: 4,
      zIndex: props.layoutItems.length + 1,
      xPct: 0.16,
      yPct: 0.14,
      wPct: 0.2,
      hPct: 0.12,
      x: 96,
      y: 96,
      width: 120,
      height: 82
    }
  ])
}

function addAllMedia() {
  const nextItems = unusedMedia.value.map((mediaItem, index) => (
    mediaLayoutItem(mediaItem, props.layoutItems.length + index)
  ))

  emit('update:layoutItems', [...props.layoutItems, ...nextItems])
}

function updateLayoutItem(id, patch) {
  emit('update:layoutItems', props.layoutItems.map(item => (
    item.id === id ? { ...item, ...patch } : item
  )))
}

function reorderLayoutItems(targetId, direction) {
  const orderedItems = [...props.layoutItems].sort((a, b) => (
    (a.zIndex ?? 1) - (b.zIndex ?? 1)
  ))
  const targetIndex = orderedItems.findIndex(item => item.id === targetId)
  if (targetIndex < 0) return

  const [targetItem] = orderedItems.splice(targetIndex, 1)

  if (direction === 'front') {
    orderedItems.push(targetItem)
  } else {
    orderedItems.unshift(targetItem)
  }

  emit('update:layoutItems', orderedItems.map((item, index) => ({
    ...item,
    zIndex: index + 1
  })))
}

function removeLayoutItem(id) {
  emit('update:layoutItems', props.layoutItems.filter(item => item.id !== id))
  if (selectedItemId.value === id) selectedItemId.value = ''
}

function clearLayout() {
  emit('update:layoutItems', [])
}

function rotateItem(item, amount) {
  updateLayoutItem(item.id, {
    rotation: Math.max(-12, Math.min(12, (item.rotation || 0) + amount))
  })
}

function changeTape(item) {
  const currentIndex = tapeColors.indexOf(item.tapeColor)
  const nextIndex = currentIndex >= 0 ? currentIndex + 1 : 0

  updateLayoutItem(item.id, {
    tapeColor: tapeColors[nextIndex % tapeColors.length],
    attachment: 'tape'
  })
}

function changeTextColor(item) {
  const currentIndex = textColors.indexOf(item.textColor)
  const nextIndex = currentIndex >= 0 ? currentIndex + 1 : 0

  updateLayoutItem(item.id, {
    textColor: textColors[nextIndex % textColors.length]
  })
}

function changeStickerShape(item) {
  const currentIndex = stickerShapes.indexOf(item.stickerShape)
  const nextIndex = currentIndex >= 0 ? currentIndex + 1 : 0

  updateLayoutItem(item.id, {
    stickerShape: stickerShapes[nextIndex % stickerShapes.length]
  })
}

function toggleAttachment(item) {
  updateLayoutItem(item.id, {
    attachment: item.attachment === 'clip' ? 'tape' : 'clip'
  })
}

function bringFront(item) {
  reorderLayoutItems(item.id, 'front')
}

function sendBack(item) {
  reorderLayoutItems(item.id, 'back')
}

function selectItem(id) {
  selectedItemId.value = id
}

function clearSelectedItem() {
  selectedItemId.value = ''
}

function syncMobileCanvas() {
  isMobileCanvas.value = mobileMediaQuery?.matches || false
}

function syncCanvasSize() {
  const boardElement = boardRef.value?.rootEl?.value || boardRef.value?.rootEl
  if (!boardElement) return

  canvasSize.value = {
    width: boardElement.clientWidth || 620,
    height: boardElement.clientHeight || 775
  }
}

onMounted(async () => {
  mobileMediaQuery = window.matchMedia('(max-width: 768px)')
  syncMobileCanvas()
  mobileMediaQuery.addEventListener('change', syncMobileCanvas)

  await nextTick()
  syncCanvasSize()
  resizeObserver = new ResizeObserver(syncCanvasSize)
  const boardElement = boardRef.value?.rootEl?.value || boardRef.value?.rootEl
  if (boardElement) resizeObserver.observe(boardElement)
})

onBeforeUnmount(() => {
  mobileMediaQuery?.removeEventListener('change', syncMobileCanvas)
  resizeObserver?.disconnect()
})
</script>

<template>
  <div class="scrapbook-editor">
    <div class="scrapbook-heading">
      <div>
        <h5 class="section-title">Arrange Your Memory Board</h5>
        <span class="requirement-badge optional">Optional</span>
        <p>Arrange your memories into a scrapbook board, or continue without one.</p>
      </div>

      <div class="scrapbook-actions">
        <button
          type="button"
          class="btn btn-outline-danger btn-sm"
          :disabled="!layoutItems.length"
          @click="clearLayout"
        >
          <i class="bi bi-eraser"></i>
          Clear board
        </button>
      </div>
    </div>

    <div
      class="arrange-workspace"
      :style="{ '--canvas-height': `${canvasSize.height}px` }"
    >
      <aside class="arrange-sidebar">
        <div class="asset-group">
          <span class="asset-group-title">Add pieces</span>

          <div class="piece-actions">
            <button
              type="button"
              class="piece-action-btn"
              @click="addTextBox"
            >
              <i class="bi bi-fonts"></i>
              Text box
            </button>

            <button
              type="button"
              class="piece-action-btn"
              @click="addMoodSticker"
            >
              <i class="bi bi-postcard-heart"></i>
              Mood sticker
            </button>

            <button
              type="button"
              class="piece-action-btn"
              :disabled="!unusedMedia.length"
              @click="addAllMedia"
            >
              <i class="bi bi-plus-circle"></i>
              Add all media
            </button>
          </div>
        </div>

        <div class="asset-group">
          <span class="asset-group-title">Stamps</span>

          <div class="sticker-tray">
            <button
              v-for="sticker in stickerOptions"
              :key="sticker.label"
              type="button"
              class="sticker-pick"
              :style="{ '--sticker-color': sticker.color }"
              @click="addSticker(sticker)"
            >
              <span class="sticker-preview-text">{{ sticker.text }}</span>
            </button>
          </div>
        </div>

        <div class="asset-group">
          <span class="asset-group-title">Media</span>

          <div v-if="media.length" class="scrapbook-toolbar">
            <button
              v-for="(item, index) in media"
              :key="item.id"
              type="button"
              class="media-pick"
              :class="{ used: usedMediaIds.includes(item.id) }"
              :disabled="usedMediaIds.includes(item.id)"
              @click="addPhoto(item)"
            >
              <img
                :src="item.coverDataUrl || item.previewUrl"
                :alt="item.caption || `${item.media_type === 'video' ? 'Video' : 'Photo'} ${index + 1} available for the memory board`"
              />
              <span>{{ item.media_type === 'video' ? 'Video' : 'Photo' }} {{ index + 1 }}</span>
            </button>
          </div>

          <div v-else class="arrange-empty-source">
            <i class="bi bi-images"></i>
            Add media in the previous step.
          </div>
        </div>
      </aside>

      <section class="canvas-panel">
        <div v-if="isMobileCanvas" class="mobile-canvas-note">
          <i class="bi bi-phone"></i>
          Mobile uses a vertical page. Tap an item to show its tools.
        </div>

        <ScrapbookBoard
          ref="boardRef"
          :items="layoutItems"
          @blank-select="clearSelectedItem"
        >
          <VueDraggableResizable
            v-for="item in layoutItems"
            :key="item.id"
            :x="itemX(item)"
            :y="itemY(item)"
            :w="itemWidth(item)"
            :h="itemHeight(item)"
            :parent="true"
            :lock-aspect-ratio="resizableRatio(item)"
            :style="{ zIndex: item.zIndex ?? 1 }"
            @activated="selectItem(item.id)"
            @dragging="(x, y) => updateLayoutItem(item.id, responsivePatch(x, y, itemWidth(item), itemHeight(item)))"
            @resizing="(x, y, width, height) => updateLayoutItem(item.id, responsiveResizePatch(item, x, y, width, height))"
          >
            <ScrapbookItem
              :item="item"
              :positioned="false"
              :editable="true"
              :selected="selectedItemId === item.id"
              @select="selectItem(item.id)"
              @remove="removeLayoutItem(item.id)"
              @rotate="rotateItem(item, $event)"
              @change-tape="changeTape(item)"
              @toggle-attachment="toggleAttachment(item)"
              @change-text-color="changeTextColor(item)"
              @change-sticker-shape="changeStickerShape(item)"
              @bring-front="bringFront(item)"
              @send-back="sendBack(item)"
              @update-text="updateLayoutItem(item.id, { text: $event })"
            />
          </VueDraggableResizable>
        </ScrapbookBoard>
      </section>
    </div>
  </div>
</template>

<style scoped>
.scrapbook-editor {
  display: grid;
  gap: 16px;
}

.scrapbook-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.section-title {
  display: inline-flex;
  align-items: center;
  margin-right: 8px;
  color: var(--text-primary);
  font-weight: 800;
  margin-bottom: 4px;
}

.requirement-badge {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 0.66rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.requirement-badge.optional {
  background: #eef2f7;
  color: #475569;
  border: 1px solid rgba(71,85,105,0.16);
}

.scrapbook-heading p {
  color: var(--text-secondary);
  margin: 0;
}

.scrapbook-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.scrapbook-toolbar {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.sticker-tray {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(74px, 1fr));
  gap: 8px;
}

.arrange-workspace {
  display: grid;
  grid-template-columns: minmax(300px, 360px) minmax(0, 1fr);
  gap: 20px;
  align-items: stretch;
}

.arrange-sidebar {
  height: var(--canvas-height, auto);
  max-height: none;
  overflow-y: auto;
  display: grid;
  gap: 18px;
  padding: 14px;
  border: 1px dashed #eadfca;
  border-radius: 18px;
  background: var(--surface);
}

.asset-group {
  display: grid;
  gap: 10px;
}

.asset-group-title {
  color: #7c6f63;
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.canvas-panel {
  display: grid;
  justify-items: stretch;
  gap: 10px;
  min-width: 0;
}

.piece-actions {
  display: grid;
  gap: 8px;
}

.piece-action-btn {
  border: 1px solid var(--accent);
  border-radius: 12px;
  background: var(--surface);
  color: #1f4e5f;
  padding: 9px 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  font-size: 0.82rem;
  font-weight: 800;
}

.piece-action-btn:hover:not(:disabled) {
  background: var(--accent-soft);
  color: #0f766e;
}

.piece-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sticker-pick {
  border: 2px solid var(--sticker-color);
  border-radius: 10px;
  background: var(--surface);
  color: var(--sticker-color);
  padding: 7px 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 74px;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  transform: rotate(-1deg);
}

.sticker-pick:hover {
  background: color-mix(in srgb, var(--sticker-color) 10%, #fffdf8);
}

.sticker-preview-text {
  border-top: 1px solid currentColor;
  border-bottom: 1px solid currentColor;
  padding: 2px 0;
}

.media-pick {
  border: 1px dashed #c4a484;
  border-radius: 14px;
  background: var(--surface);
  color: var(--text-primary);
  padding: 9px;
  display: grid;
  gap: 7px;
  font-size: 0.78rem;
  font-weight: 800;
}

.media-pick img {
  width: 100%;
  aspect-ratio: 1.3;
  object-fit: cover;
  border-radius: 8px;
  background: #f6f3eb;
}

.media-pick:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
}

.media-pick.used {
  opacity: 0.55;
  cursor: not-allowed;
}

.arrange-empty-source {
  border: 1px dashed #eadfca;
  border-radius: 16px;
  background: var(--surface-soft);
  color: var(--text-secondary);
  padding: 18px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
}

.mobile-canvas-note {
  display: none;
  align-items: center;
  gap: 8px;
  border: 1px dashed rgba(var(--accent-rgb),0.35);
  border-radius: 14px;
  background: var(--accent-soft);
  color: #0f766e;
  padding: 10px 12px;
  font-size: 0.82rem;
  font-weight: 800;
}

:deep(.vdr) {
  border: 1px dashed rgba(var(--accent-rgb),0.72);
  overflow: visible;
}

:deep(.handle) {
  background: var(--accent);
  border-color: #fff;
}

@media (max-width: 992px) {
  .scrapbook-heading {
    flex-direction: column;
  }

  .scrapbook-actions {
    justify-content: flex-start;
  }

  .arrange-workspace {
    grid-template-columns: 1fr;
  }

  .arrange-sidebar {
    max-height: 380px;
    height: auto;
  }
}

@media (max-width: 768px) {
  .mobile-canvas-note {
    display: flex;
  }
}
</style>
