<template>
  <div class="min-h-screen text-white" :class="backgroundClass">
    <!-- Header -->
    <header class="z-50" :class="headerClass">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo and Title -->
          <div class="flex items-center space-x-4">
            <div class="flex items-center">
              <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
              </div>
              <h1 class="text-xl font-bold" :class="textColorClass">Reader App</h1>
            </div>
          </div>
          
          <!-- Search Bar - Hidden in reading mode -->
          <div class="flex-1 max-w-md mx-8 hidden">
            <div class="relative">
              <input
                type="text"
                placeholder="Tìm truyện, tác giả..."
                class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg class="absolute right-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
          </div>
          
          <!-- Right Icons -->
          <div class="flex items-center space-x-4">
            <button class="p-2 text-gray-400 hover:text-white">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12c-1 0-2-.4-2-1s1-2 2-2 2 1 2 2-1 1-2 1z"></path>
              </svg>
            </button>
            
            <!-- Mobile Settings Button -->
            <button 
              @click="showSettings = !showSettings"
              class="p-2 text-gray-400 hover:text-white md:hidden"
              title="Cài đặt giao diện"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
            </button>
            
            <div v-if="user" class="relative">
              <button
                @click="toggleUserMenu"
                class="flex items-center space-x-2 text-sm text-gray-300 hover:text-white focus:outline-none"
              >
                <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span class="text-sm font-medium text-white">
                    {{ user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase() }}
                  </span>
                </div>
              </button>

              <!-- Dropdown Menu -->
              <div
                v-if="showUserMenu"
                class="absolute right-0 mt-2 w-56 bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50"
              >
                <div class="py-1">
                  <div class="px-4 py-3 border-b border-gray-700">
                    <p class="text-sm font-medium text-white">{{ user.name || 'Người dùng' }}</p>
                    <p class="text-xs text-gray-400">{{ user.email }}</p>
                  </div>
                  <div class="py-1">
                    <a href="#" class="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                      <svg class="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                      </svg>
                      Thông tin tài khoản
                    </a>
                    <button
                      @click="logout"
                      class="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300"
                    >
                      <svg class="w-4 h-4 mr-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                      </svg>
                      Đăng xuất
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div v-else>
              <NuxtLink
                to="/login"
                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Đăng nhập
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Breadcrumb -->
    <div :class="breadcrumbClass">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
                  <nav class="text-sm" :class="breadcrumbTextClass">
            <span class="hover:opacity-80">{{ novelTitle }}</span>
            <span class="mx-2">/</span>
            <span>{{ chapterTitle }}</span>
          </nav>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-4 text-gray-400">Đang tải nội dung...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-12">
        <div class="text-red-400 mb-4">
          <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
          </svg>
        </div>
        <h3 class="text-lg font-medium text-white mb-2">Có lỗi xảy ra</h3>
        <p class="text-gray-400 mb-4">{{ error }}</p>
        <button
          @click="loadChapterContent"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Thử lại
        </button>
      </div>

      <!-- Chapter Content -->
      <div v-else-if="chapterContent" class="relative">
        <!-- Chapter Navigation -->
        <div class="flex justify-between items-center mb-8">
          <button
            @click="goToPreviousChapter"
            :disabled="!hasPreviousChapter"
            class="flex items-center px-4 py-2 text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            :class="navigationButtonClass"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            Chương trước
          </button>
          
          <button 
            @click="openTableOfContents"
            class="flex items-center px-4 py-2 text-sm font-medium rounded-md" 
            :class="navigationButtonClass"
            title="Mục lục (T)"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
          
          <button
            @click="goToNextChapter"
            :disabled="!hasNextChapter"
            class="flex items-center px-4 py-2 text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            :class="navigationButtonClass"
          >
            Chương tiếp
            <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>
        </div>

        <!-- Chapter Header -->
        <div class="mb-8 text-center">
          <h1 class="text-2xl font-bold mb-2" :class="textColorClass">{{ chapterContent.title }}</h1>
          <h2 class="text-lg mb-4" :class="subtitleColorClass">{{ novelTitle }}</h2>
          <div class="flex justify-center items-center space-x-4 text-sm" :class="metaColorClass">
            <span>{{ wordCount }} chữ</span>
            <span>{{ formatDate(chapterContent.created_at) }}</span>
          </div>
        </div>

        <!-- Content -->
                 <div class="rounded-lg p-8 mb-8" :class="contentBackgroundClass">
           <div 
             class="prose prose-lg max-w-none reading-content"
             :style="{
               fontSize: `${readingSettings.fontSize}px`,
               lineHeight: `${readingSettings.lineSpacing}%`,
               fontFamily: readingSettings.fontFamily,
               color: 'var(--text-color, #e5e7eb)'
             }"
           >
             <div v-html="renderedContent"></div>
           </div>
         </div>

        <!-- Bottom Navigation -->
        <div class="flex justify-between items-center">
          <button
            @click="goToPreviousChapter"
            :disabled="!hasPreviousChapter"
            class="flex items-center px-4 py-2 text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            :class="navigationButtonClass"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            Chương trước
          </button>
          
          <button
            @click="goToNextChapter"
            :disabled="!hasNextChapter"
            class="flex items-center px-4 py-2 text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            :class="navigationButtonClass"
          >
            Chương tiếp
            <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Settings Panel -->
    <div 
      v-if="showSettings"
      class="fixed top-1/2 right-4 transform -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 w-80 z-50"
    >
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold text-gray-900">Cài đặt giao diện</h3>
        <button @click="showSettings = false" class="text-gray-400 hover:text-gray-600">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      
      <!-- Font Size -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Cỡ chữ ({{ readingSettings.fontSize }}px):
        </label>
        <input
          v-model="readingSettings.fontSize"
          type="range"
          min="12"
          max="32"
          class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>
      
      <!-- Line Spacing -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Cách dòng ({{ readingSettings.lineSpacing }}%):
        </label>
        <input
          v-model="readingSettings.lineSpacing"
          type="range"
          min="100"
          max="200"
          class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>
      
      <!-- Font Family -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">Font chữ:</label>
        <select
          v-model="readingSettings.fontFamily"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="'Roboto', sans-serif">Roboto</option>
          <option value="'Inter', sans-serif">Inter</option>
          <option value="'Open Sans', sans-serif">Open Sans</option>
          <option value="'Noto Sans', sans-serif">Noto Sans</option>
        </select>
      </div>
      
             <!-- Background Style -->
       <div class="mb-4">
         <label class="block text-sm font-medium text-gray-700 mb-2">Kiểu nền:</label>
         <div class="flex space-x-2">
           <button
             @click="setBackgroundStyle('light')"
             class="w-8 h-8 bg-white border-2 border-gray-300 rounded-full hover:border-gray-400"
             :class="{ 'border-blue-500': readingSettings.backgroundStyle === 'light' }"
           ></button>
           <button
             @click="setBackgroundStyle('cream')"
             class="w-8 h-8 bg-yellow-50 border-2 border-gray-300 rounded-full hover:border-gray-400"
             :class="{ 'border-blue-500': readingSettings.backgroundStyle === 'cream' }"
           ></button>
           <button
             @click="setBackgroundStyle('dark')"
             class="w-8 h-8 bg-gray-800 border-2 border-gray-300 rounded-full hover:border-gray-400"
             :class="{ 'border-blue-500': readingSettings.backgroundStyle === 'dark' }"
           ></button>
           <button
             @click="setBackgroundStyle('sepia')"
             class="w-8 h-8 bg-yellow-100 border-2 border-gray-300 rounded-full hover:border-gray-400"
             :class="{ 'border-blue-500': readingSettings.backgroundStyle === 'sepia' }"
           ></button>
         </div>
       </div>
      
      <!-- Reset to Default -->
      <button
        @click="resetToDefault"
        class="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
        Trở về mặc định
      </button>
    </div>

             <!-- Table of Contents Modal -->
    <div 
      v-if="showTableOfContents"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click="showTableOfContents = false"
    >
      <div 
        class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-hidden"
        @click.stop
      >
        <div class="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Mục lục - {{ novelTitle }}</h3>
          <button 
            @click="showTableOfContents = false"
            class="text-gray-400 hover:text-gray-600"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div class="overflow-y-auto max-h-80">
          <div v-if="loadingTableOfContents" class="p-4 text-center text-gray-500">
            <div class="flex items-center justify-center space-x-2">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Đang tải mục lục...</span>
            </div>
          </div>
          <div v-else-if="allChapters.length === 0" class="p-4 text-center text-gray-500">
            <div class="space-y-2">
              <p>Không thể tải mục lục</p>
              <button 
                @click="openTableOfContents"
                class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Thử lại
              </button>
            </div>
          </div>
          <div v-else class="p-4">
            <div 
              v-for="(chapter, index) in allChapters" 
              :key="chapter.id"
              @click="goToChapter(chapter.id)"
              class="flex items-center justify-between p-3 hover:bg-gray-100 rounded-md cursor-pointer"
              :class="{ 'bg-blue-50 border-l-4 border-blue-500': chapter.id.toString() === chapterId.toString() }"
            >
              <div class="flex items-center space-x-3">
                <span class="text-sm font-medium text-gray-900">{{ chapter.chapter_number || index + 1 }}</span>
                <span class="text-sm text-gray-700">{{ chapter.title }}</span>
              </div>
              <div class="flex items-center space-x-2 text-xs text-gray-500">
                <span v-if="chapter.id.toString() === chapterId.toString()" class="text-blue-600 font-medium">Đang đọc</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

         <!-- Settings Icon -->
     <div class="fixed right-4 top-1/2 transform -translate-y-1/2 z-40 md:block hidden">
       <button
         @click="showSettings = !showSettings"
         class="p-3 rounded-full shadow-lg transition-colors"
         :class="floatingButtonClass"
         title="Cài đặt giao diện (S)"
       >
         <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
         </svg>
       </button>
     </div>

     <!-- Scroll to Top Button -->
     <div 
       v-if="showScrollToTop"
       class="fixed bottom-4 right-4 z-40"
     >
       <button
         @click="scrollToTop"
         class="p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
         :class="scrollToTopButtonClass"
         title="Về đầu trang"
       >
         <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
         </svg>
       </button>
     </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

