<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

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

import { createJournal } from '@/services/journalService'
import { getIslands } from '@/services/islandService'
import { getSpecies } from '@/services/speciesService'
import { getActivities } from '@/services/activityService'

const router = useRouter()
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

function validateCurrentStep() {
  if (step.value === 1 && (!form.value.island_id || !form.value.title)) {
    toastStore.danger('Please choose an island and add a journal title.')
    return false
  }

  if (step.value === 2 && !form.value.content.trim()) {
    toastStore.danger('Please write your story before continuing.')
    return false
  }

  if (step.value === 4 && !form.value.media.length) {
    toastStore.danger('Please upload at least one photo or video before arranging.')
    return false
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

async function loadData() {
  try {
    islands.value = await getIslands()
    speciesList.value = await getSpecies()
    activities.value = await getActivities()
  } catch {
    errorMessage.value = 'Failed to load journal form data.'
  }
}

async function handleSubmit() {
  try {
    if (!form.value.coverImage) {
      toastStore.danger('Please choose a cover before publishing.')
      return
    }

    loading.value = true
    errorMessage.value = ''

    const payload = {
      island_id: form.value.island_id,
      title: form.value.title,
      content: form.value.content,
      cover_image: form.value.coverImage?.dataUrl || '',
      start_date: formatDateForMySQL(form.value.trip_dates?.[0]),
      end_date: formatDateForMySQL(form.value.trip_dates?.[1]),
      mood: form.value.mood,
      visibility: form.value.is_public ? 'public' : 'private',
      layout_items: form.value.layoutItems,

      activities: form.value.timeline
        .filter(item => item.activity_id || item.custom_activity_name || item.notes)
        .map(item => ({
          activity_id: item.activity_id || null,
          custom_activity_name: item.custom_activity_name || null,
          day_number: item.day_number || null,
          activity_time: item.activity_time || null,
          notes: item.notes || null
        })),

      sightings: form.value.sightings
        .filter(item => item.species_id || item.custom_species_name)
        .map(item => ({
          species_id: item.species_id || null,
          custom_species_name: item.custom_species_name || null,
          quantity: item.quantity || 1,
          notes: item.notes || null
        })),

      media: form.value.media.map((item, index) => ({
        media_url: item.dataUrl,
        media_type: item.media_type,
        caption: item.caption,

        activity_id:
          item.link_type === 'activity'
            ? item.activity_id || null
            : null,

        custom_activity_name:
          item.link_type === 'activity'
            ? item.custom_activity_name || null
            : null,

        species_id:
          item.link_type === 'species'
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
            <span>Logbook Entry</span>
            <h1>Document your island adventure</h1>
            <p>Build a scrapbook-style travel journal with dates, media, activities, marine sightings, and your own arranged memory board.</p>
          </div>

          <JournalStepIndicator
            v-model:step="step"
            :max-step="maxStep"
          />

          <div v-if="step === 1" class="step-card">
            <div class="row g-4">
              <div class="col-12 col-lg-6">
                <IslandMapPicker
                  v-model="form.island_id"
                  :islands="islands"
                />
              </div>

              <div class="col-12 col-lg-6">
                <label class="form-label fw-bold">Journal Title</label>
                <input v-model="form.title" class="form-control mb-3" placeholder="Swimming with turtles at Sipadan..." />

              <AppDateRangePicker
                v-model="form.trip_dates"
                label="Trip Duration"
              />
              </div>
            </div>

            <div class="step-actions mt-4">
              <RouterLink to="/community" class="btn btn-outline-primary">
                Cancel
              </RouterLink>
              <button class="btn btn-primary" @click="nextStep">
                Continue
              </button>
            </div>
          </div>

          <div v-if="step === 2" class="step-card">
            <MoodSelector v-model="form.mood" />

            <label class="form-label fw-bold mt-4">Your Story</label>
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
  color: #64748b;
  margin: 0;
}

.step-card {
  background: #fffdf8;
  border: 1px solid #eadfca;
  border-radius: 24px;
  padding: 26px;
}

.step-actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

:global(body.dark-mode) .journal-shell {
  background: #253244;
  border-color: rgba(255,255,255,0.1);
}

:global(body.dark-mode) .step-card {
  background: #2d3748;
  border-color: rgba(255,255,255,0.1);
}

:global(body.dark-mode) .journal-header h1 {
  color: #f8fafc;
}

:global(body.dark-mode) .journal-header p {
  color: #cbd5e1;
}
</style>
