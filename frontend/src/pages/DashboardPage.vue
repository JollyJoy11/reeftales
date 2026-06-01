<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppStampFrame from '@/components/common/AppStampFrame.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import MainLayout from '@/layouts/MainLayout.vue'
import { getItineraries } from '@/services/itineraryService'
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

const loading = ref(true)
const error = ref('')

const journals = ref([])
const itineraries = ref([])
const savedIslands = ref([])
const savedJournals = ref([])
const aiIdentifications = ref([])
const journalActionIds = ref(new Set())

const panels = [
  { id: 'overview', label: 'My Passport', icon: 'bi-passport' },
  { id: 'journeys', label: 'Travel Timeline', icon: 'bi-journal-richtext' },
  { id: 'marine', label: 'My Marine Life', icon: 'bi-water' },
  { id: 'saved-islands', label: 'Saved Islands', icon: 'bi-bookmark-heart' },
  { id: 'saved-journals', label: 'Saved Journals', icon: 'bi-bookmark-star' },
  { id: 'badges', label: 'Badges', icon: 'bi-award' }
]

const activePanel = ref(
  panels.some(panel => panel.id === route.query.view)
    ? route.query.view
    : 'overview'
)

watch(
  () => route.query.view,
  view => {
    activePanel.value = panels.some(panel => panel.id === view)
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
  if (!date) return 'Not dated'

  return new Date(date).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function formatMonth(date) {
  if (!date) return 'Undated'

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

function coverFor(journal) {
  return journal.cover_image || journal.island_cover_image || '/images/island-placeholder.jpg'
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

const displayName = computed(() => authStore.user?.username || 'Explorer')

const explorerId = computed(() => {
  const rawId = authStore.user?.id || authStore.user?.user_id || '0000'
  return `CC-${String(rawId).padStart(6, '0')}`
})

const homeBase = computed(() => {
  return authStore.user?.location || authStore.user?.home_base || 'Malaysia'
})

const joinedSince = computed(() => {
  const joinDate =
    authStore.user?.created_at ||
    journals.value[journals.value.length - 1]?.created_at

  return joinDate ? formatMonth(joinDate) : 'Recently'
})

const recentJournals = computed(() => journals.value.slice(0, 3))

const unmatchedPlannedTrips = computed(() =>
  itineraries.value.filter(itinerary => !matchesJournal(itinerary))
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
      'Unidentified species',
    scientificName: item.scientific_name || item.accepted_name,
    isVerified: item.taxonomy_status?.toLowerCase() === 'accepted'
  }))
})

const explorerProgress = computed(() =>
  calculateExplorerProgress({
    journals: journals.value,
    savedIslands: savedIslands.value,
    savedJournals: savedJournals.value,
    speciesChecklist: speciesChecklist.value,
    aiSpeciesList: aiSpeciesList.value,
    totalMedia: totalMedia.value,
    visitedCountries: visitedCountries.value
  })
)

const badges = computed(() => explorerProgress.value.badges)
const unlockedBadges = computed(() => explorerProgress.value.unlockedCount)
const explorerLevel = computed(() => explorerProgress.value.tier)

const visitedIslandNames = computed(() => {
  return [...new Set(journals.value.map(journal => journal.island_name).filter(Boolean))]
})

const passportStamps = computed(() => {
  const completed = visitedIslandNames.value.map(name => ({
    label: name,
    type: 'completed'
  }))

  const planned = unmatchedPlannedTrips.value
    .slice(0, 4)
    .map(trip => ({
      label: trip.island_name || trip.title,
      type: 'planned'
    }))

  return [...completed, ...planned].slice(0, 12)
})

const travelTimeline = computed(() => {
  const completedTrips = journals.value.map(journal => ({
    ...journal,
    key: `journal-${journal.id}`,
    type: 'completed',
    statusLabel: 'Completed',
    monthLabel: formatMonth(journal.start_date || journal.created_at),
    days: tripDays(journal),
    sortDate: dateValue(journal.start_date || journal.created_at)
  }))

  const plannedTrips = unmatchedPlannedTrips.value.map(itinerary => {
    const overdue = isPastTrip(itinerary)

    return {
      ...itinerary,
      key: `itinerary-${itinerary.id}`,
      type: 'planned',
      statusLabel: overdue ? 'Ready to journal' : 'Planned',
      mood: overdue ? 'waiting for story' : 'upcoming',
      sighting_count: 0,
      content:
        itinerary.notes ||
        `${itinerary.item_count || 0} planned activit${Number(itinerary.item_count) === 1 ? 'y' : 'ies'} for this trip.`,
      monthLabel: formatMonth(itinerary.start_date || itinerary.created_at),
      days: tripDaysFromDates(itinerary.start_date, itinerary.end_date),
      overdue,
      sortDate: dateValue(itinerary.start_date || itinerary.created_at)
    }
  })

  return [...plannedTrips, ...completedTrips].sort((a, b) => b.sortDate - a.sortDate)
})

