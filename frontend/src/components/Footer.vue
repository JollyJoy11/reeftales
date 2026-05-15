<script setup>
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()
</script>

<template>
  <footer class="border-top mt-5 py-5">
    <div class="container">
      <div class="row">

        <div class="col-md-4 mb-4">
          <h4 class="fw-bold">🌊 Reef Tales</h4>
          <p class="text-muted">
            Discover islands, document marine sightings, and share unforgettable ocean adventures.
          </p>
        </div>

        <div class="col-md-2 mb-4">
          <h6 class="fw-bold">Discover</h6>
          <ul class="list-unstyled footer-links">
            <li><RouterLink to="/discovery">Discovery Hub</RouterLink></li>
            <li><RouterLink to="/community">Community Diaries</RouterLink></li>
            <li><RouterLink to="/planner">Trip Planner</RouterLink></li>
          </ul>
        </div>

        <div class="col-md-2 mb-4">
          <h6 class="fw-bold">Account</h6>
          <ul class="list-unstyled footer-links">
            <template v-if="authStore.isLoggedIn">
              <li><RouterLink to="/dashboard">My Journeys</RouterLink></li>
              <li><RouterLink to="/settings">Settings</RouterLink></li>
            </template>

            <template v-else>
              <li><RouterLink to="/login">Login</RouterLink></li>
              <li><RouterLink to="/register">Register</RouterLink></li>
            </template>
          </ul>
        </div>

        <div class="col-md-4 mb-4">
          <h6 class="fw-bold">Accessibility</h6>
          <p class="text-muted mb-2">Language:</p>

          <select class="form-select">
            <option>English</option>
            <option>Bahasa Melayu</option>
            <option>中文</option>
          </select>
        </div>

      </div>

      <hr />

      <div class="text-center text-muted">
        © 2026 Reef Tales • Made for ocean explorers
      </div>
    </div>
  </footer>
</template>

<style scoped>
footer {
  background: #efe7dc;
}

.footer-links a {
  color: #6b7280;
  text-decoration: none;
}

.footer-links a:hover {
  color: #D66967;
}

.form-select {
  border-color: #C4A484;
  background: #fffdf8;
}
</style>