<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import AppStampFrame from '@/components/common/AppStampFrame.vue'
import DashboardSideNav from '@/components/dashboard/DashboardSideNav.vue'
import DashboardTravelTimeline from '@/components/dashboard/DashboardTravelTimeline.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import MainLayout from '@/layouts/MainLayout.vue'
import { deleteItinerary, getItineraries } from '@/services/itineraryService'
import {
  deleteJournal,
  getMyJournals,
  updateJournalVisibility
} from '@/services/journalService'
import { getSavedIslands } from '@/services/savedIslandService'
import { getSavedJournals } from '@/services/savedJournalService'
import { getMyAiIdentifications } from '@/services/wormsService'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { calculateExplorerProgress } from '@/utils/explorerProgress'

const authStore = useAuthStore()
const toastStore = useToastStore()
const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const loading = ref(true)
const error = ref('')

const journals = ref([])
const itineraries = ref([])
const savedIslands = ref([])
const savedJournals = ref([])
const aiIdentifications = ref([])
const journalActionIds = ref(new Set())
const itineraryActionIds = ref(new Set())

const panels = computed(() => [
  { id: 'overview', label: t('dashboard.myPassport'), icon: 'bi-grid' },
  { id: 'journeys', label: t('dashboard.travelTimeline'), icon: 'bi-journal-richtext' },
  { id: 'marine', label: t('dashboard.myMarineLife'), icon: 'bi-water' },
  { id: 'saved-islands', label: t('dashboard.savedIslands'), icon: 'bi-bookmark-heart' },
  { id: 'saved-journals', label: t('dashboard.savedJournals'), icon: 'bi-bookmark-star' },
  { id: 'badges', label: t('dashboard.badges'), icon: 'bi-award' }
])

const activePanel = ref(
  panels.value.some(panel => panel.id === route.query.view)
    ? route.query.view
    : 'overview'
)

watch(
  () => route.query.view,
  view => {
    activePanel.value = panels.value.some(panel => panel.id === view)
      ? view
      : 'overview'
  }
)

function setPanel(panelId) {
  activePanel.value = panelId
  router.replace({
    query: panelId === 'overview' ? {} : { view: panelId }
  })
}

function splitList(value) {
  if (!value) return []
  return value.split(',').map(item => item.trim()).filter(Boolean)
}

function formatDate(date) {
  if (!date) return t('dashboard.notDated')

  return new Date(date).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function formatMonth(date) {
  if (!date) return t('dashboard.undated')

  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric'
  })
}

function dateValue(date) {
  if (!date) return 0
  const parsed = new Date(date)
  return Number.isFinite(parsed.getTime()) ? parsed.getTime() : 0
}

function isPastTrip(entry) {
  if (!entry.end_date && !entry.start_date) return false

  const end = new Date(entry.end_date || entry.start_date)
  end.setHours(23, 59, 59, 999)

  return end.getTime() < Date.now()
}

function tripDays(journal) {
  if (!journal.start_date || !journal.end_date) return 0

  const start = new Date(journal.start_date)
  const end = new Date(journal.end_date)
  const days = Math.round((end - start) / 86400000) + 1

  return Number.isFinite(days) && days > 0 ? days : 0
}

function tripDaysFromDates(startDate, endDate) {
  if (!startDate || !endDate) return startDate ? 1 : 0

  const start = new Date(startDate)
  const end = new Date(endDate)
  const days = Math.round((end - start) / 86400000) + 1

  return Number.isFinite(days) && days > 0 ? days : 0
}

function coverFor(item) {
  return item.cover_image || item.island_cover_image || '/images/island-placeholder.jpg'
}

function datesOverlap(first, second) {
  const firstStart = dateValue(first.start_date || first.created_at)
  const firstEnd = dateValue(first.end_date || first.start_date || first.created_at)
  const secondStart = dateValue(second.start_date)
  const secondEnd = dateValue(second.end_date || second.start_date)

  if (!firstStart || !secondStart) return false

  return firstStart <= secondEnd && secondStart <= firstEnd
}

function matchesJournal(itinerary) {
  return journals.value.some(journal => {
    const sameIsland =
      journal.island_id && itinerary.island_id
        ? Number(journal.island_id) === Number(itinerary.island_id)
        : journal.island_name === itinerary.island_name

    return sameIsland && datesOverlap(journal, itinerary)
  })
}

