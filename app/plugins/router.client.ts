export default defineNuxtPlugin(() => {
  if (process.client) {
    // Tắt Vue Router warnings cho DevTools routes
    const originalPush = window.history.pushState
    const originalReplace = window.history.replaceState
    
    window.history.pushState = function(...args) {
      const url = args[2]
      if (url && typeof url === 'string' && (url.includes('__nuxt_devtools__') || url.includes('_vfs.json'))) {
        console.warn('Blocked DevTools navigation:', url)
        return
      }
      return originalPush.apply(this, args)
    }
    
    window.history.replaceState = function(...args) {
      const url = args[2]
      if (url && typeof url === 'string' && (url.includes('__nuxt_devtools__') || url.includes('_vfs.json'))) {
        console.warn('Blocked DevTools navigation:', url)
        return
      }
      return originalReplace.apply(this, args)
    }
    
    // Intercept router navigation
    const router = useRouter()
    if (router) {
      router.beforeEach((to, from, next) => {
        if (to.path.includes('__nuxt_devtools__') || 
            to.path.includes('_vfs.json') ||
            to.path.includes('/client/modules/')) {
          console.warn('Blocked DevTools route:', to.path)
          next('/')
          return
        }
        next()
      })
    }
  }
}) 