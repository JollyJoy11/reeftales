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
  padding-bottom: max(
    var(--page-footer-space, clamp(150px, 18vw, 230px)),
    env(safe-area-inset-bottom)
  ) !important;
}

@media (max-width: 767.98px) {
  .main-layout-content > :last-child {
    padding-bottom: max(
      var(--page-footer-space-mobile, 170px),
      env(safe-area-inset-bottom)
    ) !important;
  }
}
</style>