function isJournalActionLoading(journalId) {
  return journalActionIds.value.has(journalId)
}

function setJournalActionLoading(journalId, isLoading) {
  const nextIds = new Set(journalActionIds.value)

  if (isLoading) {
    nextIds.add(journalId)
  } else {
    nextIds.delete(journalId)
  }

  journalActionIds.value = nextIds
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
        ? 'Journal is now public.'
        : 'Journal is now private.'
    )
  } catch {
    toastStore.danger('Unable to update journal visibility.')
  } finally {
    setJournalActionLoading(journal.id, false)
  }
}

async function removeJournal(journal) {
  if (isJournalActionLoading(journal.id)) return

  const confirmed = window.confirm(`Delete "${journal.title}"? This cannot be undone.`)

  if (!confirmed) return

  try {
    setJournalActionLoading(journal.id, true)
    await deleteJournal(journal.id)

    journals.value = journals.value.filter(item => item.id !== journal.id)
    savedJournals.value = savedJournals.value.filter(item => item.id !== journal.id)

    toastStore.success('Journal deleted.')
  } catch {
    toastStore.danger('Unable to delete journal.')
  } finally {
    setJournalActionLoading(journal.id, false)
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
    error.value = 'Unable to load your logbook right now.'
  } finally {
    loading.value = false
  }
}

onMounted(loadDashboard)
</script>

