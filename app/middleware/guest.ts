export default defineNuxtRouteMiddleware(async (to) => {
  // Chỉ áp dụng cho trang login
  if (to.path !== '/login') {
    return
  }
  
  // Kiểm tra authentication state
  if (process.client) {
    const userStore = useUserStore()
    
    // Khởi tạo store nếu chưa có
    if (!userStore.token) {
      userStore.init()
    }
    
    // Delay để tránh hydration mismatch
    await new Promise(resolve => setTimeout(resolve, 0))
    
    // Kiểm tra auth status
    const isAuthenticated = await userStore.checkAuthStatus()
    
    if (isAuthenticated) {
      // Nếu đã authenticated, chuyển về trang chủ
      return navigateTo('/')
    }
  }
}) 