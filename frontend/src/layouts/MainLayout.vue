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

.main-layout-content::after {
  content: "";
  display: block;
  height: 132px;
}

@media (max-width: 767.98px) {
  .main-layout-content::after {
    height: 96px;
  }
}
</style>