const route = useRoute()
const { user, logout } = useAuth()
const { fetchChapters } = useChapters()

// Route parameters
const novelId = route.params.id
const chapterId = route.params.chapterId

// Chapter data
const chapterContent = ref(null)
const novelTitle = ref('')
const chapterTitle = ref('')
const chapterNumber = ref('')
const loading = ref(false)
const error = ref('')

// UI state
const showUserMenu = ref(false)
const showSettings = ref(false)
const showTableOfContents = ref(false)
const loadingTableOfContents = ref(false)
const showScrollToTop = ref(false)

// Reading settings
const readingSettings = ref({
  fontSize: 22,
  lineSpacing: 120,
  fontFamily: "'Roboto', sans-serif",
  backgroundStyle: 'dark'
})

// Load settings from localStorage
const loadSettings = () => {
  if (process.client) {
    const saved = localStorage.getItem('readingSettings')
    if (saved) {
      const settings = JSON.parse(saved)
      readingSettings.value = { ...readingSettings.value, ...settings }
      setBackgroundStyle(readingSettings.value.backgroundStyle)
    }
  }
}

// Save settings to localStorage
const saveSettings = () => {
  if (process.client) {
    localStorage.setItem('readingSettings', JSON.stringify(readingSettings.value))
  }
}

// Navigation state
const hasPreviousChapter = ref(false)
const hasNextChapter = ref(false)
const allChapters = ref([])
const currentChapterIndex = ref(-1)

