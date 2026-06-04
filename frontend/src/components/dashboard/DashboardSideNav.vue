<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  panels: {
    type: Array,
    default: () => []
  },
  activePanel: {
    type: String,
    default: 'overview'
  },
  displayName: {
    type: String,
    default: 'Explorer'
  },
  explorerLevel: {
    type: Object,
    default: () => ({ name: 'New Explorer' })
  }
})

const emit = defineEmits(['select'])

const menuOpen = ref(false)

const activePanelLabel = computed(() =>
  props.panels.find(panel => panel.id === props.activePanel)?.label || t('dashboard.myPassport')
)

const profileInitial = computed(() =>
  props.displayName.charAt(0).toUpperCase() || 'E'
)

watch(
  () => props.activePanel,
  () => {
    menuOpen.value = false
  }
)

function selectPanel(panelId) {
  emit('select', panelId)
}
</script>

<template>
  <nav class="dashboard-side-nav" :aria-label="t('dashboard.dashboardSections')">
    <button
      type="button"
      class="mobile-menu-toggle"
      :aria-expanded="menuOpen"
      @click="menuOpen = !menuOpen"
    >
      <span>
        <i class="bi bi-grid"></i>
        {{ activePanelLabel }}
      </span>

      <i :class="menuOpen ? 'bi bi-chevron-up' : 'bi bi-chevron-down'"></i>
    </button>

    <div class="side-nav-content" :class="{ open: menuOpen }">
      <div class="profile-mini">
        <span>{{ profileInitial }}</span>
        <div>
          <strong>{{ displayName }}</strong>
          <small>{{ explorerLevel.name }}</small>
        </div>
      </div>

      <button
        v-for="panel in panels"
        :key="panel.id"
        type="button"
        class="logbook-tab"
        :class="{ active: activePanel === panel.id }"
        @click="selectPanel(panel.id)"
      >
        <i :class="`bi ${panel.icon}`"></i>
        {{ panel.label }}
      </button>
    </div>
  </nav>
</template>

<style scoped>
.dashboard-side-nav {
  position: sticky;
  top: 96px;
  border: 1px solid #eadfca;
  border-radius: 22px;
  background: rgba(255, 253, 248, 0.92);
  box-shadow: 0 16px 34px rgba(47, 72, 88, 0.08);
}

.mobile-menu-toggle {
  display: none;
}

.side-nav-content {
  display: grid;
  gap: 10px;
  padding: 16px;
}

.profile-mini {
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  padding: 6px 4px 14px;
  margin-bottom: 4px;
  border-bottom: 1px dashed var(--border);
}

.profile-mini > span {
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 900;
}

.profile-mini strong,
.profile-mini small {
  display: block;
}

.profile-mini strong {
  color: var(--text-primary);
}

.profile-mini small {
  color: var(--text-secondary);
  font-size: 0.76rem;
  font-weight: 700;
}

.logbook-tab {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  border: 1px solid transparent;
  border-radius: 14px;
  padding: 11px 12px;
  background: transparent;
  color: #486174;
  font-weight: 800;
  text-align: left;
}

.logbook-tab:hover,
.logbook-tab.active {
  background: var(--accent-soft);
  border-color: rgba(24, 151, 160, 0.24);
  color: var(--accent-strong);
}

@media (max-width: 991px) {
  .dashboard-side-nav {
    position: static;
    overflow: hidden;
  }

  .mobile-menu-toggle {
    width: 100%;
    min-height: 54px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    border: none;
    background: rgba(255, 253, 248, 0.96);
    color: var(--text-primary);
    padding: 12px 16px;
    font-weight: 900;
  }

  .mobile-menu-toggle span {
    display: inline-flex;
    align-items: center;
    gap: 10px;
  }

  .side-nav-content {
    display: none;
    padding-top: 0;
  }

  .side-nav-content.open {
    display: grid;
  }

  .profile-mini {
    margin-top: 4px;
  }
}
</style>
