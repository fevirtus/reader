export default defineNuxtRouteMiddleware(async (to) => {
  // Chỉ áp dụng cho trang login
  if (to.path !== '/login') {
    return
  }
  
  // Kiểm tra authentication state
  if (process.client) {
    const { isAuthenticated, checkAuthStatus } = useAuth()
    
    // Kiểm tra trạng thái auth hiện tại
    await checkAuthStatus()
    
    if (isAuthenticated.value) {
      return navigateTo('/')
    }
  }
}) 