// Computed properties
const wordCount = computed(() => {
  if (!chapterContent.value?.content) return 0
  return chapterContent.value.content.split(/\s+/).length
})

const renderedContent = computed(() => {
  if (!chapterContent.value?.content) return ''
  
  // Convert markdown to HTML (simple implementation)
  let content = chapterContent.value.content
  
  // Convert line breaks to paragraphs
  content = content.replace(/\n\n/g, '</p><p>')
  content = content.replace(/\n/g, '<br>')
  
  return `<p>${content}</p>`
})

const backgroundClass = computed(() => {
  switch (readingSettings.value.backgroundStyle) {
    case 'light':
      return 'bg-white text-gray-900'
    case 'cream':
      return 'bg-yellow-50 text-gray-900'
    case 'sepia':
      return 'bg-yellow-100 text-gray-900'
    default:
      return 'bg-gray-900 text-white'
  }
})

const contentBackgroundClass = computed(() => {
  switch (readingSettings.value.backgroundStyle) {
    case 'light':
      return 'bg-white'
    case 'cream':
      return 'bg-yellow-50'
    case 'sepia':
      return 'bg-yellow-100'
    default:
      return 'bg-gray-900'
  }
})

const headerClass = computed(() => {
  switch (readingSettings.value.backgroundStyle) {
    case 'light':
      return 'bg-white border-b border-gray-200'
    case 'cream':
      return 'bg-yellow-50 border-b border-yellow-200'
    case 'sepia':
      return 'bg-yellow-100 border-b border-yellow-300'
    default:
      return 'bg-gray-800 border-b border-gray-700'
  }
})