function startJournalQuery(entry) {
  return {
    path: '/journal/create',
    query: {
      island_id: entry.island_id,
      start_date: entry.start_date,
      end_date: entry.end_date || entry.start_date,
      title: `${entry.island_name || entry.title} journal`
    }
  }
}

const displayName = computed(() => authStore.user?.username || t('dashboard.explorer'))

const recentJournals = computed(() => journals.value.slice(0, 3))

const unmatchedPlannedTrips = computed(() =>
  itineraries.value.filter(itinerary => !matchesJournal(itinerary))
)

const upcomingTrips = computed(() =>
  unmatchedPlannedTrips.value
    .filter(trip => !isPastTrip(trip))
    .slice(0, 3)
)

const readyToJournalTrips = computed(() =>
  unmatchedPlannedTrips.value
    .filter(trip => isPastTrip(trip))
    .slice(0, 3)
)

const totalMedia = computed(() =>
  journals.value.reduce((sum, journal) => sum + Number(journal.media_count || 0), 0)
)

const visitedCountries = computed(() =>
  new Set(journals.value.map(journal => journal.country).filter(Boolean)).size
)

const speciesChecklist = computed(() => {
  const map = new Map()

  journals.value.forEach(journal => {
    splitList(journal.species).forEach(species => {
      const current = map.get(species) || {
        name: species,
        count: 0,
        journals: []
      }

      current.count += 1
      current.journals.push(journal.title)
      map.set(species, current)
    })
  })

  return [...map.values()].sort((a, b) => b.count - a.count)
})

const aiSpeciesList = computed(() => {
  return aiIdentifications.value.map(item => ({
    ...item,
    displayName:
      item.accepted_name ||
      item.scientific_name ||
      item.common_name ||
      t('dashboard.unidentifiedSpecies'),
    scientificName: item.scientific_name || item.accepted_name,
    isVerified: item.taxonomy_status?.toLowerCase() === 'accepted'
  }))
})

const explorerProgress = computed(() =>
  calculateExplorerProgress({
    journals: journals.value,
    savedIslands: savedIslands.value,
    savedJournals: savedJournals.value,
    itineraries: itineraries.value,
    speciesChecklist: speciesChecklist.value,
    aiSpeciesList: aiSpeciesList.value,
    totalMedia: totalMedia.value,
    visitedCountries: visitedCountries.value,
    journalCount: journals.value.length,
    speciesCount: speciesChecklist.value.length,
    publicCount: journals.value.filter(journal => journal.visibility === 'public').length
  })
)

const badges = computed(() => explorerProgress.value.badges)
const unlockedBadges = computed(() => explorerProgress.value.unlockedCount)
const explorerLevel = computed(() => explorerProgress.value.tier)

const nextSteps = computed(() => {
  const steps = []

  if (readyToJournalTrips.value.length) {
    steps.push(t('dashboard.completedPlansReady', { count: readyToJournalTrips.value.length }))
  }

  if (speciesChecklist.value.length < 3) {
    steps.push(t('dashboard.moreSpeciesToUnlock', { count: 3 - speciesChecklist.value.length }))
  }

  if (!journals.value.some(journal => journal.visibility === 'public')) {
    steps.push(t('dashboard.publishPublicJournal'))
  }

  return steps.slice(0, 3)
})

const stats = computed(() => [
  {
    label: t('dashboard.journeys'),
    value: journals.value.length,
    note: t('dashboard.plannedCount', { count: unmatchedPlannedTrips.value.length }),
    icon: 'bi-compass',
    panel: 'journeys'
  },
  {
    label: t('dashboard.marineLife'),
    value: speciesChecklist.value.length + aiSpeciesList.value.length,
    note: t('dashboard.aiIdsCount', { count: aiSpeciesList.value.length }),
    icon: 'bi-water',
    panel: 'marine'
  },
  {
    label: t('dashboard.savedIslands'),
    value: savedIslands.value.length,
    note: t('dashboard.placesKept'),
    icon: 'bi-bookmark-heart',
    panel: 'saved-islands'
  },
  {
    label: t('dashboard.savedJournals'),
    value: savedJournals.value.length,
    note: t('dashboard.storiesSaved'),
    icon: 'bi-bookmark-star',
    panel: 'saved-journals'
  },
  {
    label: t('dashboard.badges'),
    value: unlockedBadges.value,
    note: t('dashboard.totalCount', { count: badges.value.length }),
    icon: 'bi-award',
    panel: 'badges'
  }
])

