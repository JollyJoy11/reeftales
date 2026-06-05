<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const sectionRef = ref(null)
const { t } = useI18n()

const features = computed(() => [
  {
    icon: 'bi bi-binoculars',
    step: '01',
    title: t('home.features.cards.scout.title'),
    text: t('home.features.cards.scout.text')
  },
  {
    icon: 'bi bi-signpost-split',
    step: '02',
    title: t('home.features.cards.route.title'),
    text: t('home.features.cards.route.text')
  },
  {
    icon: 'bi bi-journal-richtext',
    step: '03',
    title: t('home.features.cards.tale.title'),
    text: t('home.features.cards.tale.text')
  }
])

let ctx

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.body.classList.contains('reduced-motion-mode')
}

onMounted(() => {
  if (prefersReducedMotion()) {
    gsap.set('.feature-heading > *, .feature-card', {
      clearProps: 'transform',
      autoAlpha: 1
    })
    return
  }

  ctx = gsap.context(() => {
    gsap.fromTo(
      '.feature-heading > *',
      {
        y: 34,
        autoAlpha: 0
      },
      {
        scrollTrigger: {
          trigger: sectionRef.value,
          start: 'top 78%',
          toggleActions: 'play none none none',
          invalidateOnRefresh: true
        },
        y: 0,
        autoAlpha: 1,
        duration: 0.85,
        stagger: 0.08,
        ease: 'power3.out'
      }
    )

    gsap.fromTo(
      '.feature-card',
      {
        autoAlpha: 0,
        y: 92,
        rotation: (index) => [-2.2, 1.4, -1][index] ?? 1
      },
      {
        scrollTrigger: {
          trigger: '.feature-grid',
          start: 'top 82%',
          toggleActions: 'play none none none',
          invalidateOnRefresh: true
        },
        autoAlpha: 1,
        y: 0,
        rotation: 0,
        transformOrigin: '50% 80%',
        stagger: 0.2,
        duration: 1.05,
        ease: 'power4.out'
      }
    )
  }, sectionRef.value)
})

onBeforeUnmount(() => {
  ctx?.revert()
})
</script>

<template>
  <section ref="sectionRef" class="feature-section">
    <div class="container">
      <div class="feature-heading">
        <span class="sub-badge">{{ t('home.features.eyebrow') }}</span>
        <h2>{{ t('home.features.title') }}</h2>
        <p>{{ t('home.features.intro') }}</p>
      </div>

      <div class="feature-grid">
        <article v-for="feature in features" :key="feature.step" class="feature-card">
          <div class="feature-topline">
            <span class="step-num">{{ feature.step }}</span>
            <span class="icon-mark"><i :class="feature.icon"></i></span>
          </div>
          <h3>{{ feature.title }}</h3>
          <p>{{ feature.text }}</p>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.feature-section {
  position: relative;
  z-index: 2;
  padding: clamp(72px, 9vw, 112px) 0 clamp(64px, 9vw, 100px);
  background:
    radial-gradient(circle at top left, rgba(169,216,214,0.22), transparent 30%),
    linear-gradient(180deg, #fffdf8 0%, var(--surface-soft) 100%);
}

.feature-heading {
  max-width: 780px;
  margin-bottom: clamp(44px, 7vw, 72px);
}

.feature-heading > *,
.feature-card {
  opacity: 0;
  visibility: hidden;
}

.sub-badge {
  display: block;
  margin-bottom: 12px;
  color: var(--accent);
  font-size: 0.76rem;
  font-weight: 900;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.feature-heading h2 {
  margin: 0;
  color: #243f4e;
  font-size: clamp(2.15rem, 5vw, 4rem);
  line-height: 1.02;
}

.feature-heading p {
  max-width: 650px;
  margin: 20px 0 0;
  color: #5e7680;
  font-size: 1.04rem;
  line-height: 1.75;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 22px;
  perspective: 1000px;
}

.feature-card {
  min-height: 320px;
  padding: clamp(26px, 4vw, 38px);
  border: 1px solid rgba(150,128,100,0.36);
  border-radius: 18px;
  background:
    linear-gradient(180deg, #ffffff 0%, #f2e6d5 100%),
    repeating-linear-gradient(0deg, transparent 0 31px, rgba(121,97,70,0.08) 32px);
  box-shadow:
    0 20px 42px rgba(47,72,88,0.15),
    inset 0 0 0 1px rgba(255,255,255,0.62);
  will-change: transform, opacity;
}

.feature-card:nth-child(2) {
  margin-top: 34px;
}

.feature-card:nth-child(3) {
  margin-top: 68px;
}

.feature-card:hover {
  border-color: rgba(var(--accent-rgb),0.45);
  box-shadow:
    0 24px 48px rgba(15, 143, 152, 0.16),
    inset 0 0 0 1px rgba(255,255,255,0.72);
}

.feature-topline {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 44px;
}

.step-num {
  color: rgba(15, 143, 152, 0.34);
  font-family: 'Playfair Display', serif;
  font-size: 3rem;
  font-weight: 700;
  line-height: 0.9;
}

.icon-mark {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border: 1px solid rgba(15, 143, 152, 0.2);
  border-radius: 50%;
  color: var(--accent);
  background: var(--surface);
  font-size: 1.2rem;
}

.feature-card h3 {
  margin: 0 0 14px;
  color: #243f4e;
  font-size: 1.45rem;
}

.feature-card p {
  margin: 0;
  color: #5e7680;
  font-size: 0.96rem;
  line-height: 1.72;
}

@media (max-width: 991px) {
  .feature-grid {
    grid-template-columns: 1fr;
  }

  .feature-card:nth-child(n) {
    margin-top: 0;
    min-height: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .feature-heading > *,
  .feature-card {
    opacity: 1;
    visibility: visible;
  }
}

:global(body.reduced-motion-mode) .feature-heading > *,
:global(body.reduced-motion-mode) .feature-card {
  opacity: 1;
  visibility: visible;
}
</style>
