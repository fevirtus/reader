export default defineNuxtRouteMiddleware(async (to) => {
  // Chỉ áp dụng cho các trang cần auth (không phải login, callback)
  if (to.path === '/login' || to.path === '/callback' || to.path === '/auth/callback') {
    return
  }
  
  // Kiểm tra authentication state
  if (process.client) {
    const { isAuthenticated, checkAuthStatus } = useAuth()
    
    // Kiểm tra trạng thái auth hiện tại
    await checkAuthStatus()
    
    if (!isAuthenticated.value) {
      return navigateTo('/login')
    }
  }
}) 