<template>
  <MainLayout>
    <main class="dashboard-page">
      <LoadingState v-if="loading" message="Loading your explorer passport..." />

      <div v-else class="dashboard-shell">
        <div v-if="error" class="error-note">
          {{ error }}
        </div>

        <section v-if="false" class="passport-book overview-passport">
          <div class="passport-cover">
            <div>
              <span>Coral Chronicle</span>
              <h1>Explorer Passport</h1>
              <p>{{ explorerLevel.name }} — {{ homeBase }}</p>
            </div>

            <div class="passport-anchor">
              <i class="bi bi-anchor"></i>
            </div>
          </div>

          <div class="passport-body">
            <aside class="passport-profile">
              <div class="passport-photo">
                <i class="bi bi-person"></i>
              </div>

              <strong>{{ displayName }}</strong>
              <span>Signature</span>

              <div class="badge-dots" aria-label="Badges earned">
                <i
                  v-for="badge in badges"
                  :key="badge.id"
                  :class="{ earned: badge.unlocked }"
                ></i>
              </div>

              <small>{{ unlockedBadges }} / {{ badges.length }} badges earned</small>
            </aside>

            <section class="passport-info">
              <div class="passport-details">
                <div>
                  <span>Full Name</span>
                  <strong>{{ displayName }}</strong>
                </div>

                <div>
                  <span>Explorer ID</span>
                  <strong>{{ explorerId }}</strong>
                </div>

                <div>
                  <span>Joined Since</span>
                  <strong>{{ joinedSince }}</strong>
                </div>

                <div>
                  <span>Home Base</span>
                  <strong>{{ homeBase }}</strong>
                </div>

                <div>
                  <span>Total Journeys</span>
                  <strong>{{ journals.length }} journeys</strong>
                </div>

                <div>
                  <span>Journal Entries</span>
                  <strong>{{ journals.length }} entries</strong>
                </div>
              </div>

              <div class="tier-card">
                <span class="tier-icon">
                  <i class="bi bi-award"></i>
                </span>

                <div>
                  <h2>{{ explorerLevel.name }}</h2>
                  <p>{{ explorerLevel.progress }}% progress to {{ explorerLevel.next }}</p>

                  <div class="tier-track">
                    <i :style="{ width: `${explorerLevel.progress}%` }"></i>
                  </div>
                </div>
              </div>

              <div class="island-stamps">
                <div class="section-label">
                  <span>Islands visited / planned</span>
                </div>

                <div class="stamp-list">
                  <span
                    v-for="stamp in passportStamps"
                    :key="`${stamp.type}-${stamp.label}`"
                    :class="{ planned: stamp.type === 'planned' }"
                  >
                    {{ stamp.label }}
                  </span>

                  <span v-if="!passportStamps.length" class="empty-stamp">
                    No island stamps yet
                  </span>
                </div>
              </div>
            </section>
          </div>

          <div class="passport-footer">
            <span>CC&lt;MYS&lt;{{ displayName.replaceAll(' ', '&lt;').toUpperCase() }}</span>
            <RouterLink to="/journal/create" class="create-btn">
              <i class="bi bi-plus-circle"></i>
              Create journal
            </RouterLink>
          </div>
        </section>

        <section class="dashboard-layout">
          <aside class="logbook-nav">
            <button
              v-for="panel in panels"
              :key="panel.id"
              type="button"
              class="logbook-tab"
              :class="{ active: activePanel === panel.id }"
              @click="setPanel(panel.id)"
            >
              <i :class="`bi ${panel.icon}`"></i>
              {{ panel.label }}
            </button>
          </aside>

          <div class="logbook-content">
            <section v-if="activePanel === 'overview'" class="content-panel passport-panel">
              <section class="passport-book">
                <div class="passport-cover">
                  <div>
                    <span>Coral Chronicle</span>
                    <h1>Explorer Passport</h1>
                    <p>{{ explorerLevel.name }} - {{ homeBase }}</p>
                  </div>

                  <div class="passport-anchor">
                    <i class="bi bi-anchor"></i>
                  </div>
                </div>

                <div class="passport-body">
                  <aside class="passport-profile">
                    <div class="passport-photo">
                      <i class="bi bi-person"></i>
                    </div>

                    <strong>{{ displayName }}</strong>
                    <span>Signature</span>

                    <div class="badge-dots" aria-label="Badges earned">
                      <i
                        v-for="badge in badges"
                        :key="badge.id"
                        :class="{ earned: badge.unlocked }"
                      ></i>
                    </div>

                    <small>{{ unlockedBadges }} / {{ badges.length }} badges earned</small>
                  </aside>

                  <section class="passport-info">
                    <div class="passport-details">
                      <div>
                        <span>Full Name</span>
                        <strong>{{ displayName }}</strong>
                      </div>

                      <div>
                        <span>Explorer ID</span>
                        <strong>{{ explorerId }}</strong>
                      </div>

                      <div>
                        <span>Joined Since</span>
                        <strong>{{ joinedSince }}</strong>
                      </div>

                      <div>
                        <span>Home Base</span>
                        <strong>{{ homeBase }}</strong>
                      </div>

                      <div>
                        <span>Total Journeys</span>
                        <strong>{{ journals.length }} journeys</strong>
                      </div>

                      <div>
                        <span>Journal Entries</span>
                        <strong>{{ journals.length }} entries</strong>
                      </div>
                    </div>

                    <div class="tier-card">
                      <span class="tier-icon">
                        <i class="bi bi-award"></i>
                      </span>

                      <div>
                        <h2>{{ explorerLevel.name }}</h2>
                        <p>{{ explorerLevel.progress }}% progress to {{ explorerLevel.next }}</p>

                        <div class="tier-track">
                          <i :style="{ width: `${explorerLevel.progress}%` }"></i>
                        </div>
                      </div>
                    </div>

                    <div class="island-stamps">
                      <div class="section-label">
                        <span>Islands visited / planned</span>
                      </div>

                      <div class="stamp-list">
                        <span
                          v-for="stamp in passportStamps"
                          :key="`${stamp.type}-${stamp.label}`"
                          :class="{ planned: stamp.type === 'planned' }"
                        >
                          {{ stamp.label }}
                        </span>

                        <span v-if="!passportStamps.length" class="empty-stamp">
                          No island stamps yet
                        </span>
                      </div>
                    </div>
                  </section>
                </div>

                <div class="passport-footer">
                  <span>CC&lt;MYS&lt;{{ displayName.replaceAll(' ', '&lt;').toUpperCase() }}</span>
                  <RouterLink to="/journal/create" class="create-btn">
                    <i class="bi bi-plus-circle"></i>
                    Create journal
                  </RouterLink>
                </div>
              </section>

              <template v-if="false">
              <div class="panel-block wide">
                <div class="panel-heading">
                  <div>
                    <span>Recent journals</span>
                    <h2>Latest journeys</h2>
                  </div>

                  <RouterLink to="/journal/create" class="mini-link">
                    New entry
                  </RouterLink>
                </div>

                <div v-if="recentJournals.length" class="journey-list compact">
                  <article
                    v-for="journal in recentJournals"
                    :key="journal.id"
                    class="journey-row"
                  >
                    <AppStampFrame
                      class="journey-thumb"
                      :image="coverFor(journal)"
                      :alt="`Cover image for ${journal.title || 'journal'}`"
                      @error="$event.target.src = '/images/island-placeholder.jpg'"
                    />

                    <div>
                      <small>{{ journal.island_name }} - {{ formatDate(journal.start_date) }}</small>
                      <h3>{{ journal.title }}</h3>
                      <p>{{ journal.content || 'No story written yet.' }}</p>
                    </div>

                    <RouterLink :to="`/journal/${journal.id}`" class="icon-link">
                      <i class="bi bi-arrow-right"></i>
                    </RouterLink>
                  </article>
                </div>

                <div v-else class="empty-note">
                  No journeys yet. Start with your first reef story.
                </div>
              </div>

              <div class="panel-block">
                <div class="panel-heading">
                  <div>
                    <span>Species discovered</span>
                    <h2>Marine checklist</h2>
                  </div>
                </div>

                <div v-if="speciesChecklist.length" class="checklist">
                  <button
                    v-for="species in speciesChecklist.slice(0, 5)"
                    :key="species.name"
                    type="button"
                    class="check-row"
                    @click="setPanel('marine')"
                  >
                    <i class="bi bi-check-circle-fill"></i>
                    <span>{{ species.name }}</span>
                    <small>{{ species.count }}x</small>
                  </button>
                </div>

                <div v-else class="empty-note">
                  Add marine sightings in a journal to build this list.
                </div>
              </div>

              <div class="panel-block">
                <div class="panel-heading">
                  <div>
                    <span>Saved for later</span>
                    <h2>Saved journals</h2>
                  </div>

                  <button class="plain-link" type="button" @click="setPanel('saved-journals')">
                    View all
                  </button>
                </div>

                <div v-if="savedJournals.length" class="saved-mini-list">
                  <RouterLink
                    v-for="journal in savedJournals.slice(0, 4)"
                    :key="journal.id"
                    :to="`/journal/${journal.id}`"
                    class="saved-mini"
                  >
                    <img
                      :src="coverFor(journal)"
                      :alt="journal.title || 'Saved journal'"
                    />
                    <span>{{ journal.title }}</span>
                  </RouterLink>
                </div>

                <div v-else class="empty-note">
                  Saved journals will appear here.
                </div>
              </div>
              </template>
            </section>

            <section v-else-if="activePanel === 'journeys'" class="content-panel">
              <div class="panel-heading">
                <div>
                  <span>Travel Timeline</span>
                  <h2>Travel timeline</h2>
                </div>

                <RouterLink to="/journal/create" class="mini-link">
                  Create journal
                </RouterLink>
              </div>

              <div v-if="travelTimeline.length" class="travel-timeline">
                <article
                  v-for="entry in travelTimeline"
                  :key="entry.key"
                  class="timeline-entry"
                  :class="`is-${entry.type}`"
                >
                  <div class="timeline-date">
                    <span>{{ entry.monthLabel.split(' ')[0] }}</span>
                    <small>{{ entry.monthLabel.split(' ')[1] }}</small>
                  </div>

                  <span class="timeline-dot"></span>

                  <div class="timeline-card">
                    <div>
                      <div class="timeline-title-row">
                        <h3>{{ entry.island_name }}, {{ entry.country }}</h3>
                        <span class="timeline-status">{{ entry.statusLabel }}</span>
                      </div>

                      <p>{{ entry.content || entry.title }}</p>

                      <div class="meta-pills">
                        <span>{{ entry.mood || 'logged' }}</span>
                        <span v-if="entry.type === 'completed'">
                          {{ entry.sighting_count || 0 }} species
                        </span>
                        <span v-else>
                          {{ entry.item_count || 0 }} planned stops
                        </span>
                        <span>{{ entry.days || 1 }} day{{ entry.days === 1 ? '' : 's' }}</span>
                      </div>
                    </div>

                    <AppStampFrame
                      class="timeline-stamp"
                      :image="coverFor(entry)"
                      :alt="entry.title || entry.island_name || 'Timeline image'"
                      @error="$event.target.src = '/images/island-placeholder.jpg'"
                    />

                    <div
                      v-if="entry.type === 'completed'"
                      class="timeline-controls"
                    >
                      <RouterLink
                        :to="`/journal/${entry.id}`"
                        class="open-btn"
                      >
                        View
                      </RouterLink>

                      <div class="journal-actions">
                        <button
                          type="button"
                          class="visibility-toggle"
                          :class="{ private: entry.visibility === 'private' }"
                          :disabled="isJournalActionLoading(entry.id)"
                          @click.stop="toggleJournalVisibility(entry)"
                        >
                          <i :class="entry.visibility === 'public' ? 'bi bi-eye' : 'bi bi-lock'"></i>
                          {{ entry.visibility === 'public' ? 'Public' : 'Private' }}
                        </button>

                        <button
                          type="button"
                          class="delete-journal-btn"
                          :disabled="isJournalActionLoading(entry.id)"
                          aria-label="Delete journal"
                          @click.stop="removeJournal(entry)"
                        >
                          <i class="bi bi-trash3"></i>
                        </button>
                      </div>
                    </div>

                    <RouterLink
                      v-else-if="entry.overdue"
                      :to="startJournalQuery(entry)"
                      class="open-btn"
                    >
                      Start journal
                    </RouterLink>

                    <RouterLink v-else to="/planner" class="open-btn">
                      View plan
                    </RouterLink>
                  </div>
                </article>
              </div>

              <div v-else class="empty-note">
                Planned trips and completed journals will appear here.
              </div>
            </section>

            <section v-else-if="activePanel === 'marine'" class="content-panel">
              <div class="panel-heading">
                <div>
                  <span>My Marine Life</span>
                  <h2>Sightings checklist</h2>
                </div>
              </div>

              <div class="marine-sections">
                <section>
                  <div class="subsection-heading">
                    <span>Confirmed journal sightings</span>
                    <small>{{ speciesChecklist.length }} species</small>
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
                        <p>Seen in {{ species.count }} journal{{ species.count > 1 ? 's' : '' }}</p>
                      </div>
                    </article>
                  </div>

                  <div v-else class="empty-note">
                    Add marine sightings in a journal to build this checklist.
                  </div>
                </section>

                <section>
                  <div class="subsection-heading">
                    <span>AI identified species</span>
                    <small>{{ aiSpeciesList.length }} saved</small>
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
                        :alt="`AI identification photo for ${item.displayName}`"
                      />

                      <span v-else class="ai-id-placeholder">
                        <i class="bi bi-stars"></i>
                      </span>

                      <div>
                        <div class="ai-id-title">
                          <h3>{{ item.displayName }}</h3>

                          <span :class="{ verified: item.isVerified }">
                            <i v-if="item.isVerified" class="bi bi-check-lg"></i>
                            {{ item.isVerified ? 'Verified' : item.taxonomy_status || 'Pending' }}
                          </span>
                        </div>

                        <p>{{ item.scientificName || 'Scientific name unavailable' }}</p>
                        <small>{{ item.confidence || 'Confidence not stated' }} - {{ formatDate(item.created_at) }}</small>
                      </div>
                    </article>
                  </div>

                  <div v-else class="empty-note">
                    AI species you identify from Discovery Hub will appear here.
                  </div>
                </section>
              </div>
            </section>

            <section v-else-if="activePanel === 'saved-islands'" class="content-panel">
              <div class="panel-heading">
                <div>
                  <span>Saved Islands</span>
                  <h2>Places you kept</h2>
                </div>

                <RouterLink to="/discovery" class="mini-link">
                  Explore more
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
                    :alt="`${island.name || 'Saved island'} in ${island.country || 'your saved islands'}`"
                    :contain="false"
                    @error="$event.target.src = '/images/island-placeholder.jpg'"
                  />

                  <strong>{{ island.name }}</strong>
                  <span>{{ island.country }}</span>
                </RouterLink>
              </div>

              <div v-else class="empty-note">
                No saved islands yet.
              </div>
            </section>

            <section v-else-if="activePanel === 'saved-journals'" class="content-panel">
              <div class="panel-heading">
                <div>
                  <span>Saved Journals</span>
                  <h2>Stories you kept</h2>
                </div>
              </div>

              <div v-if="savedJournals.length" class="journey-list">
                <article
                  v-for="journal in savedJournals"
                  :key="journal.id"
                  class="journey-row"
                >
                  <AppStampFrame
                    class="journey-thumb"
                    :image="coverFor(journal)"
                    :alt="journal.title || 'Saved journal'"
                    @error="$event.target.src = '/images/island-placeholder.jpg'"
                  />

                  <div>
                    <small>{{ journal.island_name }} - {{ formatDate(journal.start_date || journal.created_at) }}</small>
                    <h3>{{ journal.title }}</h3>
                    <p>{{ journal.content || 'No preview available.' }}</p>
                  </div>

                  <RouterLink :to="`/journal/${journal.id}`" class="icon-link">
                    <i class="bi bi-arrow-right"></i>
                  </RouterLink>
                </article>
              </div>

              <div v-else class="empty-note">
                Saved journals will appear here.
              </div>
            </section>

            <section v-else-if="activePanel === 'badges'" class="content-panel">
              <div class="panel-heading">
                <div>
                  <span>Badges & Achievements</span>
                  <h2>Achievements</h2>
                </div>

                <strong class="badge-count">
                  {{ unlockedBadges }} / {{ badges.length }} earned
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
                  <small>{{ badge.unlocked ? 'Unlocked' : 'Keep exploring' }}</small>
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
  padding: 34px 0 28px;
  background:
    radial-gradient(circle at top left, rgba(169, 216, 214, 0.34), transparent 34%),
    linear-gradient(180deg, #fffdf8 0%, #f7efe2 100%);
}

