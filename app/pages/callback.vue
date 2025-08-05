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
  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get('code')
  const error = urlParams.get('error')
  const state = urlParams.get('state')
  const sessionToken = urlParams.get('session_token')
  const isNewUser = urlParams.get('is_new_user')
  
  // Trường hợp 1: Backend đã xử lý OAuth và trả về session_token trực tiếp
  if (sessionToken) {
    message.value = 'Đang xử lý đăng nhập...'
    
    try {
      // Lưu session token
      localStorage.setItem('session_token', sessionToken)
      
      // Đợi một chút để đảm bảo token được lưu
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Cập nhật trạng thái đăng nhập
      const { isAuthenticated, fetchUserInfo } = useAuth()
      isAuthenticated.value = true
      
      // Fetch thông tin user
      await fetchUserInfo()
      
      message.value = 'Đăng nhập thành công! Đang chuyển hướng...'
      
      // Chuyển hướng sau 1 giây
      setTimeout(() => {
        navigateTo('/')
      }, 1000)
    } catch (err) {
      message.value = 'Đăng nhập thất bại. Vui lòng thử lại.'
      
      // Chuyển về trang login sau 2 giây
      setTimeout(() => {
        navigateTo('/login')
      }, 2000)
    }
  }
  // Trường hợp 2: Backend trả về code để frontend xử lý
  else if (code) {
    message.value = 'Đang xác thực...'
    
    try {
      await handleCallback(code)
      message.value = 'Đăng nhập thành công! Đang chuyển hướng...'
      
      // Chuyển hướng sau 1 giây
      setTimeout(() => {
        navigateTo('/')
      }, 1000)
    } catch (err) {
      message.value = 'Đăng nhập thất bại. Vui lòng thử lại.'
      
      // Chuyển về trang login sau 2 giây
      setTimeout(() => {
        navigateTo('/login')
      }, 2000)
    }
  } else {
    message.value = 'Không tìm thấy thông tin xác thực'
    
    // Chuyển về trang login sau 2 giây
    setTimeout(() => {
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