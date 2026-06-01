<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { getIslands } from '@/services/islandService'
import { getPublicJournals } from '@/services/journalService'
import { getSpecies } from '@/services/speciesService'

defineProps({
  variant: {
    type: String,
    default: 'desktop'
  }
})

const emit = defineEmits(['selected'])

const router = useRouter()

const searchQuery = ref('')
const showSuggestions = ref(false)
const searchLoading = ref(false)
const searchSuggestions = ref([])
const searchInputRef = ref(null)
let searchTimer = null

const quickSearchLinks = computed(() => {
  const query = searchQuery.value.trim()

  if (!query) return []

  return [
    {
      label: `Search islands for "${query}"`,
      type: 'Islands',
      icon: 'bi bi-geo-alt',
      to: { path: '/discovery', query: { mode: 'islands', search: query } }
    },
    {
      label: `Search marine life for "${query}"`,
      type: 'Marine',
      icon: 'bi bi-water',
      to: { path: '/discovery', query: { mode: 'marine', search: query } }
    },
    {
      label: `Search diaries for "${query}"`,
      type: 'Journals',
      icon: 'bi bi-journal-text',
      to: { path: '/community', query: { search: query } }
    }
  ]
})

async function loadSearchSuggestions() {
  const query = searchQuery.value.trim()

  if (query.length < 2) {
    searchSuggestions.value = []
    searchLoading.value = false
    return
  }

  try {
    searchLoading.value = true

    const [islandResult, speciesResult, journalResult] = await Promise.allSettled([
      getIslands({ search: query }),
      getSpecies({ search: query }),
      getPublicJournals({ search: query, sort: 'newest' })
    ])

    const islands = islandResult.status === 'fulfilled'
      ? islandResult.value.slice(0, 3).map(island => ({
          id: `island-${island.id}`,
          label: island.name,
          meta: island.country || 'Island',
          type: 'Island',
          icon: 'bi bi-geo-alt',
          to: `/discovery/island/${island.id}`
        }))
      : []

    const species = speciesResult.status === 'fulfilled'
      ? speciesResult.value.slice(0, 3).map(item => ({
          id: `species-${item.id}`,
          label: item.common_name || item.name,
          meta: item.scientific_name || item.category || 'Marine life',
          type: 'Marine',
          icon: 'bi bi-water',
          to: `/discovery/species/${item.id}`
        }))
      : []

    const journals = journalResult.status === 'fulfilled'
      ? journalResult.value.slice(0, 3).map(journal => ({
          id: `journal-${journal.id}`,
          label: journal.title,
          meta: journal.island_name || journal.username || 'Community diary',
          type: 'Journal',
          icon: 'bi bi-journal-text',
          to: `/journal/${journal.id}`
        }))
      : []

    searchSuggestions.value = [...islands, ...species, ...journals].slice(0, 7)
  } catch {
    searchSuggestions.value = []
  } finally {
    searchLoading.value = false
  }
}

function closeSearch() {
  showSuggestions.value = false
}

function resetSearch() {
  searchQuery.value = ''
  searchSuggestions.value = []
  searchLoading.value = false
  searchInputRef.value?.blur()
  closeSearch()
}

function deferCloseSearch() {
  setTimeout(closeSearch, 140)
}

function goToSearchTarget(target) {
  resetSearch()
  router.push(target)
  emit('selected')
}

function submitSearch() {
  const query = searchQuery.value.trim()

  if (!query) return

  goToSearchTarget({
    path: '/discovery',
    query: {
      mode: 'islands',
      search: query
    }
  })
}

watch(searchQuery, () => {
  clearTimeout(searchTimer)

  searchTimer = setTimeout(() => {
    loadSearchSuggestions()
  }, 220)
})
</script>