.dashboard-shell {
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
}

.passport-book,
.content-panel,
.logbook-nav,
.panel-block {
  background:
    linear-gradient(180deg, rgba(255, 253, 248, 0.96), rgba(251, 247, 239, 0.96)),
    repeating-linear-gradient(0deg, transparent 0 31px, rgba(216, 205, 187, 0.42) 32px);
  border: 1px dashed #d8cdbb;
  box-shadow: 0 16px 34px rgba(47, 72, 88, 0.09);
}

.passport-book {
  overflow: hidden;
  border-radius: 22px;
}

.overview-passport {
  margin-bottom: 18px;
}

.passport-cover {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  padding: 30px 34px;
  background:
    radial-gradient(circle at top right, rgba(245, 169, 142, 0.34), transparent 40%),
    linear-gradient(135deg, #1f6f78 0%, #1897a0 56%, #2f4858 100%);
  color: #fffdf8;
}

.passport-cover span {
  display: block;
  margin-bottom: 5px;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.passport-cover h1 {
  margin: 0;
  font-family: Georgia, serif;
  font-size: clamp(2rem, 4vw, 3.2rem);
  font-style: italic;
}

.passport-cover p {
  margin: 4px 0 0;
  color: rgba(255, 253, 248, 0.82);
  font-weight: 700;
}

.passport-anchor {
  width: 66px;
  height: 66px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  border: 1px solid rgba(255, 253, 248, 0.68);
  border-radius: 50%;
  font-size: 1.9rem;
  background: rgba(255, 253, 248, 0.12);
  color: #fffdf8;
  box-shadow: inset 0 0 0 6px rgba(255, 253, 248, 0.08);
}

.passport-body {
  display: grid;
  grid-template-columns: 270px minmax(0, 1fr);
  min-height: 360px;
}

.passport-profile {
  display: grid;
  justify-items: center;
  align-content: start;
  gap: 12px;
  padding: 30px 28px;
  border-right: 1px dashed #d8cdbb;
  text-align: center;
}

.passport-photo {
  width: 128px;
  aspect-ratio: 0.78;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #8fcfca;
  background: #deefec;
  color: #147d84;
  font-size: 3rem;
}

.passport-profile strong {
  display: block;
  margin-top: 8px;
  color: #2f4858;
  font-family: Georgia, serif;
  font-style: italic;
}

.passport-profile > span {
  width: 100%;
  padding-top: 8px;
  border-top: 1px solid #8fcfca;
  color: #64748b;
  font-size: 0.78rem;
  font-family: Georgia, serif;
  font-style: italic;
}

.badge-dots {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  max-width: 120px;
  margin-top: 10px;
}

.badge-dots i {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #d7d1c4;
}

.badge-dots i.earned:nth-child(1) {
  background: #1897a0;
}

.badge-dots i.earned:nth-child(2) {
  background: #d6a642;
}

.badge-dots i.earned:nth-child(3) {
  background: #86bdb1;
}

.badge-dots i.earned:nth-child(4) {
  background: #f5a98e;
}

.badge-dots i.earned:nth-child(5) {
  background: #8f8ad6;
}

.badge-dots i.earned:nth-child(6) {
  background: #b9915c;
}

.passport-profile small {
  color: #64748b;
  font-weight: 700;
}

.passport-info {
  padding: 30px 34px;
}

.passport-details {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px 34px;
}

.passport-details span,
.section-label span {
  display: block;
  color: #bd704e;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.passport-details strong {
  display: block;
  margin-top: 4px;
  color: #2f4858;
  font-family: Georgia, serif;
  font-size: 1.08rem;
  font-weight: 500;
}

.tier-card {
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr);
  gap: 14px;
  align-items: center;
  margin: 26px 0;
  padding: 18px;
  border: 1px dashed rgba(24, 151, 160, 0.34);
  border-radius: 10px;
  background: #deefec;
}

.tier-icon {
  width: 54px;
  height: 54px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #1897a0;
  color: #fffdf8;
  font-size: 1.4rem;
}

.tier-card h2 {
  margin: 0;
  color: #2f4858;
  font-family: Georgia, serif;
  font-size: 1.15rem;
  font-style: italic;
}

.tier-card p {
  margin: 4px 0 8px;
  color: #7c6f63;
  font-size: 0.85rem;
  font-weight: 700;
}

.tier-track {
  height: 7px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(24, 151, 160, 0.18);
}

.tier-track i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #f5a98e;
}

