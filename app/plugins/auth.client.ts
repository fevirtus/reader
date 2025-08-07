export default defineNuxtPlugin(async () => {
  const userStore = useUserStore()
  
  // Khởi tạo store từ localStorage
  userStore.init()
  
  // Check auth status khi app khởi động
  await userStore.checkAuthStatus()
}) 