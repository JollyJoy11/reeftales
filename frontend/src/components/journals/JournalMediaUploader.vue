<script setup>
import { ref, computed } from 'vue'
import draggable from 'vuedraggable'
import { useToastStore } from '@/stores/toastStore'

const props = defineProps({
  media: {
    type: Array,
    required: true
  },
  coverImage: {
    type: Object,
    default: null
  },
  activities: {
    type: Array,
    default: () => []
  },
  speciesList: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:media', 'update:coverImage'])
const toastStore = useToastStore()

const isDragging = ref(false)
const fileInput = ref(null)

const draggableMedia = computed({
  get() {
    return props.media
  },
  set(value) {
    emit('update:media', value)
  }
})

function openFilePicker() {
  fileInput.value?.click()
}

function isCover(item) {
  return props.coverImage?.mediaId
    ? props.coverImage.mediaId === item.id
    : props.coverImage?.dataUrl === item.dataUrl
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function createVideoThumbnail(dataUrl) {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true
    video.src = dataUrl

    const captureFrame = () => {
      if (!video.videoWidth || !video.videoHeight) {
        resolve(dataUrl)
        return
      }

      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const context = canvas.getContext('2d')
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.86))
    }

    video.addEventListener('loadedmetadata', () => {
      const targetTime = Number.isFinite(video.duration)
        ? Math.min(Math.max(video.duration * 0.15, 0.5), 2)
        : 0.5

      video.currentTime = targetTime
    }, { once: true })

    video.addEventListener('seeked', captureFrame, { once: true })
    video.addEventListener('loadeddata', () => {
      if (video.currentTime === 0) captureFrame()
    }, { once: true })
    video.addEventListener('error', () => resolve(dataUrl), { once: true })
  })
}

function getImageAspectRatio(dataUrl) {
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => {
      resolve(image.naturalWidth && image.naturalHeight
        ? image.naturalWidth / image.naturalHeight
        : 1.32)
    }
    image.onerror = () => resolve(1.32)
    image.src = dataUrl
  })
}

function getVideoAspectRatio(dataUrl) {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true
    video.src = dataUrl

    video.addEventListener('loadedmetadata', () => {
      resolve(video.videoWidth && video.videoHeight
        ? video.videoWidth / video.videoHeight
        : 1.32)
    }, { once: true })

    video.addEventListener('error', () => resolve(1.32), { once: true })
  })
}

function getCoverPayload(item) {
  const coverUrl = item.coverDataUrl || item.dataUrl

  return {
    mediaId: item.id,
    mediaType: item.media_type,
    previewUrl: coverUrl,
    dataUrl: coverUrl
  }
}

async function processFiles(files) {
  const updated = [...props.media]
  let skippedType = 0
  let skippedLimit = 0

  for (const file of files) {
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      skippedType++
      continue
    }

    if (updated.length >= 10) {
      skippedLimit++
      continue
    }

    const dataUrl = await toBase64(file)
    const isVideo = file.type.startsWith('video/')
    const coverDataUrl = isVideo ? await createVideoThumbnail(dataUrl) : dataUrl
    const aspectRatio = isVideo
      ? await getVideoAspectRatio(dataUrl)
      : await getImageAspectRatio(dataUrl)

    const item = {
      id: crypto.randomUUID(),
      file,
      previewUrl: dataUrl,
      dataUrl,
      coverDataUrl,
      aspectRatio,
      media_type: isVideo ? 'video' : 'photo',
      caption: '',
      link_type: '',
      activity_id: '',
      species_id: '',
      custom_activity_name: '',
      custom_species_name: ''
    }

    updated.push(item)

    if (!props.coverImage) {
      emit('update:coverImage', getCoverPayload(item))
    }
  }

  emit('update:media', updated)

  if (skippedType) {
    toastStore.danger('Some files were skipped. Please upload images or videos only.')
  }

  if (skippedLimit) {
    toastStore.danger('Only 10 media files can be uploaded for one journal.')
  }

  if (!files.length) {
    toastStore.danger('No files were selected.')
  }
}

function handleFileDrop(event) {
  isDragging.value = false
  processFiles(Array.from(event.dataTransfer.files))
}

function handleFileSelect(event) {
  processFiles(Array.from(event.target.files))
}

function updateMedia(index, key, value) {
  const updated = [...props.media]
  updated[index] = { ...updated[index], [key]: value }

  if (key === 'link_type') {
    updated[index].activity_id = ''
    updated[index].species_id = ''
    updated[index].custom_activity_name = ''
    updated[index].custom_species_name = ''
  }

  emit('update:media', updated)
}

