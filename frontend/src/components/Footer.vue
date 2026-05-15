<script setup>
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()
</script>

<template>
  <footer class="border-top mt-5 py-5">
    <div class="container">
      <div class="row">

        <div class="col-md-4 mb-3">
          <div class="website-brand">
            <img src="/images/reeftale_logo_c.png" alt="Reef Tales logo" class="brand-logo" />
            <h4 class="fw-bold">Reef Tales</h4>
          </div>
          <p class="text-muted">
            Discover islands, document marine sightings, and share unforgettable ocean adventures.
          </p>
        </div>

        <div class="col-md-2 mb-3">
          <h6 class="fw-bold">Discover</h6>
          <ul class="list-unstyled footer-links">
            <li><RouterLink to="/discovery">Discovery Hub</RouterLink></li>
            <li><RouterLink to="/community">Community Diaries</RouterLink></li>
            <li><RouterLink to="/planner">Trip Planner</RouterLink></li>
          </ul>
        </div>

        <div class="col-md-2 mb-3">
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

        <div class="col-md-4 mb-3">
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
@import url('https://fonts.googleapis.com/css2?family=Spectral:ital,wght@1,700&display=swap');

footer {
  background: #efe7dc;
}

.website-brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.website-brand h4{
  padding-top: 8px;
  font-family: 'Spectral', serif;
  color: #1897a0;
  font-size: 36px;
}

.brand-logo {
  width: 45px;
  height: 45px;
  object-fit: contain;
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