const breadcrumbClass = computed(() => {
  switch (readingSettings.value.backgroundStyle) {
    case 'light':
      return 'bg-gray-50 border-b border-gray-200'
    case 'cream':
      return 'bg-yellow-50 border-b border-yellow-200'
    case 'sepia':
      return 'bg-yellow-100 border-b border-yellow-300'
    default:
      return 'bg-gray-800 border-b border-gray-700'
  }
})

const textColorClass = computed(() => {
  switch (readingSettings.value.backgroundStyle) {
    case 'light':
    case 'cream':
    case 'sepia':
      return 'text-gray-900'
    default:
      return 'text-white'
  }
})

const breadcrumbTextClass = computed(() => {
  switch (readingSettings.value.backgroundStyle) {
    case 'light':
    case 'cream':
    case 'sepia':
      return 'text-gray-600'
    default:
      return 'text-gray-400'
  }
})

const navigationButtonClass = computed(() => {
  switch (readingSettings.value.backgroundStyle) {
    case 'light':
      return 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
    case 'cream':
      return 'text-gray-700 bg-yellow-50 border border-yellow-300 hover:bg-yellow-100'
    case 'sepia':
      return 'text-gray-700 bg-yellow-100 border border-yellow-400 hover:bg-yellow-200'
    default:
      return 'text-gray-300 bg-gray-800 border border-gray-600 hover:bg-gray-700 hover:text-white'
  }
})

const subtitleColorClass = computed(() => {
  switch (readingSettings.value.backgroundStyle) {
    case 'light':
    case 'cream':
    case 'sepia':
      return 'text-gray-600'
    default:
      return 'text-gray-300'
  }
})

const metaColorClass = computed(() => {
  switch (readingSettings.value.backgroundStyle) {
    case 'light':
    case 'cream':
    case 'sepia':
      return 'text-gray-500'
    default:
      return 'text-gray-400'
  }
})

const floatingButtonClass = computed(() => {
  switch (readingSettings.value.backgroundStyle) {
    case 'light':
      return 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
    case 'cream':
      return 'bg-yellow-50 text-gray-700 hover:bg-yellow-100 border border-yellow-200'
    case 'sepia':
      return 'bg-yellow-100 text-gray-700 hover:bg-yellow-200 border border-yellow-300'
    default:
      return 'bg-gray-800 text-white hover:bg-gray-700'
  }
})

const scrollToTopButtonClass = computed(() => {
  switch (readingSettings.value.backgroundStyle) {
    case 'light':
      return 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
    case 'cream':
      return 'bg-yellow-50 text-gray-700 hover:bg-yellow-100 border border-yellow-200'
    case 'sepia':
      return 'bg-yellow-100 text-gray-700 hover:bg-yellow-200 border border-yellow-300'
    default:
      return 'bg-gray-800 text-white hover:bg-gray-700'
  }
})

