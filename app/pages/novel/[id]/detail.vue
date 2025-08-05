<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center space-x-4">
            <NuxtLink to="/" class="flex items-center text-gray-600 hover:text-gray-900">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
              </svg>
              Trang chủ
            </NuxtLink>
            <div class="border-l border-gray-300 h-6"></div>
            <div>
              <h1 class="text-lg font-semibold text-gray-900">{{ novel?.title || 'Đang tải...' }}</h1>
              <p class="text-sm text-gray-500">Chi tiết truyện</p>
            </div>
          </div>
          
          <div class="flex items-center space-x-4">
            <div v-if="user" class="relative">
              <!-- User Avatar Dropdown -->
              <div class="flex items-center space-x-3">
                <button
                  @click="toggleUserMenu"
                  class="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md p-1"
                >
                  <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span class="text-sm font-medium text-white">
                      {{ user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase() }}
                    </span>
                  </div>
                  <span class="hidden md:block text-sm font-medium">{{ user.name || user.email }}</span>
                  <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
              </div>

              <!-- Dropdown Menu -->
              <div
                v-if="showUserMenu"
                class="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50"
              >
                <div class="py-1">
                  <!-- User Info -->
                  <div class="px-4 py-3 border-b border-gray-100">
                    <p class="text-sm font-medium text-gray-900">{{ user.name || 'Người dùng' }}</p>
                    <p class="text-xs text-gray-500">{{ user.email }}</p>
                  </div>

                  <!-- Menu Items -->
                  <div class="py-1">
                    <a
                      href="#"
                      class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    >
                      <svg class="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                      </svg>
                      Thông tin tài khoản
                    </a>
                    
                    <a
                      href="#"
                      class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    >
                      <svg class="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                    </svg>
                      Truyện yêu thích
                    </a>
                    
                    <a
                      href="#"
                      class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    >
                      <svg class="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      Lịch sử đọc
                    </a>
                    
                    <a
                      href="#"
                      class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    >
                      <svg class="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      Theo dõi truyện
                    </a>
                  </div>

                  <!-- Settings & Logout -->
                  <div class="py-1 border-t border-gray-100">
                    <a
                      href="#"
                      class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    >
                      <svg class="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      </svg>
                      Cài đặt
                    </a>
                    
                    <button
                      @click="logout"
                      class="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
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

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-4 text-gray-600">Đang tải thông tin truyện...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-12">
        <div class="text-red-600 mb-4">
          <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Có lỗi xảy ra</h3>
        <p class="text-gray-600 mb-4">{{ error }}</p>
        <button
          @click="loadNovel"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Thử lại
        </button>
      </div>

      <!-- Novel Content -->
      <div v-else-if="novel" class="space-y-8">
        <!-- Novel Header -->
        <div class="bg-white rounded-lg shadow-sm p-6">
          <div class="flex flex-col md:flex-row gap-6">
            <!-- Cover Image -->
            <div class="flex-shrink-0">
              <img
                :src="novel.cover_image || '/images/no-image.svg'"
                :alt="novel.title"
                class="w-48 h-64 object-cover rounded-lg shadow-md"
                @error="$event.target.src = '/images/no-image.svg'"
              />
            </div>

            <!-- Novel Info -->
            <div class="flex-1">
              <h1 class="text-3xl font-bold text-gray-900 mb-4">{{ novel.title }}</h1>
              
              <div class="space-y-3 mb-6">
                <div class="flex items-center text-sm text-gray-600">
                  <span class="font-medium mr-2">Tác giả:</span>
                  <span>{{ novel.author || 'Không xác định' }}</span>
                </div>
                
                <div class="flex items-center text-sm text-gray-600">
                  <span class="font-medium mr-2">Trạng thái:</span>
                  <span class="px-2 py-1 text-xs font-medium rounded-full" 
                        :class="novel.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'">
                    {{ novel.status === 'completed' ? 'Hoàn thành' : 'Đang tiến hành' }}
                  </span>
                </div>
                
                <div class="flex items-center text-sm text-gray-600">
                  <span class="font-medium mr-2">Thể loại:</span>
                  <span>{{ novel.genre || 'Không xác định' }}</span>
                </div>
                
                <div class="flex items-center text-sm text-gray-600">
                  <span class="font-medium mr-2">Số chương:</span>
                  <span>{{ novel.total_chapters || 0 }}</span>
                </div>
              </div>

              <div class="prose prose-sm text-gray-700 max-w-none">
                <p>{{ novel.description || 'Chưa có mô tả.' }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="bg-white rounded-lg shadow-sm">
          <div class="border-b border-gray-200">
            <nav class="flex space-x-8 px-6">
              <button
                v-for="tab in tabs"
                :key="tab.id"
                @click="activeTab = tab.id"
                :class="[
                  'py-4 px-1 border-b-2 font-medium text-sm',
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                ]"
              >
                {{ tab.name }}
              </button>
            </nav>
          </div>

          <div class="p-6">
            <!-- Introduction Tab -->
            <div v-if="activeTab === 'intro'" class="space-y-4">
              <h3 class="text-lg font-semibold text-gray-900">Giới thiệu</h3>
              <div class="prose prose-sm text-gray-700 max-w-none">
                <p>{{ novel.description || 'Chưa có mô tả chi tiết.' }}</p>
              </div>
            </div>

            <!-- Reviews Tab -->
            <div v-if="activeTab === 'reviews'" class="space-y-4">
              <h3 class="text-lg font-semibold text-gray-900">Đánh giá</h3>
              <div class="text-center py-8 text-gray-500">
                <p>Chưa có đánh giá nào.</p>
              </div>
            </div>

            <!-- Chapters Tab -->
            <div v-if="activeTab === 'chapters'" class="space-y-4">
              <h3 class="text-lg font-semibold text-gray-900">Danh sách chương</h3>
              
              <!-- Loading Chapters -->
              <div v-if="chaptersLoading" class="text-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p class="mt-2 text-sm text-gray-600">Đang tải danh sách chương...</p>
              </div>

              <!-- Chapters Error -->
              <div v-else-if="chaptersError" class="text-center py-8">
                <p class="text-red-600">{{ chaptersError }}</p>
                <button
                  @click="loadChapters"
                  class="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Thử lại
                </button>
              </div>

              <!-- Chapters List -->
              <div v-else-if="chapters.length > 0" class="space-y-2">
                <NuxtLink
                  v-for="chapter in chapters"
                  :key="chapter.id"
                  :to="`/novel/${novelId}/${chapter.id}`"
                  class="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div class="flex items-center space-x-3">
                    <span class="text-sm font-medium text-gray-900">{{ chapter.title }}</span>
                  </div>
                  <div class="text-sm text-gray-500">
                    Chương {{ chapter.chapter_number }}
                  </div>
                </NuxtLink>

                <!-- Pagination -->
                <div v-if="chaptersTotalPages > 1" class="flex justify-center mt-6">
                  <nav class="flex items-center space-x-2">
                    <!-- Previous -->
                    <button
                      @click="goToChaptersPage(chaptersPrevPage)"
                      :disabled="!chaptersHasPrev"
                      class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Trước
                    </button>

                    <!-- Page Numbers -->
                    <div class="flex items-center space-x-1">
                      <button
                        v-for="page in chaptersVisiblePages"
                        :key="page"
                        @click="goToChaptersPage(page)"
                        :class="[
                          'px-3 py-2 text-sm font-medium rounded-md',
                          page === chaptersCurrentPage
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                        ]"
                        :disabled="page === '...'"
                      >
                        {{ page }}
                      </button>
                    </div>

                    <!-- Next -->
                    <button
                      @click="goToChaptersPage(chaptersNextPage)"
                      :disabled="!chaptersHasNext"
                      class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sau
                    </button>
                  </nav>
                </div>
              </div>

              <!-- No Chapters -->
              <div v-else class="text-center py-8 text-gray-500">
                <p>Chưa có chương nào.</p>
              </div>
            </div>

            <!-- Comments Tab -->
            <div v-if="activeTab === 'comments'" class="space-y-4">
              <h3 class="text-lg font-semibold text-gray-900">Bình luận</h3>
              <div class="text-center py-8 text-gray-500">
                <p>Chưa có bình luận nào.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const route = useRoute()
