<script setup>
import { onBeforeUnmount, ref } from 'vue'
import { searchWorms } from '@/services/wormsService'

const fileInput = ref(null)
const previewUrl = ref('')
const candidateName = ref('')
const matches = ref([])
const isDragging = ref(false)
const loading = ref(false)
const errorMessage = ref('')

function openFilePicker() {
  fileInput.value?.click()
}

function setImage(file) {
  if (!file?.type.startsWith('image/')) {
    errorMessage.value = 'Please upload an image file.'
    return
  }

  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }

  previewUrl.value = URL.createObjectURL(file)
  errorMessage.value = ''
}

function handleFileChange(event) {
  setImage(event.target.files?.[0])
}

function handleDrop(event) {
  isDragging.value = false
  setImage(event.dataTransfer.files?.[0])
}

async function identifySpecies() {
  if (!candidateName.value.trim()) {
    errorMessage.value = 'Enter a species name to check with WoRMS.'
    return
  }

  try {
    loading.value = true
    errorMessage.value = ''
    matches.value = await searchWorms(candidateName.value)

    if (!matches.value.length) {
      errorMessage.value = 'No WoRMS matches found.'
    }
  } catch (error) {
    errorMessage.value = 'Unable to search WoRMS right now.'
  } finally {
    loading.value = false
  }
}

onBeforeUnmount(() => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
})
</script>

<template>
  <article class="ai-identify-card h-100">
    <div
      class="stamp-drop-area"
      :class="{ dragging: isDragging }"
      @dragenter.prevent="isDragging = true"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
      @click="openFilePicker"
    >
      <input
        ref="fileInput"
        class="visually-hidden"
        type="file"
        accept="image/*"
        @change="handleFileChange"
      />

      <img
        v-if="previewUrl"
        :src="previewUrl"
        class="preview-image"
        alt="Uploaded marine species"
      />

      <div v-else class="drop-placeholder">
        <i class="bi bi-cloud-arrow-up"></i>
        <strong>Drop a species photo</strong>
        <span>or choose an image</span>
      </div>
    </div>

    <div class="label-body">
      <h4>AI Identify</h4>
      <p class="subtitle">Check a marine name with WoRMS</p>

      <div class="lookup-form">
        <input
          v-model="candidateName"
          type="search"
          class="form-control"
          placeholder="e.g. Chelonia mydas"
          @keyup.enter="identifySpecies"
        />

        <button class="btn btn-primary" :disabled="loading" @click="identifySpecies">
          {{ loading ? 'Checking...' : 'Identify' }}
        </button>
      </div>

      <p v-if="errorMessage" class="lookup-message">{{ errorMessage }}</p>

      <div v-if="matches.length" class="match-list">
        <div v-for="match in matches" :key="match.aphiaId" class="match-row">
          <strong>{{ match.acceptedName || match.scientificName }}</strong>
          <span>{{ match.rank }} · {{ match.status }}</span>
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
.ai-identify-card {
  padding: 12px;
  background: #deefec;
  transition: transform 0.2s ease;
  transform: rotate(0.4deg);

  --r: 5px;
  --s: 15px;

  mask:
    radial-gradient(var(--r) at var(--r) 50%, transparent 98%, black)
      calc(-1*var(--r)) 50% / 100% var(--s),
    radial-gradient(var(--r) at 50% var(--r), transparent 98%, black)
      50% calc(-1*var(--r)) / var(--s) 100%;
  mask-composite: intersect;
}

.ai-identify-card:hover {
  transform: rotate(0deg) translateY(-4px);
}

.stamp-drop-area {
  height: 200px;
  margin: 10px;
  padding: 10px 8px 24px;
  background: #f6f3eb;
  overflow: hidden;
  box-shadow: 0 6px 10px rgba(0,0,0,0.18);
  cursor: pointer;
  transform: rotate(-1.5deg);
}

.stamp-drop-area.dragging {
  background: #dff6f0;
}

.preview-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border: 2px solid #475569;
}

.drop-placeholder {
  height: 100%;
  border: 2px dashed #7c98a6;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #475569;
  text-align: center;
}

.drop-placeholder i {
  font-size: 2rem;
}

.drop-placeholder span {
  font-size: 0.78rem;
}

.label-body {
  padding: 10px 12px 18px;
  color: #1e293b;
}

.label-body h4 {
  text-align: center;
  font-weight: 800;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
}

.subtitle {
  text-align: center;
  font-size: 0.78rem;
  color: #64748b;
}

.lookup-form {
  display: grid;
  gap: 8px;
}

.lookup-form .btn {
  width: 100%;
}

.lookup-message {
  margin: 10px 0 0;
  font-size: 0.78rem;
  color: #b45309;
}

.match-list {
  display: grid;
  gap: 8px;
  margin-top: 12px;
}

.match-row {
  padding-top: 8px;
  border-top: 1px solid #9fb8c3;
}

.match-row strong,
.match-row span {
  display: block;
}

.match-row strong {
  font-size: 0.82rem;
}

.match-row span {
  font-size: 0.72rem;
  color: #64748b;
}

:global(body.dark-mode) .ai-identify-card {
  background: #253244;
}

:global(body.dark-mode) .label-body {
  color: #f8fafc;
}

:global(body.dark-mode) .subtitle,
:global(body.dark-mode) .match-row span {
  color: #cbd5e1;
}

:global(body.dark-mode) .stamp-drop-area {
  background: #2d3748;
}

:global(body.dark-mode) .drop-placeholder {
  border-color: #94a3b8;
  color: #e2e8f0;
}

:global(body.dark-mode) .match-row {
  border-color: rgba(255,255,255,0.12);
}
</style>