const travelTimeline = computed(() => {
  const completedTrips = journals.value.map(journal => ({
    ...journal,
    key: `journal-${journal.id}`,
    type: 'completed',
    statusLabel: t('dashboard.journal'),
    monthLabel: formatMonth(journal.start_date || journal.created_at),
    days: tripDays(journal),
    sortDate: dateValue(journal.start_date || journal.created_at)
  }))

  const plannedTrips = unmatchedPlannedTrips.value.map(itinerary => {
    const overdue = isPastTrip(itinerary)

    return {
      ...itinerary,
      key: `itinerary-${itinerary.id}`,
      type: overdue ? 'ready' : 'planned',
      statusLabel: overdue ? t('dashboard.readyToJournal') : t('dashboard.planned'),
      content:
        itinerary.notes ||
        t('dashboard.plannedActivitiesForTrip', { count: itinerary.item_count || 0 }),
      monthLabel: formatMonth(itinerary.start_date || itinerary.created_at),
      days: tripDaysFromDates(itinerary.start_date, itinerary.end_date),
      overdue,
      sortDate: dateValue(itinerary.start_date || itinerary.created_at)
    }
  })

  return [...plannedTrips, ...completedTrips].sort((a, b) => b.sortDate - a.sortDate)
})

function isJournalActionLoading(journalId) {
  return journalActionIds.value.has(`journal-${journalId}`)
}

function setJournalActionLoading(journalId, isLoading) {
  const nextIds = new Set(journalActionIds.value)
  const actionId = `journal-${journalId}`

  if (isLoading) nextIds.add(actionId)
  else nextIds.delete(actionId)

  journalActionIds.value = nextIds
}

const timelineActionIds = computed(() =>
  new Set([...journalActionIds.value, ...itineraryActionIds.value])
)

function isItineraryActionLoading(itineraryId) {
  return itineraryActionIds.value.has(`itinerary-${itineraryId}`)
}

function setItineraryActionLoading(itineraryId, isLoading) {
  const nextIds = new Set(itineraryActionIds.value)
  const actionId = `itinerary-${itineraryId}`

  if (isLoading) nextIds.add(actionId)
  else nextIds.delete(actionId)

  itineraryActionIds.value = nextIds
}

async function toggleJournalVisibility(journal) {
  if (isJournalActionLoading(journal.id)) return

  const nextVisibility = journal.visibility === 'public' ? 'private' : 'public'

  try {
    setJournalActionLoading(journal.id, true)
    await updateJournalVisibility(journal.id, nextVisibility)

    journals.value = journals.value.map(item =>
      item.id === journal.id
        ? { ...item, visibility: nextVisibility }
        : item
    )

    toastStore.success(
      nextVisibility === 'public'
        ? t('dashboard.journalNowPublic')
        : t('dashboard.journalNowPrivate')
    )
  } catch {
    toastStore.danger(t('dashboard.visibilityError'))
  } finally {
    setJournalActionLoading(journal.id, false)
  }
}

async function removeJournal(journal) {
  if (isJournalActionLoading(journal.id)) return

  const confirmed = window.confirm(t('dashboard.deleteJournalConfirm', { title: journal.title }))
  if (!confirmed) return

  try {
    setJournalActionLoading(journal.id, true)
    await deleteJournal(journal.id)

    journals.value = journals.value.filter(item => item.id !== journal.id)
    savedJournals.value = savedJournals.value.filter(item => item.id !== journal.id)

    toastStore.success(t('dashboard.journalDeleted'))
  } catch {
    toastStore.danger(t('dashboard.deleteJournalError'))
  } finally {
    setJournalActionLoading(journal.id, false)
  }
}

async function removeItinerary(itinerary) {
  if (isItineraryActionLoading(itinerary.id)) return

  const confirmed = window.confirm(t('dashboard.deleteTripConfirm', { title: itinerary.title }))
  if (!confirmed) return

  try {
    setItineraryActionLoading(itinerary.id, true)
    await deleteItinerary(itinerary.id)

    itineraries.value = itineraries.value.filter(item => item.id !== itinerary.id)

    toastStore.success(t('dashboard.tripDeleted'))
  } catch {
    toastStore.danger(t('dashboard.deleteTripError'))
  } finally {
    setItineraryActionLoading(itinerary.id, false)
  }
}