.stamp-list {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  margin-top: 12px;
}

.stamp-list span {
  padding: 7px 12px;
  border: 1px solid #62aaa0;
  border-radius: 4px;
  background: #e4f4ee;
  color: #247162;
  font-size: 0.76rem;
  font-weight: 900;
}

.stamp-list span.planned {
  border-color: #c7b18d;
  background: #f7ead4;
  color: #8c7250;
}

.stamp-list span.empty-stamp {
  border-color: #d8cdbb;
  background: #f8f1e6;
  color: #9a7b55;
}

.passport-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 18px 28px;
  border-top: 1px dashed #d8cdbb;
  background: #deefec;
  color: #2f4858;
  font-family: monospace;
  font-size: 0.8rem;
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
  padding: 10px 16px;
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

.dashboard-layout {
  display: grid;
  grid-template-columns: 250px minmax(0, 1fr);
  align-items: start;
  gap: 18px;
}

.logbook-nav {
  position: sticky;
  top: 96px;
  display: grid;
  gap: 10px;
  padding: 18px;
  border-radius: 18px;
}

.logbook-tab {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  border: 1px solid transparent;
  border-radius: 12px;
  padding: 11px 12px;
  background: transparent;
  color: #486174;
  font-weight: 800;
  text-align: left;
}

