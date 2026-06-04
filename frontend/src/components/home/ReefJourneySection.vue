<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import AppStampFrame from '@/components/common/AppStampFrame.vue'

gsap.registerPlugin(ScrollTrigger)

const sectionRef = ref(null)
const { t } = useI18n()

const stops = computed(() => [
  {
    name: t('home.hero.stops.sipadan.name'),
    country: t('home.hero.stops.sipadan.country'),
    detail: t('home.hero.stops.sipadan.detail'),
    icon: 'bi bi-compass',
    tone: 'teal'
  },
  {
    name: t('home.hero.stops.maldives.name'),
    country: t('home.hero.stops.maldives.country'),
    detail: t('home.hero.stops.maldives.detail'),
    icon: 'bi bi-water',
    tone: 'blue'
  },
  {
    name: t('home.hero.stops.greatBarrierReef.name'),
    country: t('home.hero.stops.greatBarrierReef.country'),
    detail: t('home.hero.stops.greatBarrierReef.detail'),
    icon: 'bi bi-brightness-alt-high',
    tone: 'amber'
  }
])

let ctx

onMounted(async () => {
  await nextTick()

  ctx = gsap.context(() => {
    const heroTimeline = gsap.timeline({
      defaults: { ease: 'power3.out' }
    })

    heroTimeline
      .from('.journey-copy > *', {
        y: 24,
        autoAlpha: 0,
        duration: 0.72,
        stagger: 0.08
      })
      .from(
        '.visual-layer',
        {
          y: 34,
          autoAlpha: 0,
          duration: 0.78,
          stagger: 0.12
        },
        '-=0.45'
      )

    gsap.to('.route-thread', {
      scrollTrigger: {
        trigger: sectionRef.value,
        start: 'top top+=80',
        end: 'bottom top',
        scrub: 0.7
      },
      scaleX: 1,
      transformOrigin: 'left center',
      ease: 'none'
    })

    gsap.to('.visual-board', {
      scrollTrigger: {
        trigger: sectionRef.value,
        start: 'top top+=80',
        end: 'bottom top',
        scrub: 0.8
      },
      y: -28,
      ease: 'none'
    })

    gsap.from('.journey-stop-card', {
      scrollTrigger: {
        trigger: '.journey-route',
        start: 'top 82%',
        toggleActions: 'play none none reverse'
      },
      y: 42,
      autoAlpha: 0,
      stagger: 0.16,
      duration: 0.78,
      immediateRender: false,
      ease: 'power3.out'
    })
  }, sectionRef.value)

  requestAnimationFrame(() => {
    requestAnimationFrame(() => ScrollTrigger.refresh())
  })
})

onBeforeUnmount(() => {
  ctx?.revert()
})
</script>

<template>
  <section ref="sectionRef" class="reef-journey-section">
    <div class="journey-shell">
      <div class="journey-board">
        <div class="journey-copy">
          <span class="eyebrow">{{ t('home.hero.eyebrow') }}</span>
          <h1>{{ t('home.hero.title') }}</h1>
          <p>{{ t('home.hero.intro') }}</p>

          <div class="journey-actions">
            <RouterLink to="/discovery" class="primary-action">
              <i class="bi bi-compass"></i>
              {{ t('home.hero.exploreDiscovery') }}
            </RouterLink>
            <RouterLink to="/planner" class="secondary-action">
              <i class="bi bi-signpost-split"></i>
              {{ t('home.hero.planTrip') }}
            </RouterLink>
          </div>
        </div>

        <div class="journey-visual" :aria-label="t('home.hero.routePreviewAria')">
          <div class="visual-board visual-layer">
            <div class="stamp-wrap stamp-main">
              <AppStampFrame image="/images/postcard.jpg" :alt="t('home.hero.islandPostcardAlt')" :contain="false" />
            </div>

            <div class="stamp-wrap stamp-turtle">
              <AppStampFrame image="/images/stamp-turtle.jpg" :alt="t('home.hero.turtleStampAlt')" :contain="false" />
            </div>

            <div class="route-note">
              <span>{{ t('home.hero.routeLabel') }}</span>
              <strong>{{ t('home.hero.routeTitle') }}</strong>
              <small>{{ t('home.hero.routeDetail') }}</small>
            </div>
          </div>
        </div>
      </div>

      <div class="journey-route">
        <div class="route-thread"></div>

        <article
          v-for="(stop, index) in stops"
          :key="stop.name"
          :class="['journey-stop-card', stop.tone]"
        >
          <span class="stop-number">{{ String(index + 1).padStart(2, '0') }}</span>
          <span class="stop-icon"><i :class="stop.icon"></i></span>
          <div>
            <strong>{{ stop.name }}</strong>
            <small>{{ stop.country }}</small>
            <p>{{ stop.detail }}</p>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.reef-journey-section {
  position: relative;
  padding: 28px 0 34px;
  background:
    radial-gradient(circle at 12% 8%, rgba(169,216,214,0.36), transparent 30%),
    linear-gradient(180deg, #fffdf8 0%, #f6ecdc 100%);
}

.journey-shell {
  width: min(1240px, calc(100% - 32px));
  margin: 0 auto;
}

.journey-board {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 0.9fr);
  gap: clamp(22px, 5vw, 54px);
  align-items: center;
  min-height: clamp(520px, calc(100vh - 210px), 660px);
  padding: clamp(24px, 5vw, 42px);
  overflow: hidden;
  border: 1px dashed var(--border);
  border-radius: 24px;
  background:
    linear-gradient(180deg, rgba(255,253,248,0.97), rgba(251,247,239,0.97)),
    repeating-linear-gradient(0deg, transparent 0 31px, rgba(216,205,187,0.28) 32px);
  box-shadow: 0 16px 34px rgba(47,72,88,0.09);
}