async function loadDashboard() {
  try {
    loading.value = true
    error.value = ''

    const [
      myJournalData,
      itineraryData,
      savedIslandData,
      savedJournalData,
      aiIdentificationData
    ] = await Promise.all([
      getMyJournals(),
      getItineraries(),
      getSavedIslands(),
      getSavedJournals(),
      getMyAiIdentifications()
    ])

    journals.value = myJournalData
    itineraries.value = itineraryData
    savedIslands.value = savedIslandData
    savedJournals.value = savedJournalData
    aiIdentifications.value = aiIdentificationData
  } catch {
    error.value = t('dashboard.loadError')
  } finally {
    loading.value = false
  }
}

onMounted(loadDashboard)
</script>

<template>
  <MainLayout>
    <main class="dashboard-page">
      <LoadingState v-if="loading" :message="t('dashboard.loading')" />

      <div v-else class="dashboard-shell">
        <div v-if="error" class="error-note">
          {{ error }}
        </div>

        <section class="dashboard-layout">
          <DashboardSideNav
            :panels="panels"
            :active-panel="activePanel"
            :display-name="displayName"
            :explorer-level="explorerLevel"
            @select="setPanel"
          />

          <div class="logbook-content">
            <section v-if="activePanel === 'overview'" class="overview-stack">
              <section class="welcome-card">
                <div>
                  <span class="eyebrow">{{ t('dashboard.myLogbook') }}</span>
                  <h1>{{ t('dashboard.welcomeBack', { name: displayName }) }}</h1>
                  <p>
                    {{ t('dashboard.welcomeIntro') }}
                  </p>

                  <div class="tier-summary">
                    <strong>{{ explorerLevel.name }}</strong>
                    <small>{{ t('dashboard.progressTo', { progress: explorerLevel.progress, next: explorerLevel.next }) }}</small>

                    <div class="tier-track">
                      <i :style="{ width: `${explorerLevel.progress}%` }"></i>
                    </div>
                  </div>
                </div>

                <RouterLink to="/journal/create" class="create-btn">
                  <i class="bi bi-plus-circle"></i>
                  {{ t('dashboard.createJournal') }}
                </RouterLink>
              </section>

              <section class="stats-grid">
                <button
                  v-for="stat in stats"
                  :key="stat.label"
                  type="button"
                  class="stat-card"
                  @click="setPanel(stat.panel)"
                >
                  <span class="stat-icon">
                    <i :class="`bi ${stat.icon}`"></i>
                  </span>

                  <strong>{{ stat.value }}</strong>
                  <span>{{ stat.label }}</span>
                  <small>{{ stat.note }}</small>
                </button>
              </section>

              <section v-if="nextSteps.length" class="next-steps-card">
                <div class="panel-heading compact">
                  <div>
                    <span>{{ t('dashboard.nextSteps') }}</span>
                    <h2>{{ t('dashboard.suggestedActions') }}</h2>
                  </div>
                </div>

                <div class="next-step-list">
                  <div
                    v-for="step in nextSteps"
                    :key="step"
                    class="next-step"
                  >
                    <i class="bi bi-stars"></i>
                    <span>{{ step }}</span>
                  </div>
                </div>
              </section>

              <section class="overview-grid">
                <div class="panel-block large">
                  <div class="panel-heading">
                    <div>
                      <span>{{ t('dashboard.recentJournals') }}</span>
                      <h2>{{ t('dashboard.latestStories') }}</h2>
                    </div>

                    <button type="button" class="plain-link" @click="setPanel('journeys')">
                      {{ t('dashboard.viewTimeline') }}
                    </button>
                  </div>

                  <div v-if="recentJournals.length" class="journal-list">
                    <article
                      v-for="journal in recentJournals"
                      :key="journal.id"
                      class="journal-card"
                    >
                      <AppStampFrame
                        class="journal-thumb"
                        :image="coverFor(journal)"
                        :alt="journal.title || t('dashboard.journalCover')"
                        @error="$event.target.src = '/images/island-placeholder.jpg'"
                      />

                      <div>
                        <small>{{ journal.island_name }} • {{ formatDate(journal.start_date || journal.created_at) }}</small>
                        <h3>{{ journal.title }}</h3>
                        <p>{{ journal.content || t('dashboard.noStoryWritten') }}</p>
                      </div>

                      <RouterLink :to="`/journal/${journal.id}`" class="circle-link">
                        <i class="bi bi-arrow-right"></i>
                      </RouterLink>
                    </article>
                  </div>

                  <div v-else class="empty-note">
                    {{ t('dashboard.noJournalsYet') }}
                  </div>
                </div>

                <div class="side-stack">
                  <div class="panel-block">
                    <div class="panel-heading compact">
                      <div>
                        <span>{{ t('dashboard.readyToWrite') }}</span>
                        <h2>{{ t('dashboard.completedPlans') }}</h2>
                      </div>
                    </div>

                    <div v-if="readyToJournalTrips.length" class="mini-list">
                      <RouterLink
                        v-for="trip in readyToJournalTrips"
                        :key="trip.id"
                        :to="startJournalQuery(trip)"
                        class="mini-row"
                      >
                        <i class="bi bi-pencil-square"></i>
                        <div>
                          <strong>{{ trip.island_name || trip.title }}</strong>
                          <small>{{ formatDate(trip.start_date) }}</small>
                        </div>
                      </RouterLink>
                    </div>

                    <div v-else class="empty-note">
                      {{ t('dashboard.noCompletedPlans') }}
                    </div>
                  </div>

                  <div class="panel-block">
                    <div class="panel-heading compact">
                      <div>
                        <span>{{ t('dashboard.saved') }}</span>
                        <h2>{{ t('dashboard.forLater') }}</h2>
                      </div>
                    </div>

                    <div class="saved-split">
                      <button type="button" @click="setPanel('saved-islands')">
                        <i class="bi bi-bookmark-heart"></i>
                        <strong>{{ savedIslands.length }}</strong>
                        <span>{{ t('dashboard.islands') }}</span>
                      </button>

                      <button type="button" @click="setPanel('saved-journals')">
                        <i class="bi bi-bookmark-star"></i>
                        <strong>{{ savedJournals.length }}</strong>
                        <span>{{ t('dashboard.journals') }}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </section>

            <section v-else-if="activePanel === 'journeys'" class="content-panel">
              <div class="panel-heading">
                <div>
                  <span>{{ t('dashboard.travelTimeline') }}</span>
                  <h2>{{ t('dashboard.plannedAndCompleted') }}</h2>
                </div>

                <RouterLink to="/journal/create" class="mini-link">
                  {{ t('dashboard.createJournal') }}
                </RouterLink>
              </div>

              <DashboardTravelTimeline
                v-if="travelTimeline.length"
                :entries="travelTimeline"
                :action-ids="timelineActionIds"
                @toggle-visibility="toggleJournalVisibility"
                @remove-journal="removeJournal"
                @remove-itinerary="removeItinerary"
              />
              <div v-else class="empty-note">
                {{ t('dashboard.emptyTimeline') }}
              </div>
            </section>

            <section v-else-if="activePanel === 'marine'" class="content-panel">
              <div class="panel-heading">
                <div>
                  <span>{{ t('dashboard.myMarineLife') }}</span>
                  <h2>{{ t('dashboard.sightingsChecklist') }}</h2>
                </div>
              </div>

              <div class="marine-sections">
                <section>
                  <div class="subsection-heading">
                    <span>{{ t('dashboard.confirmedSightings') }}</span>
                    <small>{{ t('dashboard.speciesCount', { count: speciesChecklist.length }) }}</small>
                  </div>

                  <div v-if="speciesChecklist.length" class="marine-grid">
                    <article
                      v-for="species in speciesChecklist"
                      :key="species.name"
                      class="marine-card"
                    >
                      <span class="marine-icon">
                        <i class="bi bi-check2"></i>
                      </span>

                      <div>
                        <h3>{{ species.name }}</h3>
                        <p>{{ t('dashboard.seenInJournals', { count: species.count }) }}</p>
                      </div>
                    </article>
                  </div>

                  <div v-else class="empty-note">
                    {{ t('dashboard.noMarineSightings') }}
                  </div>
                </section>

                <section>
                  <div class="subsection-heading">
                    <span>{{ t('dashboard.aiIdentifiedSpecies') }}</span>
                    <small>{{ t('dashboard.savedCount', { count: aiSpeciesList.length }) }}</small>
                  </div>

                  <div v-if="aiSpeciesList.length" class="ai-id-grid">
                    <article
                      v-for="item in aiSpeciesList"
                      :key="item.id"
                      class="ai-id-card"
                    >
                      <img
                        v-if="item.image_url"
                        :src="item.image_url"
                        :alt="t('dashboard.aiPhotoAlt', { name: item.displayName })"
                      />

                      <span v-else class="ai-id-placeholder">
                        <i class="bi bi-stars"></i>
                      </span>

                      <div>
                        <div class="ai-id-title">
                          <h3>{{ item.displayName }}</h3>

                          <span :class="{ verified: item.isVerified }">
                            <i v-if="item.isVerified" class="bi bi-check-lg"></i>
                            {{ item.isVerified ? t('dashboard.verified') : item.taxonomy_status || t('dashboard.pending') }}
                          </span>
                        </div>

                        <p>{{ item.scientificName || t('dashboard.scientificNameUnavailable') }}</p>
                        <small>{{ item.confidence || t('dashboard.confidenceNotStated') }} • {{ formatDate(item.created_at) }}</small>
                      </div>
                    </article>
                  </div>

                  <div v-else class="empty-note">
                    {{ t('dashboard.noAiSpecies') }}
                  </div>
                </section>
              </div>
            </section>

            <section v-else-if="activePanel === 'saved-islands'" class="content-panel">
              <div class="panel-heading">
                <div>
                  <span>{{ t('dashboard.savedIslands') }}</span>
                  <h2>{{ t('dashboard.placesYouKept') }}</h2>
                </div>

                <RouterLink to="/discovery" class="mini-link">
                  {{ t('dashboard.exploreMore') }}
                </RouterLink>
              </div>

              <div v-if="savedIslands.length" class="island-grid">
                <RouterLink
                  v-for="island in savedIslands"
                  :key="island.id"
                  :to="`/discovery/island/${island.id}`"
                  class="saved-island-card"
                >
                  <AppStampFrame
                    class="saved-island-stamp"
                    :image="island.cover_image || '/images/island-placeholder.jpg'"
                    :alt="island.name || t('dashboard.savedIsland')"
                    :contain="false"
                    @error="$event.target.src = '/images/island-placeholder.jpg'"
                  />

                  <strong>{{ island.name }}</strong>
                  <span>{{ island.country }}</span>
                </RouterLink>
              </div>

              <div v-else class="empty-note">
                {{ t('dashboard.noSavedIslands') }}
              </div>
            </section>

            <section v-else-if="activePanel === 'saved-journals'" class="content-panel">
              <div class="panel-heading">
                <div>
                  <span>{{ t('dashboard.savedJournals') }}</span>
                  <h2>{{ t('dashboard.storiesYouKept') }}</h2>
                </div>
              </div>

              <div v-if="savedJournals.length" class="journal-list">
                <article
                  v-for="journal in savedJournals"
                  :key="journal.id"
                  class="journal-card"
                >
                  <AppStampFrame
                    class="journal-thumb"
                    :image="coverFor(journal)"
                    :alt="journal.title || t('dashboard.savedJournal')"
                    @error="$event.target.src = '/images/island-placeholder.jpg'"
                  />

                  <div>
                    <small>{{ journal.island_name }} • {{ formatDate(journal.start_date || journal.created_at) }}</small>
                    <h3>{{ journal.title }}</h3>
                    <p>{{ journal.content || t('dashboard.noPreview') }}</p>
                  </div>

                  <RouterLink :to="`/journal/${journal.id}`" class="circle-link">
                    <i class="bi bi-arrow-right"></i>
                  </RouterLink>
                </article>
              </div>

              <div v-else class="empty-note">
                {{ t('dashboard.noSavedJournals') }}
              </div>
            </section>

            <section v-else-if="activePanel === 'badges'" class="content-panel">
              <div class="panel-heading">
                <div>
                  <span>{{ t('dashboard.badgesAchievements') }}</span>
                  <h2>{{ t('dashboard.achievements') }}</h2>
                </div>

                <strong class="badge-count">
                  {{ t('dashboard.earnedCount', { unlocked: unlockedBadges, total: badges.length }) }}
                </strong>
              </div>

              <div class="badge-grid">
                <article
                  v-for="badge in badges"
                  :key="badge.id"
                  class="badge-card"
                  :class="{ unlocked: badge.unlocked }"
                >
                  <span>
                    <i :class="`bi ${badge.icon}`"></i>
                  </span>

                  <h3>{{ badge.title }}</h3>
                  <p>{{ badge.detail }}</p>
                  <small>{{ badge.unlocked ? t('dashboard.unlocked') : t('dashboard.keepExploring') }}</small>
                </article>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  </MainLayout>
