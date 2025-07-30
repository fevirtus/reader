<template>
  <div class="callback-container">
    <div class="loading-spinner">
      <div class="spinner"></div>
      <p>{{ message }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const { handleCallback } = useAuth()

const message = ref('Đang xử lý đăng nhập...')

// Xử lý OAuth callback khi component được mount
onMounted(async () => {
  console.log('=== CALLBACK PAGE DEBUG ===')
  console.log('Callback page mounted')
  console.log('Current URL:', window.location.href)
  console.log('Current pathname:', window.location.pathname)
  console.log('Current search:', window.location.search)
  console.log('Current hash:', window.location.hash)
  
  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get('code')
  const error = urlParams.get('error')
  const state = urlParams.get('state')
  const sessionToken = urlParams.get('session_token')
  const isNewUser = urlParams.get('is_new_user')
  
  console.log('URL params - code:', code)
  console.log('URL params - error:', error)
  console.log('URL params - state:', state)
  console.log('URL params - session_token:', sessionToken)
  console.log('URL params - is_new_user:', isNewUser)
  console.log('All URL params:', Object.fromEntries(urlParams.entries()))
  console.log('URL params keys:', Array.from(urlParams.keys()))
  console.log('URL params values:', Array.from(urlParams.values()))
  console.log('=== END DEBUG ===')
  
  // Trường hợp 1: Backend đã xử lý OAuth và trả về session_token trực tiếp
  if (sessionToken) {
    console.log('Session token received directly from backend')
    message.value = 'Đang xử lý đăng nhập...'
    
    try {
      // Lưu session token
      localStorage.setItem('session_token', sessionToken)
      console.log('Session token saved to localStorage')
      
      // Cập nhật trạng thái đăng nhập
      const { isAuthenticated, fetchUserInfo } = useAuth()
      isAuthenticated.value = true
      
      // Fetch thông tin user
      console.log('Fetching user info...')
      await fetchUserInfo()
      
      message.value = 'Đăng nhập thành công! Đang chuyển hướng...'
      
      // Chuyển hướng sau 1 giây
      setTimeout(() => {
        console.log('Redirecting to home page...')
        navigateTo('/')
      }, 1000)
    } catch (err) {
      console.error('Error processing session token:', err)
      message.value = 'Đăng nhập thất bại. Vui lòng thử lại.'
      
      // Chuyển về trang login sau 2 giây
      setTimeout(() => {
        console.log('Redirecting to login page due to error...')
        navigateTo('/login')
      }, 2000)
    }
  }
  // Trường hợp 2: Backend trả về code để frontend xử lý
  else if (code) {
    console.log('Processing OAuth callback with code:', code)
    console.log('Code length:', code.length)
    console.log('Code decoded:', decodeURIComponent(code))
    message.value = 'Đang xác thực...'
    
    try {
      console.log('Calling handleCallback with code:', code)
      console.log('About to make fetch request to backend...')
      await handleCallback(code)
      console.log('handleCallback completed successfully')
      message.value = 'Đăng nhập thành công! Đang chuyển hướng...'
      
      // Chuyển hướng sau 1 giây
      setTimeout(() => {
        console.log('Redirecting to home page...')
        navigateTo('/')
      }, 1000)
    } catch (err) {
      console.error('Callback error:', err)
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      })
      message.value = 'Đăng nhập thất bại. Vui lòng thử lại.'
      
      // Chuyển về trang login sau 2 giây
      setTimeout(() => {
        console.log('Redirecting to login page due to error...')
        navigateTo('/login')
      }, 2000)
    }
  } else {
    console.error('No session_token or code found in URL')
    console.log('All URL parameters:', Object.fromEntries(urlParams.entries()))
    message.value = 'Không tìm thấy thông tin xác thực'
    
    // Chuyển về trang login sau 2 giây
    setTimeout(() => {
      console.log('Redirecting to login page due to missing credentials...')
      navigateTo('/login')
    }, 2000)
  }
})
</script>

<style scoped>
.callback-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.loading-spinner {
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

p {
  color: #666;
  font-size: 16px;
  margin: 0;
}
</style> 