<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
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
  },
  timeline: {
    type: Array,
    default: () => []
  },
  sightings: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:media', 'update:coverImage'])
const toastStore = useToastStore()
const { t } = useI18n()

const isDragging = ref(false)
const fileInput = ref(null)
const maxFileSize = 10 * 1024 * 1024
const maxMediaFiles = 10

const draggableMedia = computed({
  get() {
    return props.media
  },
  set(value) {
    emit('update:media', value)
  }
})

const customActivityOptions = computed(() => {
  return uniqueNames(
    props.timeline
      .filter(entry => entry.activity_id === 'custom')
      .map(entry => entry.custom_activity_name)
  )
})

const customSpeciesOptions = computed(() => {
  return uniqueNames(
    props.sightings
      .filter(sighting => sighting.species_id === 'custom')
      .map(sighting => sighting.custom_species_name)
  )
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
  let skippedSize = 0

  for (const file of files) {
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      skippedType++
      continue
    }

    if (file.size > maxFileSize) {
      skippedSize++
      continue
    }

    if (updated.length >= maxMediaFiles) {
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
    toastStore.danger(t('toast.uploadInvalidType'))
  }

  if (skippedLimit) {
    toastStore.danger(t('toast.uploadLimit'))
  }

  if (skippedSize) {
    toastStore.danger(t('toast.uploadFileTooLarge'))
  }

  if (!files.length) {
    toastStore.danger(t('toast.uploadEmpty'))
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

function updateMediaFields(index, fields) {
  const updated = [...props.media]
  updated[index] = { ...updated[index], ...fields }
  emit('update:media', updated)
}

function uniqueNames(names) {
  const seen = new Set()

  return names
    .map(name => name?.trim())
    .filter(Boolean)
    .filter((name) => {
      const key = name.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

function linkValue(item, idKey, customKey) {
  if (item[idKey] === 'custom' && item[customKey]) {
    return `custom:${item[customKey]}`
  }

  return item[idKey]
}

function updateActivityLink(index, value) {
  if (value.startsWith('custom:')) {
    updateMediaFields(index, {
      activity_id: 'custom',
      custom_activity_name: value.replace(/^custom:/, '')
    })
    return
  }

  updateMediaFields(index, {
    activity_id: value,
    custom_activity_name: ''
  })
}

function updateSpeciesLink(index, value) {
  if (value.startsWith('custom:')) {
    updateMediaFields(index, {
      species_id: 'custom',
      custom_species_name: value.replace(/^custom:/, '')
    })
    return
  }

  updateMediaFields(index, {
    species_id: value,
    custom_species_name: ''
  })
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
    <div class="section-heading">
      <h5 class="section-title">
        Photos & Videos
        <span class="requirement-badge optional">Optional</span>
      </h5>
      <p>Upload up to 10 photos or videos, then link them to an activity or species if helpful.</p>
    </div>

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
                  :alt="item.caption || `Uploaded photo ${index + 1} preview`"
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
                  :value="linkValue(item, 'activity_id', 'custom_activity_name')"
                  class="form-select"
                  @change="updateActivityLink(index, $event.target.value)"
                >
                  <option value="">Choose activity</option>
                  <option
                    v-for="activity in activities"
                    :key="activity.id"
                    :value="activity.id"
                  >
                    {{ activity.name }}
                  </option>
                  <option
                    v-for="customActivity in customActivityOptions"
                    :key="`custom-activity-${customActivity}`"
                    :value="`custom:${customActivity}`"
                  >
                    {{ customActivity }}
                  </option>
                </select>

                <select
                  v-if="item.link_type === 'species'"
                  :value="linkValue(item, 'species_id', 'custom_species_name')"
                  class="form-select"
                  @change="updateSpeciesLink(index, $event.target.value)"
                >
                  <option value="">Choose species</option>
                  <option
                    v-for="species in speciesList"
                    :key="species.id"
                    :value="species.id"
                  >
                    {{ species.name }}
                  </option>
                  <option
                    v-for="customSpecies in customSpeciesOptions"
                    :key="`custom-species-${customSpecies}`"
                    :value="`custom:${customSpecies}`"
                  >
                    {{ customSpecies }}
                  </option>
                </select>

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
  border: 2px dashed var(--accent);
  background: rgba(24,151,160,0.04);
  padding: 34px 18px;
  border-radius: 20px;
  text-align: center;
  cursor: pointer;
  display: grid;
  gap: 4px;
  color: var(--text-secondary);
}

.section-heading {
  margin-bottom: 14px;
}

.section-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  color: var(--text-primary);
  font-weight: 800;
  margin: 0 0 4px;
}

.section-heading p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.86rem;
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

.drag-drop-zone i {
  font-size: 2.4rem;
  color: var(--accent);
}

.drag-drop-zone strong {
  color: var(--text-primary);
}

.drag-drop-zone.drag-over {
  background: rgba(24,151,160,0.12);
}

.reorder-hint {
  margin: 14px 0 0;
  color: var(--text-secondary);
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
  background: var(--surface);
  border-bottom: 1px dashed #c4a484;
  border-radius: 8px;
  font-size: 0.85rem;
  color: var(--text-primary);
  padding: 8px;
  resize: vertical;
  cursor: text;
}

.caption-textarea:hover {
  border-color: rgba(24,151,160,0.25);
}

.caption-textarea:focus {
  outline: none;
  border-color: var(--accent);
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
  background: var(--accent);
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
  color: var(--text-primary);
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
  background: var(--surface-soft);
  color: #dc3545;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 0.82rem;
}

.drag-chosen {
  border-color: var(--accent) !important;
  background: var(--accent-soft) !important;
  box-shadow: 0 14px 32px rgba(24,151,160,0.22) !important;
}

.drag-active {
  opacity: 0.75;
  transform: rotate(1deg);
}

.drag-ghost {
  opacity: 0.35;
  background: rgba(24,151,160,0.12) !important;
  border: 2px dashed var(--accent) !important;
}

.polaroid-controls {
  margin-top: 12px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: end;
}

.cover-select-btn {
  border: 1px solid var(--accent);
  background: var(--surface);
  color: var(--accent);
  border-radius: 999px;
  padding: 7px 12px;
  font-size: 0.82rem;
  font-weight: 800;
  white-space: nowrap;
}

.cover-select-btn.selected {
  background: var(--accent);
  color: white;
}
</style>
