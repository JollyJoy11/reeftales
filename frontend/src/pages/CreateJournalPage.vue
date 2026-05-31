<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import MainLayout from '@/layouts/MainLayout.vue'
import AppAlert from '@/components/common/AppAlert.vue'
import JournalStepIndicator from '@/components/journals/JournalStepIndicator.vue'
import IslandMapPicker from '@/components/journals/IslandMapPicker.vue'
import MoodSelector from '@/components/journals/MoodSelector.vue'
import VisibilityToggle from '@/components/journals/VisibilityToggle.vue'
import JournalMediaUploader from '@/components/journals/JournalMediaUploader.vue'
import JournalTimelineEditor from '@/components/journals/JournalTimelineEditor.vue'
import JournalSightingsEditor from '@/components/journals/JournalSightingsEditor.vue'
import JournalPreview from '@/components/journals/JournalPreview.vue'
import AppDateRangePicker from '@/components/common/AppDateRangePicker.vue'
import JournalScrapbookEditor from '@/components/journals/JournalScrapbookEditor.vue'
import { useToastStore } from '@/stores/toastStore'

import { createJournal, uploadJournalMedia } from '@/services/journalService'
import { getIslands } from '@/services/islandService'
import { getSpecies } from '@/services/speciesService'
import { getActivities } from '@/services/activityService'

const router = useRouter()
const route = useRoute()
const toastStore = useToastStore()

const step = ref(1)
const maxStep = ref(1)
const loading = ref(false)
const errorMessage = ref('')

const islands = ref([])
const speciesList = ref([])
const activities = ref([])

const form = ref({
  island_id: '',
  title: '',
  trip_dates: [],
  mood: 'joyful',
  is_public: true,
  content: '',
  coverImage: null,
  media: [],
  timeline: [
    {
      id: crypto.randomUUID(),
      day_number: 1,
      activity_time: '',
      activity_id: '',
      custom_activity_name: '',
      notes: ''
    }
  ],
  sightings: [
    { species_id: '', custom_species_name: '', quantity: 1, notes: '' }
  ],
  layoutItems: []
})

const tripDayCount = computed(() => {
  const [startDate, endDate] = form.value.trip_dates || []
  if (!startDate || !endDate) return 1

  const start = new Date(startDate)
  const end = new Date(endDate)
  const diff = Math.round((end - start) / 86400000) + 1

  return Math.max(1, diff)
})

function validateCurrentStep() {
  if (step.value === 1 && (!form.value.island_id || !form.value.title)) {
    toastStore.danger('Please choose an island and add a journal title.')
    return false
  }

  if (step.value === 2 && !form.value.content.trim()) {
    toastStore.danger('Please write your story before continuing.')
    return false
  }

  if (step.value === 3) {
    const invalidEntry = form.value.timeline.find(entry => {
      const dayNumber = Number(entry.day_number)
      return dayNumber < 1 || dayNumber > tripDayCount.value
    })

    if (invalidEntry) {
      toastStore.danger(`Timeline days must be between Day 1 and Day ${tripDayCount.value}.`)
      return false
    }
  }

  return true
}

function nextStep() {
  if (!validateCurrentStep()) return

  if (step.value < 6) {
    step.value++
    maxStep.value = Math.max(maxStep.value, step.value)
  }
}

function previousStep() {
  if (step.value > 1) step.value--
}

function formatDateForMySQL(date) {
  if (!date) return null
  return new Date(date).toISOString().split('T')[0]
}

function firstQueryValue(value) {
  return Array.isArray(value) ? value[0] : value
}

function uploadedMediaType(file) {
  return file?.type?.startsWith('video/') ? 'video' : 'photo'
}

async function loadData() {
  try {
    islands.value = await getIslands()
    speciesList.value = await getSpecies()
    activities.value = await getActivities()
    applyTripPrefill()
  } catch {
    errorMessage.value = 'Failed to load journal form data.'
  }
}

