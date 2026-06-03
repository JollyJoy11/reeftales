<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { getPublicJournals } from '@/services/journalService'

gsap.registerPlugin(ScrollTrigger)

const sectionRef = ref(null)
const journals = ref([])
const loading = ref(true)
const { t, locale } = useI18n()

const visibleJournals = computed(() => journals.value.slice(0, 8))
const canAutoScroll = computed(() => visibleJournals.value.length >= 4)
const trackJournals = computed(() => {
  if (!canAutoScroll.value) return visibleJournals.value
  return [...visibleJournals.value, ...visibleJournals.value]
})

function formatDate(date) {
  if (!date) return t('home.community.recentJourney')

  return new Date(date).toLocaleDateString(locale.value === 'zh' ? 'zh-CN' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function getInitial(journal) {
  return journal.username?.charAt(0)?.toUpperCase() || 'R'
}

function splitList(value) {
  if (!value) return []
  return String(value)
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

function journalTags(journal) {
  return [
    journal.mood,
    ...splitList(journal.activities),
    ...splitList(journal.species)
  ].filter(Boolean).slice(0, 2)
}

async function loadJournals() {
  try {
    const data = await getPublicJournals({ sort: 'newest' })
    journals.value = Array.isArray(data) ? data : []
  } catch {
    journals.value = []
  } finally {
    loading.value = false
  }
}

let ctx

onMounted(async () => {
  await loadJournals()

  ctx = gsap.context(() => {
    gsap.from('.community-heading > *', {
      scrollTrigger: {
        trigger: sectionRef.value,
        start: 'top 78%',
        toggleActions: 'play none none reverse'
      },
      y: 34,
      autoAlpha: 0,
      duration: 0.8,
      stagger: 0.08,
      ease: 'power3.out'
    })

    gsap.from('.journal-strip-shell', {
      scrollTrigger: {
        trigger: '.journal-strip-shell',
        start: 'top 82%',
        toggleActions: 'play none none reverse'
      },
      y: 54,
      autoAlpha: 0,
      duration: 0.9,
      ease: 'power3.out'
    })
  }, sectionRef.value)
})

onBeforeUnmount(() => {
  ctx?.revert()
})
</script>

<template>
  <section ref="sectionRef" class="community-section">
    <div class="container">
      <div class="community-heading">
        <span class="sub-badge">{{ t('home.community.eyebrow') }}</span>
        <h2>{{ t('home.community.title') }}</h2>
        <p>{{ t('home.community.intro') }}</p>
      </div>

      <div class="journal-strip-shell">
        <div v-if="loading" class="journal-empty">{{ t('home.community.loading') }}</div>

        <div v-else-if="trackJournals.length" class="journal-strip-mask">
          <div class="journal-track" :class="{ scrolling: canAutoScroll }">
            <article
              v-for="(journal, index) in trackJournals"
              :key="`${journal.id}-${index}`"
              class="journal-preview-card"
              :class="`tilt-${index % 4}`"
            >
              <span class="save-journal-pin" aria-hidden="true">
                <i class="bi bi-bookmark-fill"></i>
              </span>

              <RouterLink :to="`/journal/${journal.id}`" class="journal-card-link">
                <div class="journal-author-row">
                  <span class="avatar-mark">{{ getInitial(journal) }}</span>
                  <div>
                    <strong>{{ journal.username || t('home.community.explorerFallback') }}</strong>
                    <small>{{ formatDate(journal.created_at) }}</small>
                  </div>
                </div>

                <span class="island-pill">
                  <i class="bi bi-geo-alt"></i>
                  {{ journal.island_name || t('home.community.journalFallback') }}
                </span>

                <h3>{{ journal.title }}</h3>
                <p class="journal-excerpt">{{ journal.content || t('home.community.excerptFallback') }}</p>

                <div class="journal-card-footer">
                  <div class="tag-row">
                    <span v-for="tag in journalTags(journal)" :key="tag" class="mini-tag">{{ tag }}</span>
                  </div>
                  <span class="read-link">{{ t('home.community.read') }} <i class="bi bi-arrow-right"></i></span>
                </div>
              </RouterLink>
            </article>
          </div>
        </div>

        <div v-else class="journal-empty">
          {{ t('home.community.empty') }}
          <RouterLink to="/journal/create">{{ t('home.community.createFirst') }}</RouterLink>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.community-section {
  position: relative;
  z-index: 2;
  overflow: hidden;
  padding: clamp(72px, 9vw, 112px) 0 clamp(90px, 11vw, 140px);
  background:
    radial-gradient(circle at 84% 18%, rgba(213, 106, 60, 0.1), transparent 30%),
    linear-gradient(180deg, #f6ecdc 0%, #fffdf8 100%);
}

.community-heading {
  max-width: 820px;
  margin-bottom: clamp(34px, 6vw, 56px);
}

.sub-badge {
  display: block;
  margin-bottom: 12px;
  color: #0f8f98;
  font-size: 0.76rem;
  font-weight: 900;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.community-heading h2 {
  margin: 0;
  color: #243f4e;
  font-size: clamp(2.1rem, 5vw, 4rem);
  line-height: 1.04;
}

.community-heading p {
  max-width: 680px;
  margin: 20px 0 0;
  color: #5e7680;
  font-size: 1.04rem;
  line-height: 1.76;
}

.journal-strip-shell {
  padding: 0;
  background: transparent;
}

.journal-strip-mask {
  overflow: hidden;
}

.journal-track {
  display: flex;
  gap: 18px;
  align-items: flex-start;
  padding: 28px 24px 42px;
  width: max-content;
}

.journal-track.scrolling {
  animation: journalMarquee 68s linear infinite;
}

.journal-strip-mask:hover .journal-track.scrolling {
  animation-play-state: paused;
}

.journal-preview-card {
  position: relative;
  width: min(340px, 82vw);
  min-height: 326px;
  flex: 0 0 auto;
  padding: 22px;
  border: 1px dashed #d8cdbb;
  border-radius: 18px;
  background:
    linear-gradient(180deg, rgba(255, 253, 248, 0.98), rgba(247, 242, 231, 0.92)),
    repeating-linear-gradient(0deg, transparent 0 28px, rgba(36, 63, 78, 0.04) 29px);
  box-shadow: 0 12px 26px rgba(47,72,88,0.08);
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease;
}

.journal-preview-card::before {
  content: '';
  position: absolute;
  top: -9px;
  left: 34px;
  z-index: 2;
  width: 72px;
  height: 20px;
  background: rgba(245,223,154,0.52);
  border-left: 1px dashed rgba(47,72,88,0.08);
  border-right: 1px dashed rgba(47,72,88,0.08);
  transform: rotate(-4deg);
}

.journal-preview-card::after {
  content: '“';
  position: absolute;
  right: 22px;
  bottom: 8px;
  color: rgba(24,151,160,0.08);
  font-family: 'Playfair Display', serif;
  font-size: 7rem;
  line-height: 1;
  pointer-events: none;
}

.journal-preview-card.tilt-1 {
  margin-top: 26px;
}

.journal-preview-card.tilt-2 {
  margin-top: 8px;
}

.journal-preview-card.tilt-3 {
  margin-top: 38px;
}

.journal-preview-card:hover {
  border-color: rgba(24,151,160,0.48);
  background: #ffffff;
  box-shadow: 0 18px 36px rgba(15,143,152,0.13);
}

.save-journal-pin {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 2;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: rgba(213,106,60,0.34);
}

.journal-card-link {
  position: relative;
  z-index: 1;
  display: flex;
  height: 100%;
  flex-direction: column;
  color: inherit;
  text-decoration: none;
}

.journal-author-row {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 11px;
  align-items: center;
  max-width: calc(100% - 46px);
  margin-bottom: 16px;
}

.avatar-mark {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #deefec;
  color: #1897a0;
  font-weight: 900;
}

.journal-author-row strong,
.journal-author-row small {
  display: block;
}

.journal-author-row strong {
  color: #2f4858;
  font-size: 0.92rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.journal-author-row small {
  color: #7c6f63;
  font-size: 0.74rem;
  font-weight: 800;
}

.island-pill {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  max-width: 100%;
  padding: 6px 10px;
  border: 1px dashed rgba(24,151,160,0.24);
  border-radius: 999px;
  background: rgba(222,239,236,0.58);
  color: #1897a0;
  font-size: 0.75rem;
  font-weight: 900;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.journal-card-link h3 {
  margin: 18px 0 12px;
  color: #2f4858;
  font-size: 1.38rem;
  line-height: 1.18;
}

.journal-excerpt {
  flex: 1;
  margin: 0;
  padding: 14px;
  border-left: 3px solid rgba(24,151,160,0.28);
  border-radius: 12px;
  background: rgba(255,255,255,0.48);
  color: #64748b;
  font-size: 0.92rem;
  line-height: 1.62;
  display: -webkit-box;
  line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.journal-card-footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-top: 16px;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
}

.mini-tag {
  display: inline-flex;
  max-width: 118px;
  padding: 5px 8px;
  border-radius: 999px;
  background: #fff3cd;
  color: #8a5a00;
  font-size: 0.7rem;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.read-link {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  flex: 0 0 auto;
  color: #0d7f87;
  font-size: 0.86rem;
  font-weight: 900;
}

.journal-empty {
  min-height: 240px;
  display: grid;
  gap: 8px;
  place-items: center;
  border-radius: 8px;
  background: #fffdf8;
  color: #64748b;
  font-weight: 800;
  text-align: center;
}

.journal-empty a {
  color: #1897a0;
  font-weight: 900;
}

@keyframes journalMarquee {
  from {
    transform: translateX(0);
  }

  to {
    transform: translateX(calc(-50% - 9px));
  }
}

@media (prefers-reduced-motion: reduce) {
  .journal-track.scrolling {
    animation: none;
  }

  .journal-strip-mask {
    overflow-x: auto;
  }
}
</style>
