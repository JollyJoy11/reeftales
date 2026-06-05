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

<style scoped>
.main-layout-content {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: clip;
}
</style>
