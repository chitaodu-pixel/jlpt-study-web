import { createRouter, createWebHistory } from 'vue-router'
import { getCurrentUser } from './services/authService'

const routes = [
  { path: '/login', name: 'login', component: () => import('./views/LoginView.vue'), meta: { public: true } },
  { path: '/register', name: 'register', component: () => import('./views/RegisterView.vue'), meta: { public: true } },
  { path: '/', name: 'home', component: () => import('./views/HomeView.vue') },
  { path: '/settings', name: 'settings', component: () => import('./views/SettingsView.vue') },
  { path: '/words', name: 'words', component: () => import('./views/WordsView.vue') },
  { path: '/grammar', name: 'grammar', component: () => import('./views/GrammarView.vue') },
  { path: '/practice', name: 'practice', component: () => import('./views/PracticeView.vue') },
  { path: '/wrong-book', name: 'wrong-book', component: () => import('./views/WrongBookView.vue') },
  { path: '/favorites', name: 'favorites', component: () => import('./views/FavoritesView.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  if (to.meta.public) return true
  const user = await getCurrentUser()
  if (!user) return { path: '/login', query: { redirect: to.fullPath } }
  return true
})

export default router