.logbook-tab:hover,
.logbook-tab.active {
  background: #deefec;
  border-color: rgba(24, 151, 160, 0.24);
  color: #147d84;
}

.content-panel {
  padding: 24px;
  border-radius: 18px;
}

.passport-panel {
  padding: 0;
  background: transparent;
  border: none;
  box-shadow: none;
}

.overview-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(260px, 0.8fr);
  gap: 18px;
  background: transparent;
  border: none;
  box-shadow: none;
  padding: 0;
}

.panel-block {
  padding: 22px;
  border-radius: 18px;
}

.panel-block.wide {
  grid-row: span 2;
}

.panel-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 18px;
}

.panel-heading span {
  color: #1897a0;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.panel-heading h2 {
  margin: 6px 0;
  color: #2f4858;
}

.empty-note {
  margin: 0;
  padding: 18px;
  border: 1px dashed #d8cdbb;
  border-radius: 16px;
  background: rgba(251, 249, 241, 0.78);
  color: #64748b;
  font-weight: 700;
  text-align: center;
}

.journey-list {
  display: grid;
  gap: 14px;
}

.journey-row {
  display: grid;
  grid-template-columns: 116px minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
  padding: 14px;
  border: 1px solid rgba(216, 205, 187, 0.82);
  border-radius: 16px;
  background: #fffdf8;
}