const { user, logout } = useAuth()

// Novel data
const novel = ref(null)
const loading = ref(false)
const error = ref('')

// UI state
const showUserMenu = ref(false)
const activeTab = ref('intro')

// Tabs
const tabs = [
  { id: 'intro', name: 'Giới thiệu' },
  { id: 'reviews', name: 'Đánh giá' },
  { id: 'chapters', name: 'D.S Chương' },
  { id: 'comments', name: 'Bình luận' }
]

// Chapters data
const chapters = ref([])
const chaptersLoading = ref(false)
const chaptersError = ref('')
const chaptersCurrentPage = ref(1)
const chaptersPageSize = ref(50)
const chaptersTotal = ref(0)
const chaptersTotalPages = ref(0)
const chaptersVisiblePages = ref([])
const chaptersHasNext = ref(false)
const chaptersHasPrev = ref(false)
const chaptersNextPage = ref(null)
const chaptersPrevPage = ref(null)

// Computed
const novelId = computed(() => route.params.id)

// Functions
const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}

const loadNovel = async () => {
  try {
    loading.value = true
    error.value = ''
    
    const config = useRuntimeConfig()
    const apiBase = config.public.apiBase
    
    const response = await fetch(`${apiBase}/api/v1/novels/${novelId.value}`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch novel: ${response.status}`)
    }
    
    const data = await response.json()
    novel.value = data
    
  } catch (err) {
    console.error('Error loading novel:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const loadChapters = async () => {
  try {
    chaptersLoading.value = true
    chaptersError.value = ''
    
    const config = useRuntimeConfig()
    const apiBase = config.public.apiBase
    
    const params = new URLSearchParams({
      novel_id: novelId.value,
      page: chaptersCurrentPage.value.toString(),
      limit: chaptersPageSize.value.toString()
    })
    
    const response = await fetch(`${apiBase}/api/v1/chapters?${params}`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch chapters: ${response.status}`)
    }
    
    const data = await response.json()
    
    chapters.value = data.items || []
    chaptersTotal.value = data.total || 0
    chaptersTotalPages.value = data.total_pages || 0
    chaptersHasNext.value = data.has_next || false
    chaptersHasPrev.value = data.has_prev || false
    chaptersNextPage.value = data.next_page || null
    chaptersPrevPage.value = data.prev_page || null
    
    calculateChaptersPagination()
    
  } catch (err) {
    console.error('Error loading chapters:', err)
    chaptersError.value = err.message
  } finally {
    chaptersLoading.value = false
  }
}

const calculateChaptersPagination = () => {
  const pages = []
  const current = chaptersCurrentPage.value
  const total = chaptersTotalPages.value
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(total)
    } else if (current >= total - 3) {
      pages.push(1)
      pages.push('...')
      for (let i = total - 4; i <= total; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)
      pages.push('...')
      for (let i = current - 1; i <= current + 1; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(total)
    }
  }
  
  chaptersVisiblePages.value = pages
}

const goToChaptersPage = (page) => {
  if (page === '...' || page === chaptersCurrentPage.value) return
  
  chaptersCurrentPage.value = page
  loadChapters()
}

// Load data on mount
onMounted(() => {
  loadNovel()
  loadChapters()
})
</script> 