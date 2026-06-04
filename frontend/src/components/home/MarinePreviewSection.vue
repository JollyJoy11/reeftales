<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import AppStampFrame from '@/components/common/AppStampFrame.vue'
import { getSpecies } from '@/services/speciesService'

gsap.registerPlugin(ScrollTrigger)

const sectionRef = ref(null)
const species = ref([])
const loading = ref(true)
const { t } = useI18n()

const displaySpecies = computed(() => species.value.slice(0, 4))

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5)
}

function depthLabel(item) {
  if (item.min_depth == null || item.max_depth == null) return item.habitats || t('home.marine.profileFallback')
  return `${item.min_depth}-${item.max_depth} m`
}

function speciesImage(item) {
  return item.image_url || '/images/island-placeholder.jpg'
}

async function loadMarineSpecies() {
  try {
    const data = await getSpecies()
    species.value = shuffle(Array.isArray(data) ? data : []).slice(0, 4)
  } catch {
    species.value = []
  } finally {
    loading.value = false
  }
}

let ctx

onMounted(async () => {
  await loadMarineSpecies()
  await nextTick()

  ctx = gsap.context(() => {
    gsap.to('.panel-bubble', {
      x: (index) => [22, -18, 16][index] ?? 12,
      y: (index) => [-28, 22, -18][index] ?? -18,
      duration: (index) => [6.4, 7.6, 6.8][index] ?? 6,
      stagger: 0.2,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1
    })

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.value,
        start: 'top 74%',
        toggleActions: 'play none none none',
        invalidateOnRefresh: true
      }
    })

    timeline
      .fromTo(
        '.marine-copy > *',
        {
          y: 30,
          autoAlpha: 0
        },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.78,
          stagger: 0.08,
          ease: 'power3.out'
        }
      )
      .fromTo(
        '.species-postcard',
        {
          y: 58,
          rotation: (index) => [-1.4, 1, -0.8, 1.2][index] ?? 0,
          autoAlpha: 0
        },
        {
          y: 0,
          rotation: 0,
          autoAlpha: 1,
          transformOrigin: '50% 85%',
          duration: 0.86,
          stagger: 0.14,
          ease: 'power3.out'
        },
        '-=0.38'
      )
  }, sectionRef.value)

})

onBeforeUnmount(() => {
  ctx?.revert()
})
</script>

<template>
  <section ref="sectionRef" class="marine-section">
    <div class="container">
      <div class="marine-postcard-panel">
        <div class="marine-inner">
          <div class="panel-bubble bubble-a"></div>
          <div class="panel-bubble bubble-b"></div>
          <div class="panel-bubble bubble-c"></div>

          <div class="marine-copy">
            <span class="sub-badge">{{ t('home.marine.eyebrow') }}</span>
            <h2>{{ t('home.marine.title') }}</h2>
            <p>{{ t('home.marine.intro') }}</p>
            <RouterLink to="/discovery?mode=marine" class="action-link">
              {{ t('home.marine.action') }} <i class="bi bi-arrow-right"></i>
            </RouterLink>
          </div>

          <div v-if="loading" class="species-empty">
            {{ t('home.marine.loading') }}
          </div>

          <div v-else-if="displaySpecies.length" class="species-grid">
            <article
              v-for="(item, index) in displaySpecies"
              :key="item.id"
              class="species-postcard"
            >
              <div class="species-image-wrap">
                <AppStampFrame
                  class="species-stamp"
                  :image="speciesImage(item)"
                  :alt="t('home.marine.speciesAlt', { name: item.name })"
                  :contain="false"
                />
              </div>

              <div class="species-body">
                <small>{{ depthLabel(item) }}</small>
                <strong>{{ item.name }}</strong>
                <p>{{ item.description || item.scientific_name || t('home.marine.databaseFallback') }}</p>
              </div>
            </article>
          </div>

          <div v-else class="species-empty">
            {{ t('home.marine.empty') }}
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.marine-section {
  position: relative;
  z-index: 2;
  overflow: hidden;
  padding: clamp(72px, 9vw, 112px) 0;
  background:
    radial-gradient(circle at 86% 18%, rgba(169,216,214,0.35), transparent 28%),
    linear-gradient(180deg, var(--surface-soft) 0%, #f6ecdc 100%);
}

.marine-postcard-panel {
  padding: 10px;
  border-radius: 14px;
  background: repeating-linear-gradient(
    135deg,
    #e85d5d 0 12px,
    #ffffff 12px 24px,
    #2c9ab7 24px 36px,
    #ffffff 36px 48px
  );
  box-shadow: 0 18px 45px rgba(47,72,88,0.14);
}

.marine-inner {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 0.82fr) minmax(0, 1.18fr);
  gap: clamp(34px, 6vw, 76px);
  align-items: center;
  overflow: hidden;
  padding: clamp(26px, 5vw, 46px);
  border-radius: 8px;
  background: var(--surface-soft);
}

