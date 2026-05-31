<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppStampFrame from '@/components/common/AppStampFrame.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import MainLayout from '@/layouts/MainLayout.vue'
import { getItineraries } from '@/services/itineraryService'
import { getMyJournals } from '@/services/journalService'
import { getSavedIslands } from '@/services/savedIslandService'
import { getSavedJournals } from '@/services/savedJournalService'
import { getMyAiIdentifications } from '@/services/wormsService'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref('')
const journals = ref([])
const itineraries = ref([])
const savedIslands = ref([])
const savedJournals = ref([])
const aiIdentifications = ref([])

const panels = [
  { id: 'overview', label: 'Overview', icon: 'bi-grid' },
  { id: 'journeys', label: 'Travel Timeline', icon: 'bi-journal-richtext' },
  { id: 'marine', label: 'My Marine Life', icon: 'bi-water' },
  { id: 'saved-islands', label: 'Saved Islands', icon: 'bi-bookmark-heart' },
  { id: 'badges', label: 'Badges', icon: 'bi-award' }
]

const activePanel = ref(panels.some(panel => panel.id === route.query.view) ? route.query.view : 'overview')

watch(
  () => route.query.view,
  view => {
    activePanel.value = panels.some(panel => panel.id === view) ? view : 'overview'
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
    const sameIsland = journal.island_id && itinerary.island_id
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
const joinedSince = computed(() => {
  const joinDate = authStore.user?.created_at || journals.value[journals.value.length - 1]?.created_at

  return joinDate ? formatMonth(joinDate) : 'Recently'
})
const recentJournals = computed(() => journals.value.slice(0, 3))
const unmatchedPlannedTrips = computed(() => itineraries.value.filter(itinerary => !matchesJournal(itinerary)))
const totalMedia = computed(() => journals.value.reduce((sum, journal) => sum + Number(journal.media_count || 0), 0))
const totalSightings = computed(() => journals.value.reduce((sum, journal) => sum + Number(journal.sighting_count || 0), 0))
const totalTripDays = computed(() => journals.value.reduce((sum, journal) => sum + tripDays(journal), 0))
const visitedCountries = computed(() => new Set(journals.value.map(journal => journal.country).filter(Boolean)).size)

const speciesChecklist = computed(() => {
  const map = new Map()

  journals.value.forEach(journal => {
    splitList(journal.species).forEach(species => {
      const current = map.get(species) || { name: species, count: 0, journals: [] }
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
    displayName: item.accepted_name || item.scientific_name || item.common_name || 'Unidentified species',
    scientificName: item.scientific_name || item.accepted_name,
    isVerified: item.taxonomy_status?.toLowerCase() === 'accepted'
  }))
})

const stats = computed(() => [
  {
    label: 'Journeys',
    value: journals.value.length,
    note: `${unmatchedPlannedTrips.value.length} planned - ${totalTripDays.value || 0} travel days`,
    icon: 'bi-compass'
  },
  {
    label: 'Marine Life',
    value: speciesChecklist.value.length + aiSpeciesList.value.length,
    note: `${totalSightings.value || 0} sightings - ${aiSpeciesList.value.length} AI IDs`,
    icon: 'bi-water'
  },
  {
    label: 'Saved Islands',
    value: savedIslands.value.length,
    note: 'places to revisit',
    icon: 'bi-bookmark-heart'
  }
])

const badges = computed(() => [
  {
    title: 'First Journey',
    detail: 'Create your first journal entry',
    icon: 'bi-journal-check',
    unlocked: journals.value.length >= 1
  },
  {
    title: 'Marine Spotter',
    detail: 'Log at least 3 marine species',
    icon: 'bi-water',
    unlocked: speciesChecklist.value.length >= 3
  },
  {
    title: 'Island Collector',
    detail: 'Save at least 3 islands',
    icon: 'bi-bookmark-heart',
    unlocked: savedIslands.value.length >= 3
  },
  {
    title: 'Memory Keeper',
    detail: 'Upload 5 photos or videos',
    icon: 'bi-images',
    unlocked: totalMedia.value >= 5
  },
  {
    title: 'Community Voice',
    detail: 'Publish a public journey',
    icon: 'bi-megaphone',
    unlocked: journals.value.some(journal => journal.visibility === 'public')
  },
  {
    title: 'Island Hopper',
    detail: 'Journal trips in 2 countries',
    icon: 'bi-map',
    unlocked: visitedCountries.value >= 2
  }
])

const unlockedBadges = computed(() => badges.value.filter(badge => badge.unlocked).length)

const explorerLevel = computed(() => {
  const score = unlockedBadges.value + Math.floor(journals.value.length / 2) + Math.floor(speciesChecklist.value.length / 5)

  if (score >= 8) return { name: 'Ocean Explorer III', progress: 92 }
  if (score >= 5) return { name: 'Reef Explorer II', progress: 68 }
  if (score >= 2) return { name: 'Island Voyager I', progress: 38 }
  return { name: 'New Tide Explorer', progress: 16 }
})

const visitedIslandNames = computed(() => {
  return [...new Set(journals.value.map(journal => journal.island_name).filter(Boolean))]
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

  const plannedTrips = unmatchedPlannedTrips.value
    .map(itinerary => {
      const overdue = isPastTrip(itinerary)

      return {
        ...itinerary,
        key: `itinerary-${itinerary.id}`,
        type: 'planned',
        statusLabel: overdue ? 'Ready to journal' : 'Planned',
        mood: overdue ? 'waiting for story' : 'upcoming',
        sighting_count: 0,
        content: itinerary.notes || `${itinerary.item_count || 0} planned activit${Number(itinerary.item_count) === 1 ? 'y' : 'ies'} for this trip.`,
        monthLabel: formatMonth(itinerary.start_date || itinerary.created_at),
        days: tripDaysFromDates(itinerary.start_date, itinerary.end_date),
        overdue,
        sortDate: dateValue(itinerary.start_date || itinerary.created_at)
      }
    })

  return [...plannedTrips, ...completedTrips]
    .sort((a, b) => b.sortDate - a.sortDate)
})

async function loadDashboard() {
  try {
    loading.value = true
    error.value = ''

    const [myJournalData, itineraryData, savedIslandData, savedJournalData, aiIdentificationData] = await Promise.all([
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
    <LoadingState v-if="loading" message="Loading your logbook..." />

    <div v-else class="dashboard-shell">
      <section class="logbook-hero">
        <div>
          <span class="eyebrow">Dashboard / My Logbook</span>
          <h1>{{ displayName }}'s Reef Logbook</h1>
          <p>
            Your personal hub for planned trips, completed journals, sightings, saved islands, and badges.
          </p>
        </div>

        <RouterLink to="/journal/create" class="create-btn">
          <i class="bi bi-plus-circle"></i>
          Create journal
        </RouterLink>
      </section>

      <div v-if="error" class="error-note">
        {{ error }}
      </div>

      <section class="stats-grid">
        <button
          v-for="stat in stats"
          :key="stat.label"
          type="button"
          class="stat-card"
          @click="setPanel(stat.label === 'Marine Life' ? 'marine' : stat.label === 'Saved Islands' ? 'saved-islands' : 'journeys')"
        >
          <span class="stat-icon">
            <i :class="`bi ${stat.icon}`"></i>
          </span>
          <strong>{{ stat.value }}</strong>
          <span>{{ stat.label }}</span>
          <small>{{ stat.note }}</small>
        </button>
      </section>

      <section class="passport-panel">
        <div class="passport-left">
          <span class="passport-label">Coral Chronicle</span>
          <h2>Explorer Passport</h2>
          <p>{{ explorerLevel.name }} - joined since {{ joinedSince }}</p>
        </div>

        <div class="passport-progress">
          <span class="passport-anchor">
            <i class="bi bi-anchor"></i>
          </span>

          <div>
            <strong>{{ explorerLevel.progress }}% progress</strong>
            <div class="passport-track">
              <span :style="{ width: `${explorerLevel.progress}%` }"></span>
            </div>
            <small>{{ unlockedBadges }} badges - {{ journals.length }} journeys - {{ speciesChecklist.length }} species</small>
          </div>
        </div>

        <div class="passport-islands">
          <span
            v-for="name in visitedIslandNames.slice(0, 7)"
            :key="name"
          >
            {{ name }}
          </span>
          <span v-if="!visitedIslandNames.length">No islands stamped yet</span>
        </div>
      </section>

      <section class="dashboard-layout">
        <aside class="logbook-nav">
          <div class="profile-note">
            <span class="avatar-mark">{{ displayName.charAt(0).toUpperCase() }}</span>
            <div>
              <strong>{{ displayName }}</strong>
              <small>{{ explorerLevel.name }} - since {{ joinedSince }}</small>
            </div>
          </div>

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
          <section v-if="activePanel === 'overview'" class="content-panel overview-grid">
            <div class="panel-block wide">
              <div class="panel-heading">
                <div>
                  <span>Recent journals</span>
                  <h2>Latest journeys</h2>
                </div>
                <RouterLink to="/journal/create" class="mini-link">New entry</RouterLink>
              </div>

              <div v-if="recentJournals.length" class="journey-list compact">
                <article v-for="journal in recentJournals" :key="journal.id" class="journey-row">
                  <AppStampFrame
                    class="journey-thumb"
                    :image="coverFor(journal)"
                    :alt="`Cover image for ${journal.title || 'journal'} at ${journal.island_name || 'an island'}`"
                    @error="$event.target.src = '/images/island-placeholder.jpg'"
                  />

                  <div>
                    <small>{{ journal.island_name }} - {{ formatDate(journal.start_date) }}</small>
                    <h3>{{ journal.title }}</h3>
                    <p>{{ journal.content || 'No story written yet.' }}</p>
                  </div>

                  <RouterLink :to="`/journal/${journal.id}`" class="icon-link" aria-label="Open journal">
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
                  <h2>Islands</h2>
                </div>
              </div>

              <div v-if="savedIslands.length" class="saved-mini-list">
                <RouterLink
                  v-for="island in savedIslands.slice(0, 4)"
                  :key="island.id"
                  :to="`/discovery/island/${island.id}`"
                  class="saved-mini"
                >
                  <img
                    :src="island.cover_image || '/images/island-placeholder.jpg'"
                    :alt="`${island.name || 'Saved island'} in ${island.country || 'your saved islands'}`"
                  />
                  <span>{{ island.name }}</span>
                </RouterLink>
              </div>

              <div v-else class="empty-note">
                Saved islands will appear here.
              </div>
            </div>
          </section>

          <section v-else-if="activePanel === 'journeys'" class="content-panel">
            <div class="panel-heading">
              <div>
                <span>Travel Timeline</span>
                <h2>Travel timeline</h2>
              </div>
              <RouterLink to="/journal/create" class="mini-link">Create journal</RouterLink>
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
                      <span v-if="entry.type === 'completed'">{{ entry.sighting_count || 0 }} species</span>
                      <span v-else>{{ entry.item_count || 0 }} planned stops</span>
                      <span>{{ entry.days || 1 }} day{{ entry.days === 1 ? '' : 's' }}</span>
                    </div>
                  </div>

                  <AppStampFrame
                    class="timeline-stamp"
                    :image="coverFor(entry)"
                    :alt="entry.type === 'planned'
                      ? `Planned trip cover for ${entry.island_name || entry.title || 'island trip'}`
                      : `Journal cover for ${entry.title || entry.island_name || 'completed trip'}`"
                    @error="$event.target.src = '/images/island-placeholder.jpg'"
                  />

                  <RouterLink
                    v-if="entry.type === 'completed'"
                    :to="`/journal/${entry.id}`"
                    class="open-btn"
                  >
                    View
                  </RouterLink>

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
                  <article v-for="species in speciesChecklist" :key="species.name" class="marine-card">
                    <span class="marine-icon"><i class="bi bi-check2"></i></span>
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
              <RouterLink to="/discovery" class="mini-link">Explore more</RouterLink>
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

          <section v-else-if="activePanel === 'badges'" class="content-panel">
            <div class="panel-heading">
              <div>
                <span>Badges</span>
                <h2>Achievements</h2>
              </div>
              <strong class="badge-count">{{ unlockedBadges }} / {{ badges.length }}</strong>
            </div>

            <div class="badge-grid">
              <article
                v-for="badge in badges"
                :key="badge.title"
                class="badge-card"
                :class="{ unlocked: badge.unlocked }"
              >
                <span><i :class="`bi ${badge.icon}`"></i></span>
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
  padding: 34px 0 58px;
  background:
    radial-gradient(circle at top left, rgba(169,216,214,0.34), transparent 34%),
    linear-gradient(180deg, #fffdf8 0%, #f7efe2 100%);
}

.dashboard-shell {
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
}

.logbook-hero,
.content-panel,
.logbook-nav,
.passport-panel,
.implementation-note {
  position: relative;
  background:
    linear-gradient(180deg, rgba(255,253,248,0.96), rgba(251,247,239,0.96)),
    repeating-linear-gradient(0deg, transparent 0 31px, rgba(216,205,187,0.42) 32px);
  border: 1px dashed #d8cdbb;
  border-radius: 20px;
  box-shadow: 0 16px 34px rgba(47,72,88,0.09);
}

.logbook-hero {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: center;
  padding: 32px;
  overflow: visible;
}

.content-panel::before,
.logbook-nav::before {
  content: '';
  position: absolute;
  top: -12px;
  right: 44px;
  width: 92px;
  height: 24px;
  background: rgba(169,216,214,0.5);
  border-left: 1px dashed rgba(47,72,88,0.13);
  border-right: 1px dashed rgba(47,72,88,0.13);
  transform: rotate(3deg);
}

.eyebrow,
.panel-heading span {
  color: #1897a0;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.logbook-hero h1,
.panel-heading h2 {
  margin: 6px 0;
}

.logbook-hero p,
.empty-note,
.implementation-note p {
  margin: 0;
  color: #64748b;
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
  font-weight: 800;
  text-decoration: none;
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease,
    background 0.16s ease;
}

.create-btn {
  min-width: 170px;
  padding: 12px 18px;
}

.mini-link,
.open-btn {
  padding: 8px 14px;
  font-size: 0.82rem;
}

.create-btn:hover,
.mini-link:hover,
.open-btn:hover,
.create-btn:focus-visible,
.mini-link:focus-visible,
.open-btn:focus-visible {
  background: #147d84;
  color: #fff;
  box-shadow:
    0 14px 26px rgba(24,151,160,0.24),
    0 0 0 4px rgba(24,151,160,0.12);
  transform: translateY(-2px);
}

.create-btn:active,
.mini-link:active,
.open-btn:active {
  transform: translateY(0);
  box-shadow: 0 8px 16px rgba(24,151,160,0.18);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin: 18px 0;
}

.passport-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 0.8fr) minmax(260px, 1fr);
  gap: 18px;
  align-items: center;
  margin: 0 0 18px;
  padding: 22px 24px;
  overflow: hidden;
}

.passport-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 8px;
  background: #2f745f;
}

.passport-label {
  color: #1897a0;
  font-size: 0.76rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.passport-left h2 {
  margin: 4px 0;
  color: #2f4858;
  font-weight: 900;
}

.passport-left p,
.passport-progress small {
  margin: 0;
  color: #64748b;
}

.passport-progress {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  padding: 14px;
  border: 1px dashed #d8cdbb;
  border-radius: 14px;
  background: rgba(255,253,248,0.74);
}

.passport-anchor {
  width: 48px;
  height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #deefec;
  color: #1897a0;
  font-size: 1.35rem;
}

.passport-progress strong {
  color: #2f4858;
  font-size: 0.92rem;
}

.passport-track {
  height: 7px;
  margin: 6px 0;
  border-radius: 999px;
  background: #eadfca;
  overflow: hidden;
}

.passport-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #1897a0;
}

.passport-islands {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.passport-islands span {
  padding: 6px 10px;
  border: 1px solid rgba(24,151,160,0.34);
  border-radius: 8px;
  background: #deefec;
  color: #147d84;
  font-size: 0.76rem;
  font-weight: 800;
}

.stat-card {
  display: grid;
  gap: 3px;
  text-align: left;
  border: 1px solid rgba(216,205,187,0.86);
  border-radius: 16px;
  padding: 18px;
  background: #fffdf8;
  box-shadow: 0 10px 24px rgba(47,72,88,0.07);
}

.stat-card:hover {
  border-color: #1897a0;
}

.stat-icon {
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  border-radius: 50%;
  background: #deefec;
  color: #1897a0;
}

.stat-card strong {
  color: #2f4858;
  font-size: 1.85rem;
  line-height: 1;
}

.stat-card span {
  color: #2f4858;
  font-weight: 800;
}

.stat-card small {
  color: #64748b;
}

.dashboard-layout {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  align-items: start;
  gap: 18px;
}

.logbook-nav {
  display: grid;
  gap: 10px;
  padding: 18px;
}

.profile-note {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 14px;
  border-bottom: 1px dashed #d8cdbb;
}

.avatar-mark {
  width: 46px;
  height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #1897a0;
  color: #fff;
  font-weight: 900;
}

.profile-note strong,
.profile-note small {
  display: block;
}

.profile-note strong {
  color: #2f4858;
}

.profile-note small {
  color: #64748b;
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
  border-color: rgba(24,151,160,0.24);
  color: #147d84;
}

.logbook-content {
  min-width: 0;
}

.content-panel {
  padding: 24px;
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

.overview-grid::before {
  display: none;
}

.panel-block {
  position: relative;
  padding: 22px;
  border: 1px dashed #d8cdbb;
  border-radius: 18px;
  background: rgba(255,253,248,0.92);
  box-shadow: 0 12px 24px rgba(47,72,88,0.07);
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

.journey-list {
  display: grid;
  gap: 14px;
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
  border: 1px solid rgba(216,205,187,0.82);
  border-radius: 16px;
  background: #fffdf8;
}

.timeline-entry.is-planned .timeline-card {
  background:
    linear-gradient(135deg, rgba(255,255,255,0.72), rgba(246,241,231,0.9)),
    #fffdf8;
  border-style: dashed;
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
  letter-spacing: 0.03em;
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

.journey-row {
  display: grid;
  grid-template-columns: 116px minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
  padding: 14px;
  border: 1px solid rgba(216,205,187,0.82);
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
.upload-card span,
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
.island-grid,
.upload-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.marine-card,
.ai-id-card,
.badge-card,
.saved-island-card,
.upload-card {
  border: 1px solid rgba(216,205,187,0.82);
  border-radius: 16px;
  background: #fffdf8;
  text-decoration: none;
}

.ai-id-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.marine-card {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 16px;
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

.island-grid,
.upload-grid {
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
  opacity: 0.58;
}

.badge-card.unlocked {
  opacity: 1;
  border-color: rgba(24,151,160,0.34);
  box-shadow: 0 0 0 4px rgba(24,151,160,0.08);
}

.badge-card.unlocked small {
  color: #1897a0;
  font-weight: 900;
}

.upload-card {
  display: grid;
  gap: 8px;
  padding: 10px;
  color: inherit;
  font-weight: 800;
}

.upload-card img,
.upload-card video {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 12px;
  object-fit: cover;
  background: #f4eadc;
}

.implementation-note {
  margin-top: 18px;
  padding: 20px 24px;
}

.implementation-note h2 {
  margin: 0 0 8px;
  font-size: 1.2rem;
}

.error-note {
  margin: 18px 0;
  padding: 14px 16px;
  border: 1px solid #f1b9b9;
  border-radius: 14px;
  background: #fff1f1;
  color: #9f2f2f;
  font-weight: 700;
}

@media (max-width: 991px) {
  .logbook-hero,
  .dashboard-layout {
    grid-template-columns: 1fr;
  }

  .logbook-hero {
    align-items: flex-start;
    flex-direction: column;
  }

  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .passport-panel {
    grid-template-columns: 1fr;
  }

  .passport-islands {
    justify-content: flex-start;
  }

  .overview-grid,
  .marine-grid,
  .ai-id-grid,
  .badge-grid,
  .island-grid,
  .upload-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .logbook-nav {
    display: flex;
    overflow-x: auto;
  }

  .profile-note {
    min-width: 210px;
    padding-bottom: 0;
    padding-right: 14px;
    border-bottom: none;
    border-right: 1px dashed #d8cdbb;
  }

  .logbook-tab {
    min-width: max-content;
  }
}

@media (max-width: 640px) {
  .dashboard-shell {
    width: min(100% - 20px, 1180px);
  }

  .logbook-hero,
  .content-panel,
  .panel-block {
    padding: 18px;
    border-radius: 16px;
  }

  .stats-grid,
  .overview-grid,
  .marine-grid,
  .ai-id-grid,
  .badge-grid,
  .island-grid,
  .upload-grid {
    grid-template-columns: 1fr;
  }

  .journey-row,
  .journey-list.compact .journey-row {
    grid-template-columns: 82px minmax(0, 1fr);
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

  .journey-row .icon-link,
  .journey-row .open-btn {
    grid-column: 1 / -1;
    justify-self: end;
  }
}

:global(body.dark-mode) .dashboard-page {
  background:
    radial-gradient(circle at top left, rgba(38,210,222,0.14), transparent 34%),
    linear-gradient(180deg, #1a202c 0%, #202938 100%);
}

:global(body.dark-mode) .logbook-hero,
:global(body.dark-mode) .content-panel,
:global(body.dark-mode) .logbook-nav,
:global(body.dark-mode) .passport-panel,
:global(body.dark-mode) .implementation-note,
:global(body.dark-mode) .panel-block,
:global(body.dark-mode) .stat-card,
:global(body.dark-mode) .journey-row,
:global(body.dark-mode) .timeline-card,
:global(body.dark-mode) .marine-card,
:global(body.dark-mode) .ai-id-card,
:global(body.dark-mode) .badge-card,
:global(body.dark-mode) .saved-island-card,
:global(body.dark-mode) .upload-card {
  background: #253244;
  border-color: rgba(255,255,255,0.13);
  color: #f8fafc;
}

:global(body.dark-mode) .logbook-hero h1,
:global(body.dark-mode) .panel-heading h2,
:global(body.dark-mode) .passport-left h2,
:global(body.dark-mode) .passport-progress strong,
:global(body.dark-mode) .stat-card strong,
:global(body.dark-mode) .stat-card span,
:global(body.dark-mode) .profile-note strong,
:global(body.dark-mode) .journey-row h3,
:global(body.dark-mode) .timeline-card h3,
:global(body.dark-mode) .marine-card h3,
:global(body.dark-mode) .ai-id-card h3,
:global(body.dark-mode) .saved-island-card strong,
:global(body.dark-mode) .badge-card h3 {
  color: #f8fafc;
}

:global(body.dark-mode) .logbook-hero p,
:global(body.dark-mode) .passport-left p,
:global(body.dark-mode) .passport-progress small,
:global(body.dark-mode) .empty-note,
:global(body.dark-mode) .implementation-note p,
:global(body.dark-mode) .stat-card small,
:global(body.dark-mode) .profile-note small,
:global(body.dark-mode) .journey-row small,
:global(body.dark-mode) .journey-row p,
:global(body.dark-mode) .timeline-card p,
:global(body.dark-mode) .marine-card p,
:global(body.dark-mode) .ai-id-card p,
:global(body.dark-mode) .ai-id-card small,
:global(body.dark-mode) .saved-island-card span,
:global(body.dark-mode) .upload-card span,
:global(body.dark-mode) .badge-card p,
:global(body.dark-mode) .badge-card small {
  color: #cbd5e1;
}

:global(body.dark-mode) .logbook-tab {
  color: #cbd5e1;
}

:global(body.dark-mode) .subsection-heading {
  border-color: rgba(255,255,255,0.14);
}

:global(body.dark-mode) .subsection-heading span {
  color: #f8fafc;
}

:global(body.dark-mode) .subsection-heading small,
:global(body.dark-mode) .ai-id-title span {
  color: #cbd5e1;
}

:global(body.dark-mode) .ai-id-title span.verified {
  color: #62c3c9;
}

:global(body.dark-mode) .logbook-tab:hover,
:global(body.dark-mode) .logbook-tab.active,
:global(body.dark-mode) .stat-icon,
:global(body.dark-mode) .marine-icon,
:global(body.dark-mode) .ai-id-placeholder,
:global(body.dark-mode) .badge-card span,
:global(body.dark-mode) .icon-link {
  background: rgba(38,210,222,0.14);
  color: #62c3c9;
  border-color: rgba(98,195,201,0.3);
}

:global(body.dark-mode) .meta-pills span {
  background: #2d3748;
  color: #cbd5e1;
}

:global(body.dark-mode) .passport-progress {
  background: #2d3748;
  border-color: rgba(255,255,255,0.12);
}

:global(body.dark-mode) .passport-track {
  background: #3a475a;
}
</style>