</template>

<style scoped>
.dashboard-page {
  min-height: calc(100vh - 80px);
  padding: 34px 0 46px;
  background:
    radial-gradient(circle at top left, rgba(169, 216, 214, 0.32), transparent 34%),
    linear-gradient(180deg, #fffdf8 0%, #f7efe2 100%);
}

.dashboard-shell {
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
}

.dashboard-layout {
  display: grid;
  grid-template-columns: 250px minmax(0, 1fr);
  align-items: start;
  gap: 18px;
}

.content-panel,
.welcome-card,
.next-steps-card,
.panel-block {
  border: 1px solid #eadfca;
  border-radius: 22px;
  background: rgba(255, 253, 248, 0.92);
  box-shadow: 0 16px 34px rgba(47, 72, 88, 0.08);
}

.logbook-content {
  min-width: 0;
}

.overview-stack {
  display: grid;
  gap: 18px;
}

.welcome-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 20px;
  align-items: center;
  padding: 28px;
  overflow: hidden;
  background:
    radial-gradient(circle at top right, rgba(245, 169, 142, 0.24), transparent 34%),
    linear-gradient(135deg, rgba(255, 253, 248, 0.96), rgba(222, 239, 236, 0.72));
}

.eyebrow,
.panel-heading span {
  color: #1897a0;
  font-size: 0.76rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.welcome-card h1,
.panel-heading h2 {
  margin: 6px 0;
  color: #2f4858;
  font-weight: 900;
}

.welcome-card p,
.empty-note {
  margin: 0;
  color: #64748b;
}

.tier-summary {
  max-width: 420px;
  margin-top: 18px;
  padding: 14px;
  border: 1px dashed rgba(24, 151, 160, 0.32);
  border-radius: 16px;
  background: rgba(255, 253, 248, 0.72);
}

.tier-summary strong,
.tier-summary small {
  display: block;
}

.tier-summary strong {
  color: #2f4858;
}

.tier-summary small {
  color: #64748b;
  font-weight: 700;
}

.tier-track {
  height: 8px;
  margin-top: 9px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(24, 151, 160, 0.16);
}

.tier-track i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #f5a98e;
}