<template>
  <div class="navbar-search" :class="`navbar-search--${variant}`">
    <div class="input-group navbar-search__box">
      <span class="input-group-text border-end-0">
        <i class="bi bi-search"></i>
      </span>

      <input
        ref="searchInputRef"
        v-model="searchQuery"
        class="form-control border-start-0"
        type="search"
        placeholder="Search islands, marine life, diaries..."
        @focus="showSuggestions = true"
        @blur="deferCloseSearch"
        @keydown.enter.prevent="submitSearch"
      />
    </div>

    <div v-if="showSuggestions && searchQuery" class="navbar-search__suggestions shadow-sm">
      <RouterLink
        v-for="item in searchSuggestions"
        :key="item.id"
        :to="item.to"
        class="navbar-search__item"
        @click.prevent="goToSearchTarget(item.to)"
      >
        <i :class="item.icon"></i>
        <span>
          <strong>{{ item.label }}</strong>
          <small>{{ item.meta }}</small>
        </span>
        <em>{{ item.type }}</em>
      </RouterLink>

      <div v-if="searchLoading" class="navbar-search__note">
        Searching Reef Tales...
      </div>

      <template v-else>
        <div v-if="!searchSuggestions.length" class="navbar-search__note">
          No quick matches yet. Search inside a section below.
        </div>

        <RouterLink
          v-for="item in quickSearchLinks"
          :key="item.type"
          :to="item.to"
          class="navbar-search__item navbar-search__item--quick"
          @click.prevent="goToSearchTarget(item.to)"
        >
          <i :class="item.icon"></i>
          <span>
            <strong>{{ item.label }}</strong>
          </span>
          <em>{{ item.type }}</em>
        </RouterLink>
      </template>
    </div>
  </div>
</template>

<style>
.navbar-search {
  position: relative;
  flex: 0 0 auto;
}

.navbar-search__box {
  width: 340px;
}

.navbar-search__box .form-control,
.navbar-search__box .input-group-text {
  box-shadow: none;
  border-color: #d8cdbb !important;
  background: #fffdf8;
  font-size: 14px;
}

.navbar-search__suggestions {
  position: absolute;
  top: 44px;
  left: 0;
  width: 380px;
  display: grid;
  gap: 4px;
  padding: 8px;
  background: #fffdf8;
  border: 1px dashed #d8cdbb;
  border-radius: 16px;
  overflow: hidden;
  z-index: 1000;
}

.navbar-search__item {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 12px;
  text-decoration: none;
  color: #2f4858;
}

.navbar-search__item:hover {
  background: #deefec;
}

.navbar-search__item > i {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #deefec;
  color: #1897a0;
}

.navbar-search__item:hover > i {
  background: #fffdf8;
}

.navbar-search__item span {
  min-width: 0;
}

.navbar-search__item strong,
.navbar-search__item small {
  display: block;
}

.navbar-search__item strong {
  overflow: hidden;
  color: #2f4858;
  font-size: 0.9rem;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.navbar-search__item small {
  overflow: hidden;
  color: #64748b;
  font-size: 0.76rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.navbar-search__item em {
  padding: 4px 8px;
  border-radius: 999px;
  background: #f4eadc;
  color: #8c7250;
  font-size: 0.68rem;
  font-style: normal;
  font-weight: 900;
  white-space: nowrap;
}

.navbar-search__item--quick {
  border-top: 1px dashed #d8cdbb;
  border-radius: 0;
}

.navbar-search__note {
  padding: 12px 10px;
  color: #64748b;
  font-size: 0.82rem;
  font-weight: 700;
  text-align: center;
}

.navbar-search--mobile {
  width: 100%;
  margin-bottom: 22px;
}

.navbar-search--mobile .navbar-search__box {
  width: 100%;
}

.navbar-search--mobile .navbar-search__box .input-group-text {
  border-radius: 999px 0 0 999px;
  padding-left: 16px;
}

.navbar-search--mobile .navbar-search__box .form-control {
  border-radius: 0 999px 999px 0;
  min-height: 46px;
}

.navbar-search--mobile .navbar-search__suggestions {
  position: static;
  width: 100%;
  margin-top: 10px;
  box-shadow: none !important;
}
</style>
