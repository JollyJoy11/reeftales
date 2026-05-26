import { createRouter, createWebHistory } from 'vue-router'

import Home from '../pages/Homepage.vue'
import Discovery from '../pages/DiscoveryHubPage.vue'
import IslandDetails from '../pages/IslandDetailPage.vue'
import Community from '../pages/CommunityPage.vue'
import Journal from '../pages/JournalDetailPage.vue'
import Login from '../pages/LoginPage.vue'
import Register from '../pages/RegisterPage.vue'
import Dashboard from '../pages/DashboardPage.vue'
import CreateJournal from '../pages/CreateJournalPage.vue'
import Planner from '../pages/TripPlannerPage.vue'
import Settings from '../pages/SettingsPage.vue'

const routes = [
  { path: '/', component: Home },

  { path: '/discovery', component: Discovery },
  { path: '/discovery/island/:id', component: IslandDetails },

  { path: '/community', component: Community },
  { path: '/journal/:id', component: Journal },

  { path: '/login', component: Login },
  { path: '/register', component: Register },

  { path: '/dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/saved-islands', redirect: '/dashboard' },
  { path: '/journal/create', component: CreateJournal, meta: { requiresAuth: true } },
  { path: '/planner', component: Planner, meta: { requiresAuth: true } },
  { path: '/settings', component: Settings, meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  const token = localStorage.getItem('token')

  if (to.meta.requiresAuth && !token) {
    return {
      path: '/login',
      query: { redirect: to.fullPath }
    }
  }
})

export default router
