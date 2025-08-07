import { ref, computed, readonly, onMounted, nextTick } from 'vue'

export const useAuth = () => {
  const userStore = useUserStore()
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase

  const error = ref('')

  // Kiểm tra trạng thái đăng nhập khi khởi tạo
  const checkAuthStatus = async () => {
    return await userStore.checkAuthStatus()
  }

  // Kiểm tra xem có phải là OAuth callback không
  const checkOAuthCallback = () => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const error = urlParams.get('error')
    
    if (code) {
      // Nếu có code, xử lý OAuth callback
      handleCallback(code)
    } else if (error) {
      // Nếu có error, hiển thị lỗi
      if (window.opener) {
        window.opener.postMessage({ 
          type: 'login-error',
          error: error 
        }, window.location.origin)
        window.close()
      }
    }
  }

  // Đăng nhập với Google
  const loginWithGoogle = async () => {
    try {
      error.value = ''
      
      const result = await userStore.oauthLogin('google')
      
      if (!result.success) {
        error.value = result.error || 'OAuth login failed'
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Có lỗi xảy ra khi đăng nhập'
    }
  }

  // Xử lý callback từ OAuth
  const handleCallback = async (code: string) => {
    try {
      error.value = ''
      
      const state = new URLSearchParams(window.location.search).get('state') || ''
      const result = await userStore.handleOAuthCallback(code, state)
      
      if (result.success) {
        // Chuyển hướng về trang chủ
        await navigateTo('/')
      } else {
        error.value = result.error || 'OAuth callback failed'
        // Chuyển về trang login với lỗi
        await navigateTo('/login')
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Đăng nhập thất bại'
      
      // Chuyển về trang login với lỗi
      await navigateTo('/login')
    }
  }

  // Đăng xuất
  const logout = () => {
    userStore.logout()
    
    // Chuyển về trang chủ với param logout=true
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.set('logout', 'true')
    navigateTo(currentUrl.pathname + currentUrl.search)
  }

  // Lấy thông tin user từ API (force fetch)
  const fetchUserInfo = async () => {
    return await userStore.fetchUserInfo()
  }

  // Helper function để xử lý unauthorized errors
  const handleUnauthorized = () => {
    userStore.logout()
    
    // Chuyển về trang chủ với param logout=true
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.set('logout', 'true')
    navigateTo(currentUrl.pathname + currentUrl.search)
  }

  // Helper function để tạo headers với auth token
  const getAuthHeaders = () => {
    return {
      'Authorization': `Bearer ${userStore.token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  }

  // Khởi tạo khi composable được sử dụng (chỉ trong component context)
  if (process.client) {
    onMounted(async () => {
      // Delay để tránh hydration mismatch
      await nextTick()
      await checkAuthStatus()
      
      // Kiểm tra OAuth callback
      checkOAuthCallback()
    })
  }

  return {
    // State (từ store)
    isLoading: computed(() => userStore.isLoading),
    error: readonly(error),
    user: computed(() => userStore.user),
    isAuthenticated: computed(() => userStore.isAuthenticated),
    isAdmin: computed(() => userStore.isAdmin),
    
    // Methods
    loginWithGoogle,
    handleCallback,
    logout,
    fetchUserInfo,
    checkAuthStatus,
    handleUnauthorized,
    getAuthHeaders
  }
} 