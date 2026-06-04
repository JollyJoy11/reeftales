import { createRouter, createWebHistory } from 'vue-router'

import Home from '../pages/Homepage.vue'
import Discovery from '../pages/DiscoveryHubPage.vue'
import IslandDetails from '../pages/IslandDetailPage.vue'
import Community from '../pages/CommunityPage.vue'
import Journal from '../pages/JournalDetailPage.vue'
import AuthLayout from '../layouts/AuthLayout.vue'
import Login from '../pages/LoginPage.vue'
import Register from '../pages/RegisterPage.vue'
import ForgotPassword from '../pages/ForgotPasswordPage.vue'
import ResetPassword from '../pages/ResetPasswordPage.vue'
import Dashboard from '../pages/DashboardPage.vue'
import CreateJournal from '../pages/CreateJournalPage.vue'
import Planner from '../pages/TripPlannerPage.vue'
import Settings from '../pages/SettingsPage.vue'
import SpeciesDetail from '../pages/SpeciesDetailPage.vue'
import { useToastStore } from '@/stores/toastStore'

const routes = [
  { path: '/', component: Home, meta: { title: 'Home' } },

  { path: '/discovery', component: Discovery, meta: { title: 'Discovery' } },
  { path: '/discovery/island/:id', component: IslandDetails, meta: { title: 'Island Details' } },
  { path: '/discovery/species/:id', component: SpeciesDetail, meta: { title: 'Species Details'} },

  { path: '/community', component: Community, meta: { title: 'Community' } },
  { path: '/journal/:id', component: Journal, meta: { title: 'Journal Details' } },

  {
    path: '/',
    component: AuthLayout,
    children: [
      { path: 'login', component: Login, meta: { title: 'Log In' } },
      { path: 'register', component: Register, meta: { title: 'Create Account' } },
      { path: 'forgot-password', component: ForgotPassword, meta: { title: 'Forgot Password' } },
      { path: 'reset-password/:token', component: ResetPassword, meta: { title: 'Reset Password' } }
    ]
  },

  { path: '/dashboard', component: Dashboard, meta: { requiresAuth: true, title: 'My Logbook' } },
  { path: '/journal/create', component: CreateJournal, meta: { requiresAuth: true, title: 'Create Journal' } },
  { path: '/planner', component: Planner, meta: { requiresAuth: true, title: 'Trip Planner' } },
  { path: '/settings', component: Settings, meta: { requiresAuth: true, title: 'Settings' } },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  const token = localStorage.getItem('token')

  if (to.meta.requiresAuth && !token) {
    const toastStore = useToastStore()
    toastStore.danger('Please log in to access this page.')

    return {
      path: '/login',
      query: { redirect: to.fullPath }
    }
  }
})

router.afterEach((to) => {
  document.title = to.meta.title
    ? `${to.meta.title} | ReefTales`
    : 'ReefTales'
})

export default router
