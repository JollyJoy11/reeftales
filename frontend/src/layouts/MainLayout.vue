<script setup>
	import Navbar from '../components/layout/Navbar.vue'
	import Footer from '../components/layout/Footer.vue'
</script>

<template>
  <Navbar />

	<main class="main-layout-content">
		<slot />
	</main>
	
  <Footer />
</template>

<style>
.main-layout-content {
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.main-layout-content > :last-child {
  padding-bottom: clamp(150px, 18vw, 230px) !important;
}

@media (max-width: 767.98px) {
  .main-layout-content > :last-child {
    padding-bottom: 170px !important;
  }
}
</style>
