import { createRouter, createWebHistory } from 'vue-router'
import { getCurrentUser } from './services/authService'

const routes = [
  { path: '/login', name: 'login', component: () => import('./views/LoginView.vue'), meta: { public: true, guestOnly: true } },
  { path: '/register', name: 'register', component: () => import('./views/RegisterView.vue'), meta: { public: true, guestOnly: true } },
  { path: '/', name: 'home', component: () => import('./views/HomeView.vue'), meta: { requiresAuth: true } },
  { path: '/settings', name: 'settings', component: () => import('./views/SettingsView.vue'), meta: { requiresAuth: true } },
  { path: '/words', name: 'words', component: () => import('./views/WordsView.vue'), meta: { requiresAuth: true } },
  { path: '/grammar', name: 'grammar', component: () => import('./views/GrammarView.vue'), meta: { requiresAuth: true } },
  { path: '/practice', name: 'practice', component: () => import('./views/PracticeView.vue'), meta: { requiresAuth: true } },
  { path: '/wrong-book', name: 'wrong-book', component: () => import('./views/WrongBookView.vue'), meta: { requiresAuth: true } },
  { path: '/favorites', name: 'favorites', component: () => import('./views/FavoritesView.vue'), meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  const user = await getCurrentUser()
  if (to.meta.guestOnly && user) return { path: '/' }
  if (to.meta.requiresAuth && !user) return { path: '/login', query: { redirect: to.fullPath } }
  return true
})

export default router
