<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { identifyMarineImage } from '@/services/wormsService'

const fileInput = ref(null)
const previewUrl = ref('')
const selectedFile = ref(null)
const matches = ref([])
const aiPrediction = ref(null)
const savedIdentification = ref(null)

const isDragging = ref(false)
const loading = ref(false)
const errorMessage = ref('')

const previewAlt = computed(() => {
  const commonName = aiPrediction.value?.commonName
  const scientificName = aiPrediction.value?.scientificName

  if (commonName && scientificName) {
    return `Uploaded marine photo identified as ${commonName}, ${scientificName}`
  }

  if (commonName || scientificName) {
    return `Uploaded marine photo identified as ${commonName || scientificName}`
  }

  return 'Uploaded marine photo for AI identification'
})

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

  selectedFile.value = file
  previewUrl.value = URL.createObjectURL(file)

  errorMessage.value = ''
  matches.value = []
  aiPrediction.value = null
  savedIdentification.value = null
}

function handleFileChange(event) {
  setImage(event.target.files?.[0])
}

function handleDrop(event) {
  isDragging.value = false
  setImage(event.dataTransfer.files?.[0])
}

async function identifySpecies() {
  if (!selectedFile.value) {
    errorMessage.value = 'Upload a marine image first.'
    return
  }

  try {
    loading.value = true
    errorMessage.value = ''

    const result = await identifyMarineImage(
      selectedFile.value
    )

    aiPrediction.value = result.aiPrediction
    matches.value = result.wormsMatches || []
    savedIdentification.value = result.savedIdentification

    if (!matches.value.length) {
      errorMessage.value =
        'AI prediction completed, but no WoRMS match was found.'
    }
  } catch (error) {
    console.error(error)

    errorMessage.value =
      error.response?.data?.message ||
      'Unable to identify marine species.'
  } finally {
    loading.value = false
  }
}

function matchStatusLabel(status) {
  return status?.toLowerCase() === 'accepted' ? 'Verified' : status
}

function isVerifiedMatch(status) {
  return status?.toLowerCase() === 'accepted'
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
        :alt="previewAlt"
      />

      <div v-else class="drop-placeholder">
        <i class="bi bi-cloud-arrow-up"></i>
        <strong>Drop a marine photo</strong>
        <span>AI will suggest a species match</span>
      </div>
    </div>

    <div class="label-body">
      <h4>AI Identify</h4>
      <p class="subtitle">Upload a marine photo to predict the species and verify its taxonomy.</p>

      <div class="lookup-form">
        <button class="btn btn-primary" :disabled="loading" @click="identifySpecies">
          {{ loading ? 'Analyzing...' : 'Identify Species' }}
        </button>
      </div>

      <div v-if="aiPrediction" class="ai-result">
        <strong>
          {{ aiPrediction.commonName }}
        </strong>

        <span>
          {{ aiPrediction.scientificName }}
        </span>

        <small>
          Confidence: {{ aiPrediction.confidence }}
        </small>

        <p v-if="aiPrediction.reason" class="ai-reason">
          {{ aiPrediction.reason }}
        </p>
      </div>

      <div v-if="!aiPrediction" class="ai-steps">
        <div>
          <i class="bi bi-image"></i>
          <span>Upload a clear marine photo</span>
        </div>

        <div>
          <i class="bi bi-stars"></i>
          <span>Gemini suggests a match</span>
        </div>

        <div>
          <i class="bi bi-check-circle"></i>
          <span>WoRMS verifies taxonomy</span>
        </div>
      </div>

      <p v-if="errorMessage" class="lookup-message">{{ errorMessage }}</p>
      <p v-if="savedIdentification" class="saved-message">
        Saved to My Marine Life.
      </p>

      <div v-if="matches.length" class="match-list">
        <div v-for="match in matches" :key="match.aphiaId" class="match-row">
          <strong>{{ match.acceptedName || match.scientificName }}</strong>
          <span class="match-meta">
            {{ match.rank }}
            <span
              class="status-text"
              :class="{ verified: isVerifiedMatch(match.status) }"
            >
              <i
                v-if="isVerifiedMatch(match.status)"
                class="bi bi-check-lg"
              ></i>
              {{ matchStatusLabel(match.status) }}
            </span>
          </span>
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
.ai-identify-card {
  padding: 12px;
  background: var(--accent-soft);
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
  color: var(--text-secondary);
}

.lookup-form {
  display: grid;
  gap: 8px;
}

.lookup-form .btn {
  width: 100%;
}

.ai-result {
  margin-top: 12px;
  padding: 10px;
  border-radius: 12px;
  background: rgba(255,255,255,0.55);
  border: 1px solid rgba(0,0,0,0.08);
}

.ai-result strong,
.ai-result span,
.ai-result small {
  display: block;
}

.ai-result span {
  font-style: italic;
  color: #475569;
}

.ai-result small {
  margin-top: 4px;
  color: var(--text-secondary);
}

.lookup-message {
  margin: 10px 0 0;
  font-size: 0.78rem;
  color: #b45309;
}

.saved-message {
  margin: 10px 0 0;
  font-size: 0.78rem;
  color: #20856d;
  font-weight: 800;
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
.match-row > span {
  display: block;
}

.match-row strong {
  font-size: 0.82rem;
}

.match-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 0.72rem;
  color: var(--text-secondary);
}

.status-text {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--text-secondary);
  font-weight: 800;
  line-height: 1.4;
}

.status-text.verified {
  color: #2f7d4d;
}

.status-text i {
  width: 15px;
  height: 15px;
  border: 1.5px solid currentColor;
  border-radius: 50%;
  display: inline-grid;
  place-items: center;
  font-size: 0.58rem;
  line-height: 1;
}

.ai-reason {
  margin: 8px 0 0;
  font-size: 0.72rem;
  color: var(--text-secondary);
}

.ai-steps {
  margin-top: 16px;
  display: grid;
  gap: 8px;
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.ai-steps div {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 12px;
  background: rgba(255,255,255,0.45);
}

.ai-steps i {
  color: var(--accent);
}
</style>
