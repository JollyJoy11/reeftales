<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import JournalCard from '@/components/journals/JournalCard.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import AppAlert from '@/components/common/AppAlert.vue'
import { getPublicJournals, getTrendingIslands, getTopExplorers } from '@/services/journalService'

const journals = ref([])
const route = useRoute()
const { t } = useI18n()
const search = ref('')
const loading = ref(false)
const errorMessage = ref('')
const trendingIslands = ref([])
const topExplorers = ref([])
const sortBy = ref('newest')

const sortOptions = computed(() => [
  { label: t('community.sortNewest'), value: 'newest' },
  { label: t('community.sortLiked'), value: 'likes' },
  { label: t('community.sortCommented'), value: 'comments' }
])

async function loadJournals() {
  try {
    loading.value = true
    errorMessage.value = ''

    journals.value = await getPublicJournals({
      search: search.value,
      sort: sortBy.value
    })
  } catch (error) {
    errorMessage.value = t('community.loadError')
  } finally {
    loading.value = false
  }
}

async function loadSidebarData() {
  try {
    trendingIslands.value = await getTrendingIslands()
    topExplorers.value = await getTopExplorers()
  } catch (error) {
    errorMessage.value = t('community.highlightsError')
  }
}

function getInitial(name) {
  return name?.charAt(0)?.toUpperCase() || 'U'
}

watch([search, sortBy], () => {
  loadJournals()
})

onMounted(() => {
  search.value = typeof route.query.search === 'string' ? route.query.search : ''
  loadJournals()
  loadSidebarData()
})

watch(
  () => route.query.search,
  value => {
    search.value = typeof value === 'string' ? value : ''
  }
)
</script>

<template>
  <MainLayout>
    <AppAlert
      v-if="errorMessage" :message="errorMessage" variant="danger" @close="errorMessage = ''"
    />

    <main class="community-page">
      <section class="container py-4">
        <div class="community-hero mb-4">
          <div class="hero-copy">
            <span class="eyebrow">{{ t('community.eyebrow') }}</span>
            <h1>{{ t('community.title') }}</h1>
            <p>
              {{ t('community.intro') }}
            </p>

            <div class="community-search">
              <i class="bi bi-search"></i>
              <input
                v-model="search"
                type="search"
                :placeholder="t('community.searchPlaceholder')"
              />
            </div>
          </div>

          <div class="hero-actions">
            <div class="hero-stats">
              <span>
                <strong>{{ journals.length }}</strong>
                {{ t('community.diaries') }}
              </span>
              <span>
                <strong>{{ trendingIslands.length }}</strong>
                {{ t('community.islands') }}
              </span>
            </div>

            <RouterLink to="/journal/create" class="create-journal-btn">
              <i class="bi bi-pencil-square"></i>
              {{ t('community.createJournal') }}
            </RouterLink>
          </div>
        </div>

        <LoadingState
          v-if="loading"
          :message="t('community.loading')"
        />

        <div v-else class="row g-4">
          <main class="col-12 col-lg-8 order-2 order-lg-1">
            <div class="journal-toolbar">
              <span>{{ t('community.diariesFound', { count: journals.length }) }}</span>

              <div class="journal-sort">
                <button
                  v-for="option in sortOptions"
                  :key="option.value"
                  type="button"
                  :class="{ active: sortBy === option.value }"
                  @click="sortBy = option.value"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>

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
              :title="t('community.emptyTitle')"
              :message="t('community.emptyMessage')"
            />
          </main>

          <aside class="col-12 col-lg-4 order-1 order-lg-2">
            <div class="community-sidebar">
              <section class="sidebar-card">
                <h6><i class="bi bi-compass"></i> {{ t('community.trendingIslands') }}</h6>

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
                    <small>{{ t('community.diariesShared', { count: island.diary_count }) }}</small>
                  </div>
                </div>

                <p v-if="!trendingIslands.length" class="sidebar-empty">
                  {{ t('community.noTrending') }}
                </p>
              </section>

              <section class="sidebar-card">
                <h6><i class="bi bi-stars"></i> {{ t('community.topExplorers') }}</h6>

                <div
                  v-for="explorer in topExplorers"
                  :key="explorer.username"
                  class="explorer-row"
                >
                  <img
                    v-if="explorer.profile_image"
                    :src="explorer.profile_image"
                    class="explorer-avatar"
                    :alt="`${explorer.username || 'Explorer'} profile photo`"
                  />

                  <div v-else class="explorer-avatar avatar-fallback">
                    {{ getInitial(explorer.username) }}
                  </div>

                  <div>
                    <strong>{{ explorer.username }}</strong>
                    <small>{{ t('community.publicDiaries', { count: explorer.diary_count }) }}</small>
                  </div>
                </div>

                <p v-if="!topExplorers.length" class="sidebar-empty">
                  {{ t('community.noExplorers') }}
                </p>
              </section>
            </div>
          </aside>
        </div>
      </section>
    </main>
  </MainLayout>