.journey-copy,
.journey-visual {
  position: relative;
  z-index: 1;
}

.eyebrow,
.stop-number,
.route-note span {
  color: var(--accent);
  font-size: 0.76rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.journey-copy h1 {
  max-width: 760px;
  margin: 8px 0 16px;
  color: var(--text-primary);
  font-size: clamp(2.25rem, 5vw, 4.25rem);
  font-weight: 900;
  line-height: 1.04;
}

.journey-copy p {
  max-width: 630px;
  margin: 0;
  color: var(--text-secondary);
  font-size: 1.04rem;
  line-height: 1.7;
}

.journey-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 26px;
}

.primary-action,
.secondary-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 18px;
  border-radius: 999px;
  font-weight: 900;
  text-decoration: none;
  transition:
    box-shadow 0.18s ease,
    background 0.18s ease,
    color 0.18s ease,
    border-color 0.18s ease;
}

.primary-action {
  border: 1px solid var(--accent);
  background: var(--accent);
  color: #ffffff;
  box-shadow: 0 12px 24px rgba(24,151,160,0.22);
}

.secondary-action {
  border: 1px solid var(--accent);
  background: var(--surface);
  color: var(--accent);
}

.primary-action:hover,
.primary-action:focus-visible {
  background: var(--accent-strong);
  color: #ffffff;
  box-shadow: 0 14px 26px rgba(24,151,160,0.24);
}

.secondary-action:hover,
.secondary-action:focus-visible {
  background: var(--accent-soft);
  color: var(--accent-strong);
}

.journey-visual {
  min-height: 460px;
}

.visual-board {
  position: absolute;
  inset: 0;
  will-change: transform;
}

.visual-layer {
  transform: translateZ(0);
}

.stamp-wrap {
  position: absolute;
  transition:
    filter 0.2s ease,
    transform 0.22s cubic-bezier(0.2, 0.9, 0.22, 1);
  will-change: transform;
}

.stamp-wrap:hover {
  filter: brightness(1.02);
}

.stamp-main {
  top: 12px;
  right: 28px;
  width: min(430px, 88%);
  height: 310px;
  transform: rotate(1.8deg);
  z-index: 2;
}

.stamp-turtle {
  left: 12px;
  bottom: 40px;
  width: 204px;
  height: 242px;
  transform: rotate(-5deg);
  z-index: 3;
}

.stamp-main:hover {
  transform: rotate(1.8deg) translate(12px, -20px);
}

.stamp-turtle:hover {
  transform: rotate(-5deg) translate(-10px, -15px);
}

.stamp-wrap :deep(.app-stamp-frame) {
  --stamp-size: 16px;
}

.route-note {
  position: absolute;
  right: 0;
  bottom: 22px;
  z-index: 6;
  width: min(330px, 78%);
  padding: 18px;
  border: 1px dashed var(--border);
  border-radius: 18px;
  background: rgba(255,253,248,0.95);
  box-shadow: 0 14px 28px rgba(47,72,88,0.1);
}

.route-note strong {
  display: block;
  margin: 5px 0 3px;
  color: var(--text-primary);
}

.route-note small,
.journey-stop-card small,
.journey-stop-card p {
  color: var(--text-secondary);
}

.journey-route {
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  margin-top: 20px;
}

.route-thread {
  position: absolute;
  top: 50%;
  left: 18px;
  right: 18px;
  z-index: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--accent), #d56a3c);
  transform: scaleX(0.08);
  opacity: 0.28;
  pointer-events: none;
}

.journey-stop-card {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: auto 42px minmax(0, 1fr);
  gap: 14px;
  align-items: start;
  min-height: 150px;
  padding: 18px;
  border: 1px dashed var(--border);
  border-radius: 18px;
  background: var(--surface);
  box-shadow: 0 12px 26px rgba(47,72,88,0.08);
  transition:
    box-shadow 0.18s ease,
    border-color 0.18s ease,
    background 0.18s ease;
}

.journey-stop-card:hover,
.journey-stop-card:focus-within {
  border-color: rgba(24,151,160,0.55);
  background: #ffffff;
  box-shadow: 0 16px 30px rgba(47,72,88,0.12);
}

.stop-icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 1.1rem;
}

.blue .stop-icon {
  background: #e0f2fe;
  color: #147a9b;
}

.amber .stop-icon {
  background: #fff3cd;
  color: #8a5a00;
}

.journey-stop-card strong {
  display: block;
  color: var(--text-primary);
}

.journey-stop-card p {
  margin: 6px 0 0;
  font-size: 0.86rem;
  line-height: 1.5;
}

@media (max-width: 991px) {
  .journey-board,
  .journey-route {
    grid-template-columns: 1fr;
  }

  .journey-board {
    min-height: auto;
  }

  .journey-visual {
    min-height: 410px;
  }

  .route-thread {
    top: 22px;
  }
}

@media (max-width: 575px) {
  .journey-shell {
    width: min(100% - 20px, 1240px);
  }

  .journey-board {
    padding: 22px;
  }

  .journey-visual {
    min-height: 360px;
  }

  .stamp-main {
    right: 0;
    width: 100%;
    height: 230px;
  }

  .stamp-turtle {
    width: 158px;
    height: 188px;
  }

  .route-note {
    width: 84%;
  }
}
</style>