.create-btn,
.mini-link,
.open-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid #1897a0;
  border-radius: 999px;
  background: #1897a0;
  color: #fff;
  font-family: inherit;
  font-weight: 800;
  text-decoration: none;
}

.create-btn {
  padding: 12px 18px;
}

.mini-link,
.open-btn {
  padding: 8px 14px;
  font-size: 0.82rem;
}

.create-btn:hover,
.mini-link:hover,
.open-btn:hover {
  background: #147d84;
  color: #fff;
}

.plain-link {
  border: none;
  background: transparent;
  color: #1897a0;
  font-weight: 900;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.stat-card {
  display: grid;
  gap: 3px;
  text-align: left;
  border: 1px solid #eadfca;
  border-radius: 18px;
  padding: 16px;
  background: #fffdf8;
  box-shadow: 0 10px 24px rgba(47, 72, 88, 0.06);
}

.stat-card:hover {
  border-color: #1897a0;
}

.stat-icon {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  margin-bottom: 7px;
  border-radius: 50%;
  background: #deefec;
  color: #1897a0;
}

.stat-card strong {
  color: #2f4858;
  font-size: 1.65rem;
  line-height: 1;
}

.stat-card span {
  color: #2f4858;
  font-weight: 900;
}

.stat-card small {
  color: #64748b;
}

.next-steps-card,
.content-panel,
.panel-block {
  padding: 22px;
}

.next-step-list {
  display: grid;
  gap: 10px;
}

.next-step {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #2f4858;
  font-weight: 800;
}

.next-step i {
  color: #f5a98e;
}

.overview-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) 320px;
  gap: 18px;
}