</template>

<style scoped>
.community-page {
  min-height: calc(100vh - 80px);
  padding: 18px 0 46px;
  background:
    radial-gradient(circle at top left, rgba(169,216,214,0.28), transparent 32%),
    linear-gradient(180deg, #fffdf8 0%, #f7efe2 100%);
}

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
  border: 1px dashed var(--border);
  box-shadow: 0 16px 34px rgba(47,72,88,0.10);
  overflow: hidden;
}

.hero-copy,
.hero-actions {
  position: relative;
  z-index: 1;
}

.eyebrow {
  color: var(--accent);
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.community-hero h1 {
  margin: 6px 0;
  color: var(--text-primary);
  font-weight: 900;
  font-size: clamp(2rem, 4vw, 3.35rem);
  line-height: 1;
}

.community-hero p {
  max-width: 560px;
  color: var(--text-secondary);
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
  border: 1px solid var(--border);
  border-radius: 999px;
  background: #ffffff;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.85);
}

.community-search i {
  color: var(--accent);
}

.community-search input {
  min-width: 0;
  border: none;
  background: transparent;
  color: var(--text-primary);
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
  border: 1px dashed rgba(var(--accent-rgb),0.35);
  border-radius: 14px;
  background: rgba(255,255,255,0.58);
  color: var(--text-secondary);
  font-size: 0.78rem;
  font-weight: 800;
}

.hero-stats strong {
  display: block;
  color: var(--text-primary);
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
  background: var(--accent);
  color: #ffffff;
  font-weight: 900;
  text-decoration: none;
  white-space: nowrap;
  box-shadow: 0 12px 24px rgba(var(--accent-rgb),0.22);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease,
    color 0.18s ease;
}

.create-journal-btn:hover,
.create-journal-btn:focus-visible {
  background: var(--accent-strong);
  color: #ffffff;
  transform: translateY(-2px);
  box-shadow:
    0 14px 26px rgba(var(--accent-rgb),0.24),
    0 0 0 4px rgba(var(--accent-rgb),0.12);
}

.create-journal-btn:active {
  transform: translateY(0);
  box-shadow: 0 8px 16px rgba(var(--accent-rgb),0.18);
}

.community-sidebar {
  position: sticky;
  top: calc(var(--navbar-h) + 16px);
  display: grid;
  gap: 18px;
}

.sidebar-card {
  position: relative;
  padding: 22px;
  padding-bottom: 8px;
  border-radius: 18px;
  background: var(--surface-soft);
  border: 1px dashed var(--border);
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
  color: var(--text-primary);
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.78rem;
}

.trend-row {
  display: flex;
  gap: 14px;
  padding: 8px 0;
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
  background: var(--accent-soft);
  color: var(--accent);
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
  color: var(--text-primary);
}

.trend-row small,
.explorer-row small,
.sidebar-empty {
  color: var(--text-secondary);
  font-size: 0.82rem;
}

.explorer-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 0;
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
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 800;
}

.journal-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
}

.journal-toolbar > span {
  color: var(--text-secondary);
  font-size: 0.82rem;
  font-weight: 800;
}

.journal-sort {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
}

.journal-sort button {
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 8px 12px;
  background: var(--surface);
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-weight: 900;
}

.journal-sort button.active {
  border-color: var(--accent);
  background: var(--accent-soft);
  color: var(--accent);
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

  .journal-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>

