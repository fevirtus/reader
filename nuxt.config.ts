// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  
  // Thêm Tailwind CSS
  css: ['~/assets/css/main.css'],
  
  // Cấu hình modules
  modules: [
    '@nuxtjs/tailwindcss'
  ],
  
  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE_URL || 'http://localhost:8000'
    }
  },
  
  nitro: {
    devProxy: {
      '/api': {
        target: process.env.API_BASE_URL || 'http://localhost:8000',
        changeOrigin: true
      }
    }
  },
  
  // Cấu hình app
  app: {
    head: {
      title: 'Reader App - Đọc truyện online',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Ứng dụng đọc truyện online với giao diện đẹp và dễ sử dụng' }
      ]
    }
  }
})
