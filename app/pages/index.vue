<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
              </svg>
            </div>
            <h1 class="text-xl font-bold text-gray-900">Reader App</h1>
          </div>
          
          <!-- Search Bar -->
          <div class="flex-1 max-w-lg mx-8">
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Tìm kiếm truyện..."
                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <div class="flex items-center space-x-4">
            <div v-if="user" class="relative user-menu-container">
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
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="flex gap-6">
        <!-- Sidebar -->
        <div class="w-64 flex-shrink-0">
          <div class="bg-white rounded-lg shadow p-4">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Danh mục</h3>
            <div class="space-y-2">
              <button
                v-for="category in categories"
                :key="category.id"
                @click="selectedCategory = category.id"
                :class="[
                  'w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  selectedCategory === category.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                ]"
              >
                {{ category.name }}
              </button>
            </div>
            
            <div class="border-t border-gray-200 mt-6 pt-4">
              <h4 class="text-sm font-medium text-gray-900 mb-3">Trạng thái</h4>
              <div class="space-y-2">
                <label class="flex items-center">
                  <input type="checkbox" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span class="ml-2 text-sm text-gray-700">Đang tiến hành</span>
                </label>
                <label class="flex items-center">
                  <input type="checkbox" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span class="ml-2 text-sm text-gray-700">Hoàn thành</span>
                </label>
                <label class="flex items-center">
                  <input type="checkbox" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span class="ml-2 text-sm text-gray-700">Tạm ngưng</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Content Area -->
        <div class="flex-1">
          <!-- Filter Bar -->
          <div class="bg-white rounded-lg shadow p-4 mb-6">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-4">
                <select class="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option>Sắp xếp theo</option>
                  <option>Mới nhất</option>
                  <option>Lượt xem</option>
                  <option>Đánh giá</option>
                </select>
                <button class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                  Bộ lọc
                </button>
              </div>
              <div class="text-sm text-gray-500">
                Hiển thị {{ filteredStories.length }} truyện
              </div>
            </div>
          </div>

          <!-- Stories Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            <div
              v-for="story in filteredStories"
              :key="story.id"
              class="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div class="aspect-[3/4] bg-gray-200 relative overflow-hidden">
                <img
                  :src="story.cover"
                  :alt="story.title"
                  class="w-full h-full object-cover"
                />
                <div class="absolute top-2 left-2">
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {{ story.status }}
                  </span>
                </div>
                <div class="absolute bottom-2 right-2">
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {{ story.chapters }} chương
                  </span>
                </div>
              </div>
              <div class="p-4">
                <h3 class="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
                  {{ story.title }}
                </h3>
                <p class="text-xs text-gray-500 mb-2">{{ story.author }}</p>
                <div class="flex items-center justify-between text-xs text-gray-500">
                  <span>{{ story.views }} lượt xem</span>
                  <div class="flex items-center">
                    <svg class="w-3 h-3 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                    {{ story.rating }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div class="mt-8 flex justify-center">
            <nav class="flex items-center space-x-2">
              <button class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                Trước
              </button>
              <button class="px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md">
                1
              </button>
              <button class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                2
              </button>
              <button class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                3
              </button>
              <button class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                Sau
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const { user, isAuthenticated, logout } = useAuth()

// User menu state
const showUserMenu = ref(false)

// Toggle user menu
const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}

// Close menu when clicking outside
const closeUserMenu = () => {
  showUserMenu.value = false
}

// Handle click outside
const handleClickOutside = (event) => {
  const target = event.target
  if (!target.closest('.user-menu-container')) {
    closeUserMenu()
  }
}

// Mock data
const searchQuery = ref('')
const selectedCategory = ref('all')

const categories = ref([
  { id: 'all', name: 'Tất cả' },
  { id: 'action', name: 'Hành động' },
  { id: 'romance', name: 'Tình cảm' },
  { id: 'fantasy', name: 'Kỳ ảo' },
  { id: 'comedy', name: 'Hài hước' },
  { id: 'drama', name: 'Drama' },
  { id: 'mystery', name: 'Bí ẩn' },
  { id: 'sci-fi', name: 'Khoa học viễn tưởng' }
])