.marine-copy,
.species-grid,
.species-empty {
  position: relative;
  z-index: 1;
}

.marine-copy > *,
.species-postcard {
  opacity: 0;
  visibility: hidden;
}

.panel-bubble {
  position: absolute;
  z-index: 2;
  border-radius: 50%;
  pointer-events: none;
  background: radial-gradient(circle at 36% 36%, rgba(24,151,160,0.24), rgba(255,255,255,0.86) 40%, rgba(24,151,160,0.08) 64%, transparent 72%);
  border: 1px solid rgba(24,151,160,0.18);
  box-shadow: 0 0 24px rgba(24,151,160,0.12);
}

.bubble-a {
  width: 128px;
  height: 128px;
  top: 12%;
  left: 42%;
}

.bubble-b {
  width: 74px;
  height: 74px;
  right: 8%;
  top: 12%;
}

.bubble-c {
  width: 96px;
  height: 96px;
  left: 34%;
  bottom: 12%;
}


.sub-badge {
  display: block;
  color: var(--accent);
  font-size: 0.76rem;
  font-weight: 900;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.marine-copy h2 {
  margin: 12px 0 20px;
  color: var(--text-primary);
  font-size: clamp(2.05rem, 4.4vw, 3.7rem);
  line-height: 1.04;
}

.marine-copy p {
  margin: 0 0 28px;
  color: var(--text-secondary);
  font-size: 1.02rem;
  line-height: 1.76;
}

.action-link {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  color: #0d7f87;
  font-weight: 900;
  text-decoration: none;
}

.action-link:hover {
  color: #243f4e;
}

.species-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.species-postcard {
  position: relative;
  padding: 12px;
  border: 1px dashed var(--border);
  border-radius: 18px;
  background: var(--surface);
  box-shadow: 0 12px 26px rgba(47,72,88,0.08);
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease;
}

.species-postcard::before {
  content: '';
  position: absolute;
  top: -8px;
  right: 22px;
  width: 56px;
  height: 18px;
  background: rgba(245,223,154,0.48);
  transform: rotate(4deg);
}

.species-postcard:hover {
  border-color: rgba(24,151,160,0.48);
  background: #ffffff;
  box-shadow: 0 18px 36px rgba(15,143,152,0.13);
}

.species-postcard:nth-child(2),
.species-postcard:nth-child(4) {
  margin-top: 30px;
}

.species-image-wrap {
  height: 150px;
  margin-bottom: 14px;
  transform: rotate(-1deg);
}

.species-postcard:nth-child(2) .species-image-wrap,
.species-postcard:nth-child(4) .species-image-wrap {
  transform: rotate(1deg);
}

.species-stamp {
  --stamp-radius: 5px;
  --stamp-size: 15px;
}

.species-body {
  padding: 4px 4px 6px;
}

.species-body small {
  display: block;
  margin-bottom: 4px;
  color: var(--accent);
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.species-body strong {
  display: block;
  color: var(--text-primary);
  font-size: 1.18rem;
  line-height: 1.2;
}

.species-body p {
  margin: 8px 0 0;
  color: var(--text-secondary);
  font-size: 0.84rem;
  line-height: 1.55;
  display: -webkit-box;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.species-empty {
  min-height: 260px;
  display: grid;
  place-items: center;
  border: 1px dashed var(--border);
  border-radius: 18px;
  background: var(--surface);
  color: var(--text-secondary);
  font-weight: 800;
}

@media (max-width: 991px) {
  .marine-inner,
  .species-grid {
    grid-template-columns: 1fr;
  }

  .species-postcard:nth-child(n) {
    margin-top: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .marine-copy > *,
  .species-postcard {
    opacity: 1;
    visibility: visible;
  }
}

:global(body.reduced-motion-mode) .marine-copy > *,
:global(body.reduced-motion-mode) .species-postcard {
  opacity: 1;
  visibility: visible;
}
</style>
