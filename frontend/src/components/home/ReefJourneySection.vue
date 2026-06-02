<!-- <script setup>
import { ref, onMounted } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const activeIsland = ref(0)

const islands = [
  {
    name: 'Sipadan',
    description: 'World-famous diving paradise'
  },
  {
    name: 'Mabul',
    description: 'Macro marine biodiversity hotspot'
  },
  {
    name: 'Perhentian',
    description: 'Crystal clear tropical waters'
  },
  {
    name: 'Redang',
    description: 'Coral reefs and turtle encounters'
  }
]

onMounted(() => {
  gsap.utils.toArray('.story-step').forEach((step, index) => {
    ScrollTrigger.create({
      trigger: step,
      start: 'top center',
      end: 'bottom center',

      onEnter: () => {
        activeIsland.value = index
      },

      onEnterBack: () => {
        activeIsland.value = index
      }
    })
  })
})
</script>

<template>
  <section class="reef-journey">
    <div class="sticky-map">
      <div
        class="map-container"
        :style="{
          transform: `scale(${1 + activeIsland * 0.15})`
        }"
      >
        <img src="/images/malaysia-map.svg">
      </div>
    </div>

    <div class="story-column">
      <article
        v-for="(island,index) in islands"
        :key="island.name"
        class="story-step"
      >
        <span>
          Island {{ index + 1 }}
        </span>

        <h2>
          {{ island.name }}
        </h2>

        <p>
          {{ island.description }}
        </p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.reef-journey{
  display:grid;
  grid-template-columns:1fr 1fr;
  min-height:400vh;
}

.sticky-map{
  position:sticky;
  top:0;
  height:100vh;
  display:flex;
  align-items:center;
  justify-content:center;
}

.map-container{
  transition:0.8s ease;
}

.map-container img{
  width:650px;
}

.story-column{
  padding-top:20vh;
}

.story-step{
  height:100vh;
  display:flex;
  flex-direction:column;
  justify-content:center;
}
</style> -->