function removeMedia(index) {
  const removedItem = props.media[index]
  const updated = props.media.filter((_, i) => i !== index)

  emit('update:media', updated)

  if (isCover(removedItem)) {
    emit('update:coverImage', updated[0] ? getCoverPayload(updated[0]) : null)
  }
}

function setCoverImage(item) {
  emit('update:coverImage', getCoverPayload(item))
}
</script>

<template>
  <div>
    <div
      class="drag-drop-zone"
      :class="{ 'drag-over': isDragging }"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleFileDrop"
      @click="openFilePicker"
    >
      <input
        ref="fileInput"
        type="file"
        class="d-none"
        multiple
        accept="image/*,video/*"
        @change="handleFileSelect"
      />

      <i class="bi bi-images"></i>
      <strong>Drag your journey photos here</strong>
      <span>or click to browse. Upload up to 10 photos or videos.</span>
    </div>

    <p v-if="media.length" class="reorder-hint">
      <i class="bi bi-grip-vertical"></i>
      Drag cards to arrange photo order.
    </p>

    <draggable
      v-if="media.length"
      v-model="draggableMedia"
      item-key="id"
      class="row g-4 mt-3"
      handle=".drag-side"
      ghost-class="drag-ghost"
			chosen-class="drag-chosen"
  		drag-class="drag-active"
    >
      <template #item="{ element: item, index }">
        <div class="col-12 col-md-6 col-xl-4">
          <article class="uploaded-card">
            <div
              class="scrapbook-polaroid"
              :class="index % 2 === 0 ? 'tilt-left' : 'tilt-right'"
            >
              <button type="button" class="drag-side border-0 w-100 d-flex align-items-center justify-content-center bg-transparent" title="Drag to reorder">
                <i class="bi bi-grip-horizontal"></i>
              </button>

              <div class="tape-accent"></div>

              <span v-if="isCover(item)" class="cover-badge">
                Cover
              </span>

              <div class="media-canvas">
                <img
                  v-if="item.media_type === 'photo'"
                  :src="item.previewUrl"
                  alt="Uploaded preview"
                />

                <video
                  v-else
                  :src="item.previewUrl"
                  controls
                ></video>
              </div>

              <div class="polaroid-caption-zone">
                <label class="caption-label">
                  {{ item.media_type === 'video' ? 'Video memory' : 'Photo memory' }}
                </label>

                <textarea
                  :value="item.caption"
                  class="caption-textarea"
                  rows="2"
                  :placeholder="item.media_type === 'video'
                    ? 'Write a memory for this video...'
                    : 'Write a memory for this photo...'"
                  @input="updateMedia(index, 'caption', $event.target.value)"
                ></textarea>
              </div>

              <div class="polaroid-controls">
                <div>
                  <label class="caption-label">
                    Link this {{ item.media_type === 'video' ? 'video' : 'photo' }} to
                  </label>

                  <select
                    :value="item.link_type"
                    class="form-select form-select-sm"
                    @change="updateMedia(index, 'link_type', $event.target.value)"
                  >
                    <option value="">General scenery</option>
                    <option value="activity">Activity</option>
                    <option value="species">Marine species</option>
                  </select>
                </div>

                <button
                  type="button"
                  class="cover-select-btn"
                  :class="{ selected: isCover(item) }"
                  @click="setCoverImage(item)"
                >
                  <i :class="isCover(item) ? 'bi bi-star-fill' : 'bi bi-star'"></i>
                  {{ isCover(item) ? 'Cover' : 'Set cover' }}
                </button>
              </div>

              <div class="uploaded-fields">
                <select
                  v-if="item.link_type === 'activity'"
                  :value="item.activity_id"
                  class="form-select"
                  @change="updateMedia(index, 'activity_id', $event.target.value)"
                >
                  <option value="">Choose activity</option>
                  <option
                    v-for="activity in activities"
                    :key="activity.id"
                    :value="activity.id"
                  >
                    {{ activity.name }}
                  </option>
                </select>

                <input
                  v-if="item.link_type === 'activity'"
                  :value="item.custom_activity_name"
                  type="text"
                  class="form-control"
                  placeholder="Or describe another activity..."
                  @input="updateMedia(index, 'custom_activity_name', $event.target.value)"
                />

                <select
                  v-if="item.link_type === 'species'"
                  :value="item.species_id"
                  class="form-select"
                  @change="updateMedia(index, 'species_id', $event.target.value)"
                >
                  <option value="">Choose species</option>
                  <option
                    v-for="species in speciesList"
                    :key="species.id"
                    :value="species.id"
                  >
                    {{ species.name }}
                  </option>
                </select>

                <input
                  v-if="item.link_type === 'species'"
                  :value="item.custom_species_name"
                  type="text"
                  class="form-control"
                  placeholder="Or type another species..."
                  @input="updateMedia(index, 'custom_species_name', $event.target.value)"
                />

                <div class="media-actions">
                  <button
                    type="button"
                    class="remove-media-btn"
                    @click="removeMedia(index)"
                  >
                    <i class="bi bi-trash"></i>
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </article>
        </div>
      </template>
    </draggable>
  </div>
