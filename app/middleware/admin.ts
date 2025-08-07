export default defineNuxtRouteMiddleware(async (to) => {
  if (process.client) {
    const userStore = useUserStore()
    
    // Khởi tạo store nếu chưa có
    if (!userStore.token) {
      userStore.init()
    }
    
    // Kiểm tra auth status trước
    const isAuthenticated = await userStore.checkAuthStatus()
    
    if (!isAuthenticated) {
      return navigateTo('/login')
    }
    
    // Kiểm tra quyền admin
    if (!userStore.isAdmin) {
      return navigateTo('/')
    }
  }
}) 