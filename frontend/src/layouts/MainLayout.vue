<script setup>
	import Navbar from '../components/layout/Navbar.vue'
	import Footer from '../components/layout/Footer.vue'
</script>

<template>
  <Navbar />

	<main>
		<slot />
	</main>
	
  <Footer />
</template>
