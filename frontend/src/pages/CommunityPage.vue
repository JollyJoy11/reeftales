<script setup>
import { ref, onMounted, watch } from 'vue'
import MainLayout from '@/layouts/MainLayout.vue'
import JournalCard from '@/components/journals/JournalCard.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import AppAlert from '@/components/common/AppAlert.vue'
import { getPublicJournals, getTrendingIslands, getTopExplorers } from '@/services/journalService'

const journals = ref([])
const search = ref('')
const loading = ref(false)
const errorMessage = ref('')
const trendingIslands = ref([])
const topExplorers = ref([])

async function loadJournals() {
  try {
    loading.value = true
    errorMessage.value = ''

    journals.value = await getPublicJournals({
      search: search.value
    })
  } catch (error) {
    errorMessage.value = 'Failed to load community diaries.'
  } finally {
    loading.value = false
  }
}

async function loadSidebarData() {
  try {
    trendingIslands.value = await getTrendingIslands()
    topExplorers.value = await getTopExplorers()
  } catch (error) {
    errorMessage.value = 'Failed to load community highlights.'
  }
}

function getInitial(name) {
  return name?.charAt(0)?.toUpperCase() || 'U'
}

watch(search, () => {
  loadJournals()
})

onMounted(() => {
  loadJournals()
  loadSidebarData()
})
</script>

<template>
  <MainLayout>
    <AppAlert
      v-if="errorMessage" :message="errorMessage" variant="danger" @close="errorMessage = ''"
    />

    <section class="container py-4">
      <div class="community-hero mb-4">
        <div class="hero-copy">
          <span class="eyebrow">Community Diaries</span>
          <h1>Shared reef journals</h1>
          <p>
            Read island notes, marine sightings, and travel memories from other Reef Tales explorers.
          </p>

          <div class="community-search">
            <i class="bi bi-search"></i>
            <input
              v-model="search"
              type="search"
              placeholder="Search journals, islands, or authors..."
            />
          </div>
        </div>

        <div class="hero-actions">
          <div class="hero-stats">
            <span>
              <strong>{{ journals.length }}</strong>
              diaries
            </span>
            <span>
              <strong>{{ trendingIslands.length }}</strong>
              islands
            </span>
          </div>

          <RouterLink to="/journal/create" class="create-journal-btn">
            <i class="bi bi-pencil-square"></i>
            Create Journal
          </RouterLink>
        </div>
      </div>

      <LoadingState
        v-if="loading"
        message="Loading community diaries..."
      />

      <div v-else class="row g-4">
        <main class="col-12 col-lg-8">
          <div v-if="journals.length" class="row g-4">
            <div
              v-for="journal in journals"
              :key="journal.id"
              class="col-12 col-md-6"
            >
              <JournalCard :journal="journal" />
            </div>
          </div>

          <EmptyState
            v-else
            icon="bi bi-journal-text"
            title="No diaries found"
            message="Try changing your search keyword or create the first community diary."
          />
        </main>

        <aside class="col-12 col-lg-4">
          <div class="community-sidebar">
            <section class="sidebar-card">
              <h6><i class="bi bi-compass"></i> Trending Islands</h6>

              <div
                v-for="(island, index) in trendingIslands"
                :key="island.name"
                class="trend-row"
              >
                <span class="trend-number">
                  {{ String(index + 1).padStart(2, '0') }}
                </span>

                <div>
                  <strong>{{ island.name }}</strong>
                  <small>{{ island.diary_count }} diaries shared</small>
                </div>
              </div>

              <p v-if="!trendingIslands.length" class="sidebar-empty">
                No trending islands yet.
              </p>
            </section>

            <section class="sidebar-card">
              <h6><i class="bi bi-stars"></i> Top Explorers</h6>

              <div
                v-for="explorer in topExplorers"
                :key="explorer.username"
                class="explorer-row"
              >
                <img
                  v-if="explorer.profile_image"
                  :src="explorer.profile_image"
                  class="explorer-avatar"
                  alt="Explorer avatar"
                />

                <div v-else class="explorer-avatar avatar-fallback">
                  {{ getInitial(explorer.username) }}
                </div>

                <div>
                  <strong>{{ explorer.username }}</strong>
                  <small>{{ explorer.diary_count }} public diaries</small>
                </div>
              </div>

              <p v-if="!topExplorers.length" class="sidebar-empty">
                No explorers yet.
              </p>
            </section>
          </div>
        </aside>
      </div>
    </section>
  </MainLayout>
</template>

<style scoped>
.community-hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 26px;
  align-items: stretch;
  padding: 28px;
  border-radius: 18px;
  background:
    linear-gradient(90deg, rgba(251,249,241,0.98), rgba(251,249,241,0.88)),
    repeating-linear-gradient(
      to bottom,
      rgba(196,164,132,0.13) 0,
      rgba(196,164,132,0.13) 1px,
      transparent 1px,
      transparent 32px
    );
  border: 1px dashed #d8cdbb;
  box-shadow: 0 16px 34px rgba(47,72,88,0.10);
  overflow: hidden;
}

.hero-copy,
.hero-actions {
  position: relative;
  z-index: 1;
}

.eyebrow {
  color: #1897a0;
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.community-hero h1 {
  margin: 6px 0;
  color: #2f4858;
  font-weight: 900;
  font-size: clamp(2rem, 4vw, 3.35rem);
  line-height: 1;
}

.community-hero p {
  max-width: 560px;
  color: #64748b;
  margin: 0 0 18px;
  line-height: 1.65;
}

.community-search {
  max-width: 520px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border: 1px solid #d8cdbb;
  border-radius: 999px;
  background: #ffffff;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.85);
}

.community-search i {
  color: #1897a0;
}

.community-search input {
  min-width: 0;
  border: none;
  background: transparent;
  color: #2f4858;
  outline: none;
}

.community-search input::placeholder {
  color: #8a9aaa;
}

.hero-actions {
  min-width: 210px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 16px;
}

.hero-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.hero-stats span {
  padding: 12px;
  border: 1px dashed rgba(24,151,160,0.35);
  border-radius: 14px;
  background: rgba(255,255,255,0.58);
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 800;
}

.hero-stats strong {
  display: block;
  color: #2f4858;
  font-size: 1.4rem;
  line-height: 1;
}

.create-journal-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 18px;
  border-radius: 999px;
  background: #1897a0;
  color: #ffffff;
  font-weight: 900;
  text-decoration: none;
  white-space: nowrap;
  box-shadow: 0 12px 24px rgba(24,151,160,0.22);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease,
    color 0.18s ease;
}

.create-journal-btn:hover,
.create-journal-btn:focus-visible {
  background: #147d84;
  color: #ffffff;
  transform: translateY(-2px);
  box-shadow:
    0 14px 26px rgba(24,151,160,0.24),
    0 0 0 4px rgba(24,151,160,0.12);
}

.create-journal-btn:active {
  transform: translateY(0);
  box-shadow: 0 8px 16px rgba(24,151,160,0.18);
}

.community-sidebar {
  position: sticky;
  top: 24px;
  display: grid;
  gap: 18px;
}

.sidebar-card {
  position: relative;
  padding: 22px;
  border-radius: 18px;
  background: #fbf9f1;
  border: 1px dashed #d8cdbb;
  box-shadow: 0 12px 26px rgba(47,72,88,0.08);
}

.sidebar-card::before {
  content: '';
  position: absolute;
  top: -10px;
  left: 28px;
  width: 76px;
  height: 20px;
  background: rgba(245,223,154,0.46);
  transform: rotate(-3deg);
}

.sidebar-card h6 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  color: #2f4858;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.78rem;
}

.trend-row {
  display: flex;
  gap: 14px;
  padding: 12px 0;
  border-bottom: 1px solid #eadfca;
}

.trend-row:last-child {
  border-bottom: none;
}

.trend-number {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #deefec;
  color: #1897a0;
  font-size: 0.9rem;
  font-weight: 900;
  flex: 0 0 auto;
}

.trend-row strong,
.trend-row small,
.explorer-row strong,
.explorer-row small {
  display: block;
}

.trend-row strong,
.explorer-row strong {
  color: #2f4858;
}

.trend-row small,
.explorer-row small,
.sidebar-empty {
  color: #64748b;
  font-size: 0.82rem;
}

.explorer-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
}

.explorer-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #deefec;
  color: #1897a0;
  font-weight: 800;
}

@media (max-width: 991px) {
  .community-sidebar {
    position: static;
  }
}

@media (max-width: 768px) {
  .community-hero {
    grid-template-columns: 1fr;
  }

  .hero-actions {
    min-width: 0;
  }
}

:global(body.dark-mode) .community-hero {
  background:
    linear-gradient(90deg, rgba(37,50,68,0.98), rgba(37,50,68,0.92)),
    repeating-linear-gradient(
      to bottom,
      rgba(255,255,255,0.07) 0,
      rgba(255,255,255,0.07) 1px,
      transparent 1px,
      transparent 32px
    );
  border-color: rgba(255,255,255,0.1);
}

:global(body.dark-mode) .community-hero h1,
:global(body.dark-mode) .sidebar-card h6,
:global(body.dark-mode) .trend-row strong,
:global(body.dark-mode) .explorer-row strong {
  color: #f8fafc;
}

:global(body.dark-mode) .community-hero p,
:global(body.dark-mode) .trend-row small,
:global(body.dark-mode) .explorer-row small,
:global(body.dark-mode) .sidebar-empty {
  color: #cbd5e1;
}

:global(body.dark-mode) .community-search,
:global(body.dark-mode) .hero-stats span {
  background: #2d3748;
  border-color: rgba(255,255,255,0.1);
}

:global(body.dark-mode) .community-search input,
:global(body.dark-mode) .hero-stats strong {
  color: #f8fafc;
}

:global(body.dark-mode) .sidebar-card {
  background: #253244;
  border-color: rgba(255,255,255,0.1);
}

:global(body.dark-mode) .trend-row {
  border-color: rgba(255,255,255,0.1);
}
</style>
