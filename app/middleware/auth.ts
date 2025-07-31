export default defineNuxtRouteMiddleware(async (to) => {
  // Chỉ áp dụng cho các trang cần auth (không phải login, callback)
  if (to.path === '/login' || to.path === '/callback' || to.path === '/auth/callback') {
    return
  }
  
  // Kiểm tra authentication state
  if (process.client) {
    const { isAuthenticated, checkAuthStatus } = useAuth()
    
    try {
      // Kiểm tra trạng thái auth hiện tại
      await checkAuthStatus()
      
      // Không chuyển hướng nếu không authenticated, để user có thể xem trang chủ
      // Auth check sẽ tự động logout nếu token không hợp lệ
    } catch (error) {
      console.error('Auth check failed:', error)
      // Không chuyển hướng về login, để user ở lại trang hiện tại
    }
  }
}) 