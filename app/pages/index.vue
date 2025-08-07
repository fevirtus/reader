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
                @keyup.enter="handleSearch"
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
                    
                    <!-- Admin Panel Link -->
                    <NuxtLink
                      v-if="isAdmin"
                      to="/admin"
                      class="flex items-center px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 hover:text-purple-900"
                    >
                      <svg class="w-4 h-4 mr-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      Admin Panel
                    </NuxtLink>
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
      <!-- Logout Message -->
      <div v-if="showLogoutMessage" class="mb-6">
        <div class="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-yellow-800">
                Phiên đăng nhập đã hết hạn
              </h3>
              <div class="mt-2 text-sm text-yellow-700">
                <p>Vui lòng đăng nhập lại để tiếp tục sử dụng các tính năng cá nhân.</p>
              </div>
              <div class="mt-4">
                <div class="-mx-2 -my-1.5 flex">
                  <NuxtLink
                    to="/login"
                    class="bg-yellow-50 px-2 py-1.5 rounded-md text-sm font-medium text-yellow-800 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:ring-yellow-600"
                  >
                    Đăng nhập lại
                  </NuxtLink>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex gap-6">
        <!-- Sidebar -->
        <div class="w-64 flex-shrink-0">
          <div class="bg-white rounded-lg shadow p-4">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Danh mục</h3>
            <div class="space-y-2">
              <button
                v-for="category in categories"
                :key="category.id"
                @click="handleCategoryFilter(category.id)"
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
                <label v-for="status in statusOptions" :key="status.id" class="flex items-center">
                  <input
                    type="radio"
                    :value="status.id"
                    v-model="selectedStatus"
                    @change="handleStatusFilter(selectedStatus)"
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span class="ml-2 text-sm text-gray-700">{{ status.name }}</span>
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
                <select 
                  v-model="selectedStatus"
                  @change="handleStatusFilter(selectedStatus)"
                  class="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option v-for="status in statusOptions" :key="status.id" :value="status.id">
                    {{ status.name }}
                  </option>
                </select>
                <button 
                  @click="handleSearch"
                  :disabled="loading"
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  {{ loading ? 'Đang tải...' : 'Tìm kiếm' }}
                </button>
              </div>
              <div class="text-sm text-gray-500">
                Hiển thị {{ novels?.length || 0 }} truyện
                <span v-if="loading" class="ml-2">(Đang tải...)</span>
              </div>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div class="flex">
              <svg class="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
              </svg>
              <div class="ml-3">
                <p class="text-sm text-red-800">{{ error }}</p>
              </div>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="flex justify-center items-center py-12">
            <div class="flex items-center space-x-2">
              <div class="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span class="text-gray-600">Đang tải danh sách truyện...</span>
            </div>
          </div>

          <!-- Stories Grid -->
          <div v-if="showGrid" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            <NuxtLink
              v-for="novel in novels"
              :key="novel.id"
              :to="`/novel/${novel.id}/detail`"
              class="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div class="aspect-[3/4] bg-gray-200 relative overflow-hidden">
                <img
                  :src="novel.cover_image || '/images/no-image.svg'"
                  :alt="novel.title"
                  class="w-full h-full object-cover"
                  @error="$event.target.src = '/images/no-image.svg'"
                />
                <div class="absolute top-2 left-2">
                  <span 
                    :class="[
                      'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                      novel.status === 'ongoing' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    ]"
                  >
                    {{ novel.status === 'ongoing' ? 'Đang tiến hành' : 'Hoàn thành' }}
                  </span>
                </div>
                <div class="absolute bottom-2 right-2">
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {{ novel.total_chapters }} chương
                  </span>
                </div>
              </div>
              <div class="p-4">
                <h3 class="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
                  {{ novel.title }}
                </h3>
                <p class="text-xs text-gray-500 mb-2">{{ novel.author }}</p>
                <div class="flex items-center justify-between text-xs text-gray-500">
                  <span>{{ novel.views.toLocaleString() }} lượt xem</span>
                  <div class="flex items-center">
                    <svg class="w-3 h-3 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                    {{ novel.rating }}
                  </div>
                </div>
              </div>
            </NuxtLink>
          </div>

          <!-- Empty State -->
          <div v-if="showEmptyState" class="text-center py-12">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">Không tìm thấy truyện</h3>
            <p class="mt-1 text-sm text-gray-500">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc.</p>
          </div>

          <!-- Pagination -->
          <div v-if="showGrid && totalPages > 1" class="mt-8 flex justify-center">
            <nav class="flex items-center space-x-2">
              <button 
                @click="goToPage(currentPage - 1)"
                :disabled="currentPage <= 1"
                class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              
              <button 
                v-for="page in visiblePages"
                :key="page"
                @click="goToPage(page)"
                :class="[
                  'px-3 py-2 text-sm font-medium rounded-md',
                  page === currentPage
                    ? 'text-white bg-blue-600 border border-blue-600'
                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                ]"
              >
                {{ page }}
              </button>
              
              <button 
                @click="goToPage(currentPage + 1)"
                :disabled="currentPage >= totalPages"
                class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
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
import { ref, onMounted, onUnmounted, computed } from 'vue'