.journey-list.compact .journey-row {
  grid-template-columns: 92px minmax(0, 1fr) 36px;
}

.journey-thumb {
  aspect-ratio: 1.1;
  --stamp-radius: 5px;
  --stamp-size: 15px;
}

.journey-row small,
.journey-row p,
.marine-card p,
.ai-id-card p,
.ai-id-card small,
.saved-island-card span,
.badge-card p,
.badge-card small {
  color: #64748b;
}

.journey-row h3,
.marine-card h3,
.ai-id-card h3,
.saved-island-card strong,
.badge-card h3 {
  margin: 4px 0;
  color: #2f4858;
  font-family: 'Poppins', sans-serif;
  font-size: 1.02rem;
  font-weight: 900;
}

.journey-row p {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.icon-link {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #deefec;
  color: #1897a0;
}

.checklist {
  display: grid;
  gap: 9px;
}

.check-row {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  border: none;
  border-bottom: 1px dashed #d8cdbb;
  padding: 8px 0;
  background: transparent;
  color: #2f4858;
  font-weight: 800;
}

.check-row i,
.marine-icon {
  color: #1897a0;
}

.plain-link {
  border: none;
  background: transparent;
  color: #1897a0;
  font-weight: 900;
}

.saved-mini-list {
  display: grid;
  gap: 10px;
}

.saved-mini {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #2f4858;
  font-weight: 800;
  text-decoration: none;
}

.saved-mini img {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  object-fit: cover;
}

.travel-timeline {
  position: relative;
  display: grid;
  gap: 18px;
  padding-left: 4px;
}

.timeline-entry {
  display: grid;
  grid-template-columns: 58px 20px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
  position: relative;
}

.timeline-entry:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 67px;
  top: 22px;
  bottom: -24px;
  border-left: 1px dashed #cdbd9f;
}