const stories = ref([
  {
    id: 1,
    title: 'Tu Tiên Chi Độ',
    author: 'Tác giả A',
    cover: 'https://via.placeholder.com/300x400/4F46E5/FFFFFF?text=Tu+Tiên',
    status: 'Đang tiến hành',
    chapters: 150,
    views: '1.2M',
    rating: 4.5,
    category: 'fantasy'
  },
  {
    id: 2,
    title: 'Võ Thần Tái Lâm',
    author: 'Tác giả B',
    cover: 'https://via.placeholder.com/300x400/DC2626/FFFFFF?text=Võ+Thần',
    status: 'Hoàn thành',
    chapters: 200,
    views: '2.1M',
    rating: 4.8,
    category: 'action'
  },
  {
    id: 3,
    title: 'Tình Yêu Hoàn Hảo',
    author: 'Tác giả C',
    cover: 'https://via.placeholder.com/300x400/059669/FFFFFF?text=Tình+Yêu',
    status: 'Đang tiến hành',
    chapters: 80,
    views: '850K',
    rating: 4.2,
    category: 'romance'
  },
  {
    id: 4,
    title: 'Cười Vỡ Bụng',
    author: 'Tác giả D',
    cover: 'https://via.placeholder.com/300x400/F59E0B/FFFFFF?text=Cười',
    status: 'Hoàn thành',
    chapters: 120,
    views: '950K',
    rating: 4.6,
    category: 'comedy'
  },
  {
    id: 5,
    title: 'Bí Mật Thời Gian',
    author: 'Tác giả E',
    cover: 'https://via.placeholder.com/300x400/7C3AED/FFFFFF?text=Bí+Mật',
    status: 'Đang tiến hành',
    chapters: 95,
    views: '1.5M',
    rating: 4.7,
    category: 'mystery'
  },
  {
    id: 6,
    title: 'Vũ Trụ Song Song',
    author: 'Tác giả F',
    cover: 'https://via.placeholder.com/300x400/0891B2/FFFFFF?text=Vũ+Trụ',
    status: 'Tạm ngưng',
    chapters: 60,
    views: '720K',
    rating: 4.3,
    category: 'sci-fi'
  },
  {
    id: 7,
    title: 'Tình Yêu Và Định Mệnh',
    author: 'Tác giả G',
    cover: 'https://via.placeholder.com/300x400/DB2777/FFFFFF?text=Định+Mệnh',
    status: 'Đang tiến hành',
    chapters: 110,
    views: '1.8M',
    rating: 4.9,
    category: 'romance'
  },
  {
    id: 8,
    title: 'Chiến Binh Bóng Đêm',
    author: 'Tác giả H',
    cover: 'https://via.placeholder.com/300x400/1F2937/FFFFFF?text=Chiến+Binh',
    status: 'Hoàn thành',
    chapters: 180,
    views: '2.3M',
    rating: 4.4,
    category: 'action'
  },
  {
    id: 9,
    title: 'Thế Giới Ảo',
    author: 'Tác giả I',
    cover: 'https://via.placeholder.com/300x400/10B981/FFFFFF?text=Thế+Giới',
    status: 'Đang tiến hành',
    chapters: 130,
    views: '1.1M',
    rating: 4.1,
    category: 'fantasy'
  },
  {
    id: 10,
    title: 'Nụ Cười Tươi',
    author: 'Tác giả J',
    cover: 'https://via.placeholder.com/300x400/F97316/FFFFFF?text=Nụ+Cười',
    status: 'Hoàn thành',
    chapters: 90,
    views: '680K',
    rating: 4.0,
    category: 'comedy'
  }
])

const filteredStories = computed(() => {
  let filtered = stories.value

  // Filter by category
  if (selectedCategory.value !== 'all') {
    filtered = filtered.filter(story => story.category === selectedCategory.value)
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(story => 
      story.title.toLowerCase().includes(query) ||
      story.author.toLowerCase().includes(query)
    )
  }

  return filtered
})

// Add event listeners
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style> 