// Functions
const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('vi-VN')
}

const setBackgroundStyle = (style) => {
  readingSettings.value.backgroundStyle = style
  
  // Set CSS variables for text color
  const root = document.documentElement
  if (style === 'dark') {
    root.style.setProperty('--text-color', '#e5e7eb')
  } else {
    root.style.setProperty('--text-color', '#1f2937')
  }
  
  saveSettings()
}

const resetToDefault = () => {
  readingSettings.value = {
    fontSize: 22,
    lineSpacing: 120,
    fontFamily: "'Roboto', sans-serif",
    backgroundStyle: 'dark'
  }
  setBackgroundStyle('dark')
  saveSettings()
}

const loadChapterContent = async () => {
  try {
    loading.value = true
    error.value = ''
    
    const config = useRuntimeConfig()
    const apiBase = config.public.apiBase
    
    const url = `${apiBase}/api/v1/chapters/${chapterId}`
    const response = await fetch(url)
    
    if (response.status === 404) {
      throw new Error('Chương không tồn tại')
    }
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch chapter: ${response.status} - ${errorText}`)
    }
    
    const data = await response.json()
    
    chapterContent.value = data
    chapterTitle.value = data.title || 'Chương không có tiêu đề'
    chapterNumber.value = data.chapter_number ? `Chương ${data.chapter_number}` : ''
    
    // Load novel title
    await loadNovelTitle()
    
    // Check navigation
    await checkNavigation()
    
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const loadNovelTitle = async () => {
  try {
    const config = useRuntimeConfig()
    const apiBase = config.public.apiBase
    
    const response = await fetch(`${apiBase}/api/v1/novels/${novelId}`)
    
    if (response.ok) {
      const data = await response.json()
      novelTitle.value = data.title || 'Truyện không có tiêu đề'
    }
  } catch (err) {
    novelTitle.value = 'Truyện không xác định'
  }
}

const checkNavigation = async () => {
  try {
    // Get all chapters for this novel using pagination
    let allChaptersData = []
    let page = 1
    const limit = 200 // API limit
    let hasMore = true
    
    while (hasMore) {
      try {
        const data = await fetchChapters({ 
          novel_id: parseInt(novelId), 
          page: page,
          limit: limit
        })
        
        if (data.items && data.items.length > 0) {
          allChaptersData = allChaptersData.concat(data.items)
          
          // If we got less than limit, we've reached the end
          if (data.items.length < limit) {
            hasMore = false
          } else {
            page++
          }
        } else {
          hasMore = false
        }
      } catch (pageError) {
        console.error(`Failed to fetch page ${page}:`, pageError)
        hasMore = false
      }
    }
    
    allChapters.value = allChaptersData
    currentChapterIndex.value = allChapters.value.findIndex(ch => ch.id.toString() === chapterId.toString())
    
    hasPreviousChapter.value = currentChapterIndex.value > 0
    hasNextChapter.value = currentChapterIndex.value < allChapters.value.length - 1 && currentChapterIndex.value !== -1
    
    console.log('Navigation check:', {
      totalChapters: allChapters.value.length,
      currentIndex: currentChapterIndex.value,
      hasPrevious: hasPreviousChapter.value,
      hasNext: hasNextChapter.value
    })
  } catch (err) {
    console.error('Navigation check failed:', err)
    // Set default values if navigation check fails
    allChapters.value = []
    currentChapterIndex.value = -1
    hasPreviousChapter.value = false
    hasNextChapter.value = false
  }
}

const goToPreviousChapter = async () => {
  if (!hasPreviousChapter.value || currentChapterIndex.value <= 0) return
  
  try {
    const prevChapter = allChapters.value[currentChapterIndex.value - 1]
    console.log('Navigating to previous chapter:', prevChapter)
    await navigateTo(`/novel/${novelId}/${prevChapter.id}`)
  } catch (err) {
    console.error('Navigation to previous chapter failed:', err)
  }
}

const goToNextChapter = async () => {
  if (!hasNextChapter.value || currentChapterIndex.value >= allChapters.value.length - 1) return
  
  try {
    const nextChapter = allChapters.value[currentChapterIndex.value + 1]
    console.log('Navigating to next chapter:', nextChapter)
    await navigateTo(`/novel/${novelId}/${nextChapter.id}`)
  } catch (err) {
    console.error('Navigation to next chapter failed:', err)
  }
}

const goToChapter = async (targetChapterId) => {
  try {
    console.log('Navigating to chapter:', targetChapterId)
    await navigateTo(`/novel/${novelId}/${targetChapterId}`)
    showTableOfContents.value = false
  } catch (err) {
    console.error('Navigation to chapter failed:', err)
  }
}

const openTableOfContents = async () => {
  showTableOfContents.value = true
  loadingTableOfContents.value = true
  
  try {
    // If we don't have chapters yet, load them
    if (allChapters.value.length === 0) {
      await checkNavigation()
    }
  } catch (err) {
    console.error('Failed to load table of contents:', err)
  } finally {
    loadingTableOfContents.value = false
  }
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

const handleScroll = () => {
  const scrollY = window.scrollY
  const headerHeight = 64 // Approximate header height
  
  // Show scroll to top button when scrolled past header and then back up a bit
  if (scrollY > headerHeight + 100) {
    showScrollToTop.value = true
  } else {
    showScrollToTop.value = false
  }
}

// Load data on mount
onMounted(() => {
  if (process.client) {
    loadSettings()
    loadChapterContent()
    // Load chapters for navigation
    checkNavigation()
  }
})

// Watch for route changes
watch(() => route.params.chapterId, () => {
  if (process.client) {
    loadChapterContent()
  }
})

// Watch for settings changes
watch(readingSettings, () => {
  saveSettings()
}, { deep: true })

// Close settings panel when clicking outside and add keyboard shortcuts
onMounted(() => {
  if (process.client) {
    document.addEventListener('click', (e) => {
      const settingsPanel = document.querySelector('.settings-panel')
      const settingsButton = document.querySelector('.settings-button')
      
      if (settingsPanel && !settingsPanel.contains(e.target) && !settingsButton?.contains(e.target)) {
        showSettings.value = false
      }
    })
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' && hasPreviousChapter.value) {
        goToPreviousChapter()
      } else if (e.key === 'ArrowRight' && hasNextChapter.value) {
        goToNextChapter()
      } else if (e.key === 'Escape') {
        showSettings.value = false
        showTableOfContents.value = false
      } else if (e.key === 's' || e.key === 'S') {
        showSettings.value = !showSettings.value
      } else if (e.key === 't' || e.key === 'T') {
        openTableOfContents()
      }
    })
    
    // Scroll listener
    window.addEventListener('scroll', handleScroll)
  }
})

// Cleanup on unmount
onUnmounted(() => {
  if (process.client) {
    window.removeEventListener('scroll', handleScroll)
  }
})
</script>

<style scoped>
.prose {
  line-height: 1.8;
  font-size: 1.1rem;
}

.prose p {
  margin-bottom: 1.5rem;
}

.prose br {
  margin-bottom: 0.5rem;
}

/* Custom range slider styles */
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  cursor: pointer;
}

input[type="range"]::-webkit-slider-track {
  background: #e5e7eb;
  height: 8px;
  border-radius: 4px;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  background: #3b82f6;
  height: 20px;
  width: 20px;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

input[type="range"]::-moz-range-track {
  background: #e5e7eb;
  height: 8px;
  border-radius: 4px;
}

input[type="range"]::-moz-range-thumb {
  background: #3b82f6;
  height: 20px;
  width: 20px;
  border-radius: 50%;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Smooth transitions */
.prose p {
  transition: all 0.3s ease;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #374151;
}

::-webkit-scrollbar-thumb {
  background: #6b7280;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style> 