const { user, isAuthenticated, logout, isAdmin } = useAuth()
const { apiGet } = useApi()
const config = useRuntimeConfig()
const apiBase = config.public.apiBase

// Sử dụng useNovels với fallback
const novelsComposable = useNovels()
const novels = novelsComposable?.novels || ref([])
const loading = novelsComposable?.loading || ref(false)
const error = novelsComposable?.error || ref('')
const fetchNovels = novelsComposable?.fetchNovels || (() => Promise.resolve([]))
const searchNovels = novelsComposable?.searchNovels || (() => Promise.resolve([]))
const filterByStatus = novelsComposable?.filterByStatus || (() => Promise.resolve([]))

// User menu state
const showUserMenu = ref(false)
const showLogoutMessage = ref(false)

// Search and filter state
const searchQuery = ref('')
const selectedCategory = ref('all')
const selectedStatus = ref('all')

// Pagination state
const currentPage = ref(1)
const itemsPerPage = ref(10)
const totalItems = ref(0)
const totalPages = ref(1)
const visiblePages = ref([])

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

// Categories mapping
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

// Status mapping
const statusOptions = ref([
  { id: 'all', name: 'Tất cả' },
  { id: 'ongoing', name: 'Đang tiến hành' },
  { id: 'completed', name: 'Hoàn thành' }
])

// Check admin status - now handled by Pinia store
const checkAdminStatus = async () => {
  // Admin status is now managed by Pinia store
  // No need to check separately as it's computed from user role
}

// Load novels on mount
onMounted(async () => {
  try {
    await fetchNovels({ limit: itemsPerPage.value, page: currentPage.value })
  } catch (err) {
    // Failed to load novels
  }
})

// Search novels
const handleSearch = async () => {
  if (searchQuery.value.trim()) {
    try {
      await searchNovels(searchQuery.value.trim())
      } catch (err) {
    // Search failed
  }
  } else {
    // Reset to all novels if search is empty
    try {
      await fetchNovels({ limit: itemsPerPage.value, page: currentPage.value })
    } catch (err) {
      console.error('Failed to load novels:', err)
    }
  }
}

// Filter by status
const handleStatusFilter = async (status) => {
  selectedStatus.value = status
  if (status === 'all') {
    try {
      await fetchNovels({ limit: itemsPerPage.value, page: currentPage.value })
    } catch (err) {
      // Failed to load novels
    }
  } else {
    try {
      await filterByStatus(status)
    } catch (err) {
      // Status filter failed
    }
  }
}

// Filter by category (placeholder - backend chưa hỗ trợ)
const handleCategoryFilter = (category) => {
  selectedCategory.value = category
  // TODO: Implement category filter when backend supports it
}

// Computed properties
const hasNovels = computed(() => novels.value && novels.value.length > 0)
const showEmptyState = computed(() => !loading.value && !hasNovels.value)
const showGrid = computed(() => !loading.value && hasNovels.value)

// Calculate total pages
const calculateTotalPages = () => {
  totalPages.value = Math.ceil(totalItems.value / itemsPerPage.value)
  if (totalPages.value === 0) totalPages.value = 1
  updateVisiblePages()
}

// Update visible pages for pagination
const updateVisiblePages = () => {
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, start + 4)
  visiblePages.value = []
  for (let i = start; i <= end; i++) {
    visiblePages.value.push(i)
  }
}

// Go to a specific page
const goToPage = async (page) => {
  if (page < 1) page = 1
  if (page > totalPages.value) page = totalPages.value
  currentPage.value = page
  await fetchNovels({ limit: itemsPerPage.value, page: currentPage.value })
}

// Add event listeners
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Check if user was logged out
onMounted(() => {
  // Kiểm tra nếu user bị logout (có token trong URL params)
  const urlParams = new URLSearchParams(window.location.search)
  const logoutParam = urlParams.get('logout')
  
  if (logoutParam === 'true') {
    showLogoutMessage.value = true
    // Xóa param khỏi URL
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.delete('logout')
    window.history.replaceState({}, '', newUrl.toString())
    
    // Tự động ẩn thông báo sau 5 giây
    setTimeout(() => {
      showLogoutMessage.value = false
    }, 5000)
  }
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