.side-stack {
  display: grid;
  gap: 18px;
}

.panel-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}

.panel-heading.compact {
  margin-bottom: 12px;
}

.panel-heading.compact h2 {
  font-size: 1rem;
}

.journal-list {
  display: grid;
  gap: 12px;
}

.journal-card {
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr) 36px;
  gap: 14px;
  align-items: center;
  padding: 12px;
  border: 1px solid #eadfca;
  border-radius: 18px;
  background: rgba(255, 253, 248, 0.92);
}

.journal-thumb {
  aspect-ratio: 1.1;
  --stamp-radius: 5px;
  --stamp-size: 14px;
}

.journal-card small,
.journal-card p,
.marine-card p,
.ai-id-card p,
.ai-id-card small,
.saved-island-card span,
.badge-card p,
.badge-card small {
  color: #64748b;
}

.journal-card h3,
.marine-card h3,
.ai-id-card h3,
.saved-island-card strong,
.badge-card h3 {
  margin: 4px 0;
  color: #2f4858;
  font-family: 'Poppins', sans-serif;
  font-size: 1rem;
  font-weight: 900;
}

.journal-card p {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.circle-link {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #deefec;
  color: #1897a0;
  text-decoration: none;
}

.mini-list {
  display: grid;
  gap: 10px;
}

.mini-row {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  padding: 10px;
  border: 1px solid #eadfca;
  border-radius: 14px;
  color: inherit;
  text-decoration: none;
}

.mini-row i {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #deefec;
  color: #1897a0;
}

.mini-row strong,
.mini-row small {
  display: block;
}

.mini-row strong {
  color: #2f4858;
  font-size: 0.9rem;
}

.mini-row small {
  color: #64748b;
  font-size: 0.78rem;
}

.saved-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.saved-split button {
  display: grid;
  gap: 4px;
  justify-items: start;
  border: 1px solid #eadfca;
  border-radius: 16px;
  padding: 14px;
  background: #fffdf8;
}

.saved-split i {
  color: #1897a0;
  font-size: 1.2rem;
}

.saved-split strong {
  color: #2f4858;
  font-size: 1.45rem;
}

.saved-split span {
  color: #64748b;
  font-weight: 800;
}

/* Marine, saved, badges */
.marine-sections {
  display: grid;
  gap: 26px;
}

.subsection-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px dashed #d8cdbb;
}

