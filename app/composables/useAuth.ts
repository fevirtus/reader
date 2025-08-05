export const useAuth = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase

  const isLoading = ref(false)
  const error = ref('')
  const user = ref(null)
  const isAuthenticated = ref(false)

  // Kiểm tra trạng thái đăng nhập khi khởi tạo
  const checkAuthStatus = async () => {
    const token = localStorage.getItem('session_token')
    if (token) {
      isAuthenticated.value = true
      // Tự động lấy thông tin user khi có token
      try {
        await fetchUserInfo()
      } catch (error) {
        // Nếu fetchUserInfo thất bại, nó sẽ tự động xóa token và chuyển về login
        throw error
      }
    } else {
      isAuthenticated.value = false
      user.value = null
    }
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
      isLoading.value = true
      error.value = ''
      
      // Tạo redirect URL cho callback
      const redirectUrl = `${window.location.origin}/callback`
      
      const response = await fetch(`${apiBase}/api/v1/oauth/google/auth?redirect_uri=${encodeURIComponent(redirectUrl)}`)
      
      if (!response.ok) {
        throw new Error('Không thể kết nối đến server')
      }
      
      const data = await response.json()
      
      if (data.auth_url) {
        // Chuyển hướng trực tiếp thay vì mở popup
        window.location.href = data.auth_url
      } else {
        throw new Error('Không nhận được URL xác thực từ server')
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Có lỗi xảy ra khi đăng nhập'
    } finally {
      isLoading.value = false
    }
  }

  // Xử lý callback từ OAuth
  const handleCallback = async (code: string) => {
    try {
      isLoading.value = true
      error.value = ''
      
      const response = await fetch(`${apiBase}/api/v1/oauth/google/callback?code=${code}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Lỗi xác thực từ server: ${response.status} - ${errorText}`)
      }
      
      const data = await response.json()
      
      if (data.session_token) {
        // Lưu session token vào localStorage
        localStorage.setItem('session_token', data.session_token)
        
        // Cập nhật trạng thái đăng nhập
        isAuthenticated.value = true
        
        // Cập nhật thông tin user từ response
        if (data.user) {
          user.value = data.user
        } else {
          // Nếu không có user info trong response, fetch từ API
          await fetchUserInfo()
        }
        
        // Chuyển hướng về trang chủ
        await navigateTo('/')
      } else {
        throw new Error('Không nhận được token từ server')
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Đăng nhập thất bại'
      
      // Chuyển về trang login với lỗi
      await navigateTo('/login')
    } finally {
      isLoading.value = false
    }
  }

  // Đăng xuất
  const logout = () => {
    localStorage.removeItem('session_token')
    isAuthenticated.value = false
    user.value = null
    
    // Chuyển về trang chủ với param logout=true
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.set('logout', 'true')
    navigateTo(currentUrl.pathname + currentUrl.search)
  }

  // Lấy thông tin user từ API
  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem('session_token')
      
      if (!token) {
        return
      }
      
      const { apiGet } = useApi()
      const userData = await apiGet(`${apiBase}/api/v1/user/profile`)
      
      user.value = userData
      isAuthenticated.value = true
    } catch (err) {
      // useApi sẽ tự động xử lý unauthorized errors
      throw err
    }
  }

  // Helper function để xử lý unauthorized errors
  const handleUnauthorized = () => {
    localStorage.removeItem('session_token')
    isAuthenticated.value = false
    user.value = null
    
    // Chuyển về trang chủ với param logout=true
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.set('logout', 'true')
    navigateTo(currentUrl.pathname + currentUrl.search)
  }

  // Helper function để tạo headers với auth token
  const getAuthHeaders = () => {
    const token = localStorage.getItem('session_token')
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  }

  // Khởi tạo khi composable được sử dụng
  onMounted(async () => {
    await checkAuthStatus()
    
    // Kiểm tra OAuth callback
    checkOAuthCallback()
  })

  return {
    // State
    isLoading: readonly(isLoading),
    error: readonly(error),
    user: readonly(user),
    isAuthenticated: readonly(isAuthenticated),
    
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