.timeline-date {
  display: grid;
  justify-items: end;
  color: #9a7b55;
  font-size: 0.76rem;
  font-weight: 900;
  line-height: 1.1;
}

.timeline-date small {
  color: #b59a75;
  font-weight: 800;
}

.timeline-dot {
  position: relative;
  z-index: 1;
  width: 14px;
  height: 14px;
  margin-top: 4px;
  border-radius: 50%;
  background: #2f745f;
  box-shadow: 0 0 0 5px #deefec;
}

.timeline-entry.is-planned .timeline-dot {
  border: 3px solid #8f9aa8;
  background: #fffdf8;
  box-shadow: 0 0 0 5px #f0ebe1;
}

.timeline-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 86px auto;
  gap: 14px;
  align-items: center;
  padding: 14px;
  border: 1px solid rgba(216, 205, 187, 0.82);
  border-radius: 16px;
  background: #fffdf8;
}

.timeline-controls,
.journal-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.timeline-controls {
  flex-wrap: wrap;
  justify-content: flex-end;
}

.journal-actions {
  padding-left: 8px;
  border-left: 1px dashed #d8cdbb;
}

.visibility-toggle,
.delete-journal-btn {
  min-height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: 999px;
  background: #deefec;
  color: #147d84;
  font-family: inherit;
  font-size: 0.78rem;
  font-weight: 900;
}

.visibility-toggle {
  gap: 6px;
  padding: 7px 11px;
}

.visibility-toggle.private {
  background: #f4eadc;
  color: #8c7250;
}

.delete-journal-btn {
  width: 34px;
  color: #a94444;
}

.visibility-toggle:hover,
.delete-journal-btn:hover {
  border-color: currentColor;
}

.visibility-toggle:disabled,
.delete-journal-btn:disabled {
  cursor: wait;
  opacity: 0.58;
}

.timeline-entry.is-planned .timeline-card {
  border-style: dashed;
  background: #fffdf8;
}

.timeline-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.timeline-card h3 {
  margin: 0 0 4px;
  color: #2f4858;
  font-family: 'Poppins', sans-serif;
  font-size: 1rem;
  font-weight: 900;
}

.timeline-status {
  flex: 0 0 auto;
  padding: 4px 8px;
  border-radius: 999px;
  background: #deefec;
  color: #1897a0;
  font-size: 0.68rem;
  font-weight: 900;
  text-transform: uppercase;
}

.timeline-entry.is-planned .timeline-status {
  background: #f4eadc;
  color: #8c7250;
}

.timeline-card p {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: #64748b;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.timeline-stamp {
  width: 86px;
  aspect-ratio: 0.78;
  transform: rotate(3deg);
  --stamp-radius: 4px;
  --stamp-size: 13px;
}

.meta-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.meta-pills span {
  padding: 5px 9px;
  border-radius: 999px;
  background: #f4eadc;
  color: #7c6f63;
  font-size: 0.72rem;
  font-weight: 800;
}

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
  border: 1px solid rgba(216, 205, 187, 0.82);
  border-radius: 16px;
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  border-radius: 50%;
  background: #deefec;
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #1897a0;
  font-size: 1.5rem;
}

.ai-id-title {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.ai-id-title span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
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

@media (max-width: 991px) {
  .passport-body,
  .dashboard-layout {
    grid-template-columns: 1fr;
  }

  .passport-profile {
    border-right: none;
    border-bottom: 1px dashed #d8cdbb;
  }

  .overview-grid,
  .marine-grid,
  .ai-id-grid,
  .badge-grid,
  .island-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .logbook-nav {
    position: static;
    display: flex;
    overflow-x: auto;
  }

  .logbook-tab {
    min-width: max-content;
  }
}

@media (max-width: 640px) {
  .dashboard-shell {
    width: min(100% - 20px, 1180px);
  }

  .passport-cover,
  .passport-footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .passport-info,
  .passport-cover,
  .content-panel,
  .panel-block {
    padding: 18px;
  }

  .passport-details,
  .overview-grid,
  .marine-grid,
  .ai-id-grid,
  .badge-grid,
  .island-grid {
    grid-template-columns: 1fr;
  }

  .journey-row,
  .journey-list.compact .journey-row {
    grid-template-columns: 82px minmax(0, 1fr);
  }

  .journey-row .icon-link {
    grid-column: 1 / -1;
    justify-self: end;
  }

  .timeline-entry {
    grid-template-columns: 44px 18px minmax(0, 1fr);
  }

  .timeline-entry:not(:last-child)::after {
    left: 55px;
  }

  .timeline-card {
    grid-template-columns: 1fr;
  }

  .timeline-stamp {
    width: 74px;
  }
}
</style>