</template>

<style scoped>
.drag-drop-zone {
  border: 2px dashed #1897a0;
  background: rgba(24,151,160,0.04);
  padding: 34px 18px;
  border-radius: 20px;
  text-align: center;
  cursor: pointer;
  display: grid;
  gap: 4px;
  color: #64748b;
}

.drag-drop-zone i {
  font-size: 2.4rem;
  color: #1897a0;
}

.drag-drop-zone strong {
  color: #2f4858;
}

.drag-drop-zone.drag-over {
  background: rgba(24,151,160,0.12);
}

.reorder-hint {
  margin: 14px 0 0;
  color: #64748b;
  font-size: 0.86rem;
}

.uploaded-card {
  position: relative;
  padding: 10px;
  background: transparent;
  border: none;
  box-shadow: none;
}

.uploaded-card:active {
  cursor: grabbing;
}

.drag-side {
  color: #94a3b8;
  font-size: 1.1rem;
  user-select: none;
}

.scrapbook-polaroid {
  position: relative;
  background: #ffffff;
  padding: 16px 16px 24px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.12);
}

.scrapbook-polaroid.tilt-left {
  transform: rotate(-0.8deg);
}

.scrapbook-polaroid.tilt-right {
  transform: rotate(0.8deg);
}

.tape-accent {
  position: absolute;
  top: -12px;
  left: 50%;
  width: 120px;
  height: 28px;
  transform: translateX(-50%) rotate(2deg);
  background: rgba(24,151,160,0.2);
  border-left: 1px dashed rgba(0,0,0,0.12);
  border-right: 1px dashed rgba(0,0,0,0.12);
  z-index: 2;
}

.media-canvas {
  min-height: 240px;
  background: #f6f3eb;
  border: 2px solid #475569;
  display: flex;
  align-items: center;
  justify-content: center;
}

.media-canvas img,
.media-canvas video {
  display: block;
  max-width: 100%;
  max-height: 360px;
  width: auto;
  height: auto;
  object-fit: contain;
}

.polaroid-caption-zone {
  margin-top: 14px;
}

.caption-textarea {
  width: 100%;
  min-height: 54px;
  border: 1px dashed transparent;
  background: #fffdf8;
  border-bottom: 1px dashed #c4a484;
  border-radius: 8px;
  font-size: 0.85rem;
  color: #2f4858;
  padding: 8px;
  resize: vertical;
  cursor: text;
}

.caption-textarea:hover {
  border-color: rgba(24,151,160,0.25);
}

.caption-textarea:focus {
  outline: none;
  border-color: #1897a0;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(24,151,160,0.12);
}

.cover-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
  padding: 6px 10px;
  border-radius: 999px;
  background: #1897a0;
  color: white;
  font-size: 0.74rem;
  font-weight: 800;
  box-shadow: 0 6px 14px rgba(0,0,0,0.14);
}

.uploaded-fields {
  margin-top: 10px;
  display: grid;
  gap: 8px;
}

.uploaded-fields .form-label {
  color: #2f4858;
  font-weight: 700;
  font-size: 0.82rem;
  margin-bottom: 4px;
}

.media-actions {
  display: flex;
  justify-content: flex-end;
}

.remove-media-btn {
  border: none;
  background: #fff1f2;
  color: #dc3545;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 0.82rem;
}

.drag-chosen {
  border-color: #1897a0 !important;
  background: #deefec !important;
  box-shadow: 0 14px 32px rgba(24,151,160,0.22) !important;
}

.drag-active {
  opacity: 0.75;
  transform: rotate(1deg);
}

.drag-ghost {
  opacity: 0.35;
  background: rgba(24,151,160,0.12) !important;
  border: 2px dashed #1897a0 !important;
}

.polaroid-controls {
  margin-top: 12px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: end;
}

.cover-select-btn {
  border: 1px solid #1897a0;
  background: #fffdf8;
  color: #1897a0;
  border-radius: 999px;
  padding: 7px 12px;
  font-size: 0.82rem;
  font-weight: 800;
  white-space: nowrap;
}

.cover-select-btn.selected {
  background: #1897a0;
  color: white;
}

:global(body.dark-mode) .uploaded-card {
  background: #253244;
  border-color: rgba(255,255,255,0.1);
}

:global(body.dark-mode) .media-preview-panel {
  background: #2d3748;
  border-color: rgba(255,255,255,0.12);
}

:global(body.dark-mode) .uploaded-fields .form-label {
  color: #f8fafc;
}
</style>
