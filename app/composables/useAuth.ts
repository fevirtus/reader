export const useAuth = () => {
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
      await fetchUserInfo()
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
      console.error('OAuth error:', error)
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
      
      const response = await fetch(`http://localhost:8000/api/v1/oauth/google/auth?redirect_uri=${encodeURIComponent(redirectUrl)}`)
      
      if (!response.ok) {
        throw new Error('Không thể kết nối đến server')
      }
      
      const data = await response.json()
      
      if (data.auth_url) {
        // Chuyển hướng trực tiếp thay vì mở popup
        console.log('Redirecting to Google OAuth URL:', data.auth_url)
        window.location.href = data.auth_url
      } else {
        throw new Error('Không nhận được URL xác thực từ server')
      }
    } catch (err) {
      console.error('Lỗi đăng nhập:', err)
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
      
      console.log('Processing OAuth callback with code:', code)
      console.log('Making request to backend callback endpoint...')
      
      const response = await fetch(`http://localhost:8000/api/v1/oauth/google/callback?code=${code}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })
      
      console.log('Backend response status:', response.status)
      console.log('Backend response headers:', response.headers)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Backend error response:', errorText)
        throw new Error(`Lỗi xác thực từ server: ${response.status} - ${errorText}`)
      }
      
      const data = await response.json()
      console.log('OAuth callback response:', data)
      
      if (data.session_token) {
        console.log('Session token received, saving to localStorage')
        // Lưu session token vào localStorage
        localStorage.setItem('session_token', data.session_token)
        
        // Cập nhật trạng thái đăng nhập
        isAuthenticated.value = true
        
        // Cập nhật thông tin user từ response
        if (data.user) {
          console.log('User info received from callback:', data.user)
          user.value = data.user
        } else {
          console.log('No user info in callback, fetching from API...')
          // Nếu không có user info trong response, fetch từ API
          await fetchUserInfo()
        }
        
        // Chuyển hướng về trang chủ
        console.log('Redirecting to home page')
        await navigateTo('/')
      } else {
        console.error('No session token in response:', data)
        throw new Error('Không nhận được token từ server')
      }
    } catch (err) {
      console.error('Lỗi callback:', err)
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
    navigateTo('/login')
  }

  // Lấy thông tin user từ API
  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem('session_token')
      if (!token) {
        console.log('No session token found')
        return
      }
      
      console.log('Fetching user info with token:', token)
      
      const response = await fetch('http://localhost:8000/api/v1/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const userData = await response.json()
        console.log('User info fetched successfully:', userData)
        user.value = userData
        isAuthenticated.value = true
      } else if (response.status === 401) {
        // Token không hợp lệ, xóa token và reset state
        console.log('Token invalid, clearing auth state')
        localStorage.removeItem('session_token')
        isAuthenticated.value = false
        user.value = null
      } else {
        console.error('Failed to fetch user info:', response.status)
      }
    } catch (err) {
      console.error('Lỗi lấy thông tin user:', err)
      // Nếu có lỗi network, có thể token đã hết hạn
      localStorage.removeItem('session_token')
      isAuthenticated.value = false
      user.value = null
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
    checkAuthStatus
  }
} 