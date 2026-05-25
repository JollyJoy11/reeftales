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
        <div>
          <span class="eyebrow">Community Diaries</span>
          <h1>Ocean stories from real explorers</h1>
          <p>
            Browse public island journals, marine memories, and travel notes shared by the Reef Tales community.
          </p>
        </div>

        <RouterLink to="/journal/create" class="btn btn-primary">
          <i class="bi bi-pencil-square"></i>
          Create Journal
        </RouterLink>
      </div>

      <div class="community-toolbar mb-4">
        <div class="input-group search-box">
          <span class="input-group-text">
            <i class="bi bi-search"></i>
          </span>

          <input
            v-model="search"
            type="search"
            class="form-control"
            placeholder="Search journals, islands, or authors..."
          />
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
              <h6>Trending Islands</h6>

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
              <h6>Top Explorers</h6>

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
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: end;
  padding: 28px;
  border-radius: 28px;
  background:
    linear-gradient(rgba(251,249,241,0.88), rgba(251,249,241,0.95)),
    url('/images/community-hero.jpg');
  background-size: cover;
  background-position: center;
  border: 1px solid #eadfca;
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
}

.community-hero p {
  max-width: 620px;
  color: #64748b;
  margin: 0;
}

.community-hero .btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.community-toolbar {
  display: flex;
  justify-content: flex-end;
}

.search-box {
  max-width: 420px;
}

.search-box .form-control,
.search-box .input-group-text {
  background: #fffdf8;
  border-color: #d8cdbb;
}

.community-sidebar {
  position: sticky;
  top: 24px;
  display: grid;
  gap: 18px;
}

.sidebar-card {
  padding: 22px;
  border-radius: 24px;
  background: #fbf9f1;
  border: 1px solid #eadfca;
  box-shadow: 0 12px 30px rgba(0,0,0,0.08);
}

.sidebar-card h6 {
  margin-bottom: 16px;
  color: #2f4858;
  font-weight: 800;
  letter-spacing: 2px;
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
  color: #c4a484;
  font-size: 1.4rem;
  font-weight: 700;
  min-width: 38px;
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
    flex-direction: column;
    align-items: flex-start;
  }

  .community-toolbar {
    justify-content: stretch;
  }

  .search-box {
    max-width: none;
    width: 100%;
  }
}

:global(body.dark-mode) .community-hero {
  background:
    linear-gradient(rgba(37,50,68,0.9), rgba(37,50,68,0.95)),
    url('/images/community-hero.jpg');
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

:global(body.dark-mode) .sidebar-card {
  background: #253244;
  border-color: rgba(255,255,255,0.1);
}

:global(body.dark-mode) .trend-row {
  border-color: rgba(255,255,255,0.1);
}
</style>