.subsection-heading span {
  color: #2f4858;
  font-weight: 900;
}

.subsection-heading small {
  color: #8c7250;
  font-weight: 800;
}

.marine-grid,
.ai-id-grid,
.badge-grid,
.island-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.ai-id-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.marine-card,
.ai-id-card,
.badge-card,
.saved-island-card {
  border: 1px solid #eadfca;
  border-radius: 18px;
  background: #fffdf8;
  text-decoration: none;
}

.marine-card {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 16px;
}

.marine-icon,
.badge-card span {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 50%;
  background: #deefec;
  color: #1897a0;
}

.ai-id-card {
  display: grid;
  grid-template-columns: 86px minmax(0, 1fr);
  gap: 14px;
  align-items: center;
  padding: 12px;
}

.ai-id-card img,
.ai-id-placeholder {
  width: 86px;
  aspect-ratio: 1;
  border-radius: 14px;
  object-fit: cover;
  background: #deefec;
}

.ai-id-placeholder {
  display: grid;
  place-items: center;
  color: #1897a0;
  font-size: 1.5rem;
}

.ai-id-title {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.ai-id-title span {
  flex: 0 0 auto;
  color: #8c7250;
  font-size: 0.72rem;
  font-weight: 900;
}

.ai-id-title span.verified {
  color: #20856d;
}

.ai-id-card p {
  margin: 0 0 4px;
}

.island-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.saved-island-card {
  display: grid;
  gap: 8px;
  padding: 12px;
  color: inherit;
}

.saved-island-stamp {
  aspect-ratio: 1.15;
  --stamp-radius: 5px;
  --stamp-size: 16px;
}

.badge-count {
  color: #1897a0;
}

.badge-card {
  padding: 18px;
  opacity: 0.55;
}

.badge-card.unlocked {
  opacity: 1;
  border-color: rgba(24, 151, 160, 0.34);
  box-shadow: 0 0 0 4px rgba(24, 151, 160, 0.08);
}

.badge-card.unlocked small {
  color: #1897a0;
  font-weight: 900;
}

.error-note {
  margin-bottom: 18px;
  padding: 14px 16px;
  border: 1px solid #f1b9b9;
  border-radius: 14px;
  background: #fff1f1;
  color: #9f2f2f;
  font-weight: 700;
}

@media (max-width: 1100px) {
  .stats-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

}

@media (max-width: 991px) {
  .dashboard-layout {
    grid-template-columns: 1fr;
  }

  .overview-grid {
    grid-template-columns: 1fr;
  }

  .marine-grid,
  .ai-id-grid,
  .badge-grid,
  .island-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .dashboard-shell {
    width: min(100% - 20px, 1180px);
  }

  .welcome-card {
    grid-template-columns: 1fr;
    padding: 20px;
  }

  .stats-grid,
  .marine-grid,
  .ai-id-grid,
  .badge-grid,
  .island-grid {
    grid-template-columns: 1fr;
  }

  .journal-card {
    grid-template-columns: 78px minmax(0, 1fr);
  }

  .journal-card .circle-link {
    grid-column: 1 / -1;
    justify-self: end;
  }

  .saved-split {
    grid-template-columns: 1fr;
  }
}
</style>