function applyTripPrefill() {
  const islandId = firstQueryValue(route.query.island_id)
  const startDate = firstQueryValue(route.query.start_date)
  const endDate = firstQueryValue(route.query.end_date)
  const title = firstQueryValue(route.query.title)

  if (islandId && !form.value.island_id) {
    form.value.island_id = String(islandId)
  }

  if ((startDate || endDate) && !form.value.trip_dates.length) {
    form.value.trip_dates = [startDate, endDate || startDate].filter(Boolean)
  }

  if (title && !form.value.title) {
    form.value.title = String(title)
  }
}

async function handleSubmit() {
  try {
    loading.value = true
    errorMessage.value = ''

    const uploadableMedia = form.value.media.filter(item => item.file)
    const uploadedFiles = uploadableMedia.length
      ? await uploadJournalMedia(uploadableMedia.map(item => item.file))
      : []

    const uploadedById = new Map(uploadableMedia.map((item, index) => [
      String(item.id),
      uploadedFiles[index]
    ]))

    const mediaById = new Map(form.value.media.map(item => [String(item.id), item]))
    const layoutItems = form.value.layoutItems.map(item => {
      if (item.type !== 'media' || !item.mediaId) return item

      const sourceMedia = mediaById.get(String(item.mediaId))
      if (!sourceMedia) return item

      const uploadedMedia = uploadedById.get(String(sourceMedia.id))
      const mediaUrl = uploadedMedia?.url || sourceMedia.dataUrl || sourceMedia.previewUrl

      return {
        ...item,
        previewUrl: sourceMedia.media_type === 'video'
          ? sourceMedia.coverDataUrl || item.previewUrl || mediaUrl
          : mediaUrl,
        mediaUrl,
        mediaType: uploadedMediaType(sourceMedia.file)
      }
    })

    const coverMediaId = form.value.coverImage?.mediaId
    const coverSource = coverMediaId ? mediaById.get(String(coverMediaId)) : null
    const uploadedCover = coverMediaId ? uploadedById.get(String(coverMediaId)) : null
    const coverImage = coverSource?.media_type === 'video'
      ? form.value.coverImage?.dataUrl || ''
      : uploadedCover?.url || coverSource?.dataUrl || form.value.coverImage?.dataUrl ||
      ''

    const payload = {
      island_id: form.value.island_id,
      title: form.value.title,
      content: form.value.content,
      cover_image: coverImage,
      start_date: formatDateForMySQL(form.value.trip_dates?.[0]),
      end_date: formatDateForMySQL(form.value.trip_dates?.[1]),
      mood: form.value.mood,
      visibility: form.value.is_public ? 'public' : 'private',
      layout_items: layoutItems,

      activities: form.value.timeline
        .filter(item => item.activity_id || item.custom_activity_name?.trim() || item.notes?.trim())
        .map(item => ({
          activity_id: item.activity_id && item.activity_id !== 'custom' ? Number(item.activity_id) : null,
          custom_activity_name: item.activity_id === 'custom' ? item.custom_activity_name || null : null,
          day_number: item.day_number || null,
          activity_time: item.activity_time || null,
          notes: item.notes || null
        })),

      sightings: form.value.sightings
        .filter(item => item.species_id || item.custom_species_name?.trim())
        .map(item => ({
          species_id: item.species_id && item.species_id !== 'custom' ? Number(item.species_id) : null,
          custom_species_name: item.species_id === 'custom' ? item.custom_species_name || null : null,
          quantity: Number(item.quantity) || 1,
          notes: item.notes || null
        })),

      media: form.value.media.map((item, index) => ({
        media_url: uploadedById.get(String(item.id))?.url || item.dataUrl,
        media_type: uploadedById.get(String(item.id))
          ? uploadedMediaType(item.file)
          : item.media_type,
        caption: item.caption,

        activity_id:
          item.link_type === 'activity' && item.activity_id !== 'custom'
            ? item.activity_id || null
            : null,

        custom_activity_name:
          item.link_type === 'activity'
            ? item.custom_activity_name || null
            : null,

        species_id:
          item.link_type === 'species' && item.species_id !== 'custom'
            ? item.species_id || null
            : null,

        custom_species_name:
          item.link_type === 'species'
            ? item.custom_species_name || null
            : null,

        display_order: index + 1
      }))
    }

    const response = await createJournal(payload)
    router.push(`/journal/${response.journalId}`)
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to publish journal.'
    const details = error.response?.data?.details
    errorMessage.value = details ? `${message}: ${details}` : message
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<template>
  <MainLayout>
    <AppAlert
      v-if="errorMessage"
      :message="errorMessage"
      variant="danger"
      @close="errorMessage = ''"
    />

    <section class="container py-4">
      <div class="journal-shell">
        <div class="journal-shell-inner">
          <div class="journal-header">
            <div>
              <span>Logbook Entry</span>
              <h1>Document your island adventure</h1>
              <p>Build a scrapbook-style travel journal with dates, media, activities, marine sightings, and your own arranged memory board.</p>
            </div>

            <RouterLink to="/community" class="cancel-journal-btn">
              <i class="bi bi-x-lg"></i>
              Cancel
            </RouterLink>
          </div>

          <JournalStepIndicator
            v-model:step="step"
            :max-step="maxStep"
          />

          <div v-if="step === 1" class="step-card">
            <div class="section-heading">
              <h5 class="section-title">Journal Basics</h5>
              <p>Choose the island and title for this memory. Trip dates can be added if you know them.</p>
            </div>

            <div class="row g-4">
              <div class="col-12 col-lg-6">
                <IslandMapPicker
                  v-model="form.island_id"
                  :islands="islands"
                />
              </div>

              <div class="col-12 col-lg-6">
                <label class="form-label fw-bold label-with-badge">
                  Journal Title
                  <span class="requirement-badge required">Required</span>
                </label>
                <input v-model="form.title" class="form-control mb-3" placeholder="Swimming with turtles at Sipadan..." />

                <AppDateRangePicker
                  v-model="form.trip_dates"
                  label="Trip Duration"
                />
              </div>
            </div>

            <div class="step-actions mt-4">
              <span></span>
              <button class="btn btn-primary" @click="nextStep">
                Continue
              </button>
            </div>
          </div>

          <div v-if="step === 2" class="step-card">
            <div class="section-heading">
              <h5 class="section-title">
                Story & Mood
                <span class="requirement-badge required">Required</span>
              </h5>
              <p>Write the main story of your trip. The mood stamp simply sets the feeling of the journal.</p>
            </div>

            <MoodSelector v-model="form.mood" />

            <label class="form-label fw-bold mt-4 label-with-badge">
              Your Story
              <span class="requirement-badge required">Required</span>
            </label>
            <textarea
              v-model="form.content"
              rows="10"
              class="form-control"
              placeholder="Write about your marine encounters, dive spots, food, people, beaches, or tips..."
            ></textarea>

            <div class="step-actions mt-4">
              <button class="btn btn-outline-primary" @click="previousStep">Back</button>
              <button class="btn btn-primary" @click="nextStep">Continue</button>
            </div>
          </div>

          <div v-if="step === 3" class="step-card">
            <JournalTimelineEditor
              v-model="form.timeline"
              :activities="activities"
              :max-days="tripDayCount"
            />

            <JournalSightingsEditor
              v-model="form.sightings"
              :species-list="speciesList"
              class="mt-4"
            />

            <div class="step-actions mt-4">
              <button class="btn btn-outline-primary" @click="previousStep">Back</button>
              <button class="btn btn-primary" @click="nextStep">
                Continue
              </button>
            </div>
          </div>
          
          <div v-if="step === 4" class="step-card">
            <JournalMediaUploader
              v-model:media="form.media"
              v-model:coverImage="form.coverImage"
              :activities="activities"
              :species-list="speciesList"
              :timeline="form.timeline"
              :sightings="form.sightings"
            />

            <div class="step-actions mt-4">
              <button class="btn btn-outline-primary" @click="previousStep">Back</button>
              <button class="btn btn-primary" @click="nextStep">Arrange Layout</button>
            </div>
          </div>

          <div v-if="step === 5" class="step-card">
            <JournalScrapbookEditor
              :media="form.media"
              :mood="form.mood"
              v-model:layoutItems="form.layoutItems"
            />

            <div class="step-actions mt-4">
              <button class="btn btn-outline-primary" @click="previousStep">Back</button>
              <button class="btn btn-primary" @click="nextStep">Review Journal</button>
            </div>
          </div>

          <div v-if="step === 6" class="step-card">
            <div class="section-heading">
              <h5 class="section-title">Review & Publish</h5>
              <p>Check the preview and choose public or private. Public journals can support island activity and species discovery.</p>
            </div>

            <JournalPreview
              :form="form"
              :islands="islands"
            />

            <VisibilityToggle v-model="form.is_public" class="mt-3" />

            <div class="step-actions mt-4">
              <button class="btn btn-outline-primary" @click="previousStep">Back</button>
              <button class="btn btn-primary" :disabled="loading" @click="handleSubmit">
                {{ loading ? 'Publishing...' : 'Publish Journal' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </MainLayout>
</template>

<style scoped>
.journal-shell {
  position: relative;
  padding: 10px;
  border-radius: 18px;
  background:
    repeating-linear-gradient(
      135deg,
      #e85d5d 0 12px,
      #ffffff 12px 24px,
      #2c9ab7 24px 36px,
      #ffffff 36px 48px
  );
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.12);
}

.journal-shell-inner {
  background: #fbf9f1;
  border-radius: 12px;
  padding: 32px;
  min-height: 100%;
}

.journal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 24px;
}

.journal-header span {
  color: #1897a0;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 0.82rem;
}

.journal-header h1 {
  color: #2f4858;
  font-weight: 900;
  margin: 6px 0;
}

.journal-header p {
  max-width: 760px;
  color: #64748b;
  margin: 0;
}

.cancel-journal-btn {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 14px;
  border: 1px dashed rgba(220,53,69,0.42);
  border-radius: 10px;
  color: #b42334;
  background: rgba(255,241,242,0.72);
  font-size: 0.86rem;
  font-weight: 900;
  text-decoration: none;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    color 0.18s ease,
    transform 0.18s ease;
}

.cancel-journal-btn:hover {
  color: #8f1f2e;
  background: #fff7f4;
  border-color: rgba(220,53,69,0.58);
  box-shadow:
    0 0 0 4px rgba(220,53,69,0.08),
    0 10px 22px rgba(47,72,88,0.10);
  transform: translateY(-1px);
}

.step-card {
  background: #fffdf8;
  border: 1px solid #eadfca;
  border-radius: 24px;
  padding: 26px;
}

.section-heading {
  margin-bottom: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  color: #2f4858;
  font-weight: 800;
  margin: 0 0 4px;
}

.section-heading p {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
  line-height: 1.5;
}

.label-with-badge {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.requirement-badge {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  min-height: 22px;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 0.66rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.requirement-badge.required {
  background: #fff1f2;
  color: #b42334;
  border: 1px solid rgba(180,35,52,0.24);
}

.requirement-badge.recommended {
  background: #fff8db;
  color: #8a5b00;
  border: 1px solid rgba(201,145,46,0.28);
}

.requirement-badge.optional {
  background: #eef2f7;
  color: #475569;
  border: 1px solid rgba(71,85,105,0.16);
}

.step-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

@media (max-width: 768px) {
  .journal-header {
    flex-direction: column;
  }

  .cancel-journal-btn {
    align-self: flex-start;
  }

  .step-actions {
    align-items: stretch;
    flex-direction: column;
  }
}

:global(body.dark-mode) .journal-shell {
  background: #253244;
  border-color: rgba(255,255,255,0.1);
}

:global(body.dark-mode) .step-card {
  background: #2d3748;
  border-color: rgba(255,255,255,0.1);
}

:global(body.dark-mode) .section-heading p {
  color: #cbd5e1;
}

:global(body.dark-mode) .section-title {
  color: #f8fafc;
}

:global(body.dark-mode) .journal-header h1 {
  color: #f8fafc;
}

:global(body.dark-mode) .journal-header p {
  color: #cbd5e1;
}

:global(body.dark-mode) .cancel-journal-btn {
  background: rgba(127,29,29,0.28);
  color: #fecdd3;
  border-color: rgba(254,205,211,0.28);
}
</style>
