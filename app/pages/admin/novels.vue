<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-6">
          <div class="flex items-center space-x-4">
            <NuxtLink to="/admin" class="text-gray-500 hover:text-gray-700">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </NuxtLink>
            <h1 class="text-3xl font-bold text-gray-900">Quản lý Truyện</h1>
          </div>
          <button
            @click="showCreateModal = true"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Thêm truyện mới
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <!-- Filters -->
      <div class="bg-white shadow rounded-lg mb-6">
        <div class="px-4 py-5 sm:p-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Tìm kiếm</label>
              <input
                v-model="filters.search"
                type="text"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Tên truyện, tác giả..."
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Trạng thái</label>
              <select
                v-model="filters.status"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Tất cả</option>
                <option value="ongoing">Đang tiến hành</option>
                <option value="completed">Hoàn thành</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Tác giả</label>
              <input
                v-model="filters.author"
                type="text"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Tên tác giả..."
              />
            </div>
            <div class="flex items-end">
              <button
                @click="applyFilters"
                class="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Lọc
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Novels Table -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Truyện
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tác giả
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chương
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lượt xem
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="novel in novels" :key="novel.id" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-10 w-10">
                        <img
                          v-if="novel.cover_image"
                          :src="novel.cover_image"
                          :alt="novel.title"
                          class="h-10 w-10 rounded-lg object-cover"
                        />
                        <div
                          v-else
                          class="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center"
                        >
                          <svg class="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">{{ novel.title }}</div>
                        <div class="text-sm text-gray-500">{{ novel.description?.substring(0, 50) }}...</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ novel.author }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      :class="[
                        'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                        novel.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      ]"
                    >
                      {{ novel.status === 'completed' ? 'Hoàn thành' : 'Đang tiến hành' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ novel.total_chapters }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ novel.views?.toLocaleString() || 0 }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ formatDate(novel.created_at) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex items-center justify-end space-x-2">
                      <button
                        @click="editNovel(novel)"
                        class="text-blue-600 hover:text-blue-900"
                      >
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        @click="deleteNovel(novel.id)"
                        class="text-red-600 hover:text-red-900"
                      >
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div class="flex-1 flex justify-between sm:hidden">
              <button
                @click="previousPage"
                :disabled="currentPage === 1"
                class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              <button
                @click="nextPage"
                :disabled="currentPage >= totalPages"
                class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
            <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p class="text-sm text-gray-700">
                  Hiển thị
                  <span class="font-medium">{{ (currentPage - 1) * pageSize + 1 }}</span>
                  đến
                  <span class="font-medium">{{ Math.min(currentPage * pageSize, total) }}</span>
                  trong tổng số
                  <span class="font-medium">{{ total }}</span>
                  kết quả
                </p>
              </div>
              <div>
                <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    @click="previousPage"
                    :disabled="currentPage === 1"
                    class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                  </button>
                  <button
                    v-for="page in visiblePages"
                    :key="page"
                    @click="goToPage(page)"
                    :class="[
                      'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
                      page === currentPage
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    ]"
                  >
                    {{ page }}
                  </button>
                  <button
                    @click="nextPage"
                    :disabled="currentPage >= totalPages"
                    class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Create/Edit Modal -->
    <div v-if="showCreateModal || showEditModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 mb-4">
            {{ showEditModal ? 'Chỉnh sửa truyện' : 'Thêm truyện mới' }}
          </h3>
          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Tên truyện</label>
              <input
                v-model="form.title"
                type="text"
                required
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Tác giả</label>
              <input
                v-model="form.author"
                type="text"
                required
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Mô tả</label>
              <textarea
                v-model="form.description"
                rows="3"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              ></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Trạng thái</label>
              <select
                v-model="form.status"
                required
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="ongoing">Đang tiến hành</option>
                <option value="completed">Hoàn thành</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Số chương</label>
              <input
                v-model.number="form.total_chapters"
                type="number"
                min="0"
                required
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div class="flex justify-end space-x-3">
              <button
                type="button"
                @click="closeModal"
                class="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Hủy
              </button>
              <button
                type="submit"
                class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {{ showEditModal ? 'Cập nhật' : 'Thêm' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'admin',
  layout: 'admin'
})

const { apiGet, apiPost, apiPut, apiDelete } = useApi()
const config = useRuntimeConfig()
const apiBase = config.public.apiBase

// State
const novels = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

const filters = ref({
  search: '',
  status: '',
  author: ''
})

const showCreateModal = ref(false)
const showEditModal = ref(false)
const editingNovel = ref(null)

const form = ref({
  title: '',
  author: '',
  description: '',
  status: 'ongoing',
  total_chapters: 0
})

// Computed
const visiblePages = computed(() => {
  const pages = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, currentPage.value + 2)
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

// Methods
const fetchNovels = async () => {
  try {
    loading.value = true
    
    const queryParams = new URLSearchParams()
    queryParams.append('page', currentPage.value.toString())
    queryParams.append('limit', pageSize.value.toString())
    
    if (filters.value.search) queryParams.append('search', filters.value.search)
    if (filters.value.status) queryParams.append('status', filters.value.status)
    if (filters.value.author) queryParams.append('author', filters.value.author)
    
    const response = await apiGet(`${apiBase}/api/v1/novels?${queryParams.toString()}`)
    
    novels.value = response.items || []
    total.value = response.total || 0
    
  } catch (error) {
    console.error('Error fetching novels:', error)
  } finally {
    loading.value = false
  }
}

const applyFilters = () => {
  currentPage.value = 1
  fetchNovels()
}

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    fetchNovels()
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    fetchNovels()
  }
}

const goToPage = (page) => {
  currentPage.value = page
  fetchNovels()
}

const editNovel = (novel) => {
  editingNovel.value = novel
  form.value = {
    title: novel.title,
    author: novel.author,
    description: novel.description || '',
    status: novel.status,
    total_chapters: novel.total_chapters
  }
  showEditModal.value = true
}

const deleteNovel = async (novelId) => {
  if (!confirm('Bạn có chắc chắn muốn xóa truyện này?')) {
    return
  }
  
  try {
    await apiDelete(`${apiBase}/api/v1/novels/${novelId}`)
    await fetchNovels()
  } catch (error) {
    console.error('Error deleting novel:', error)
  }
}

const handleSubmit = async () => {
  try {
    if (showEditModal.value) {
      await apiPut(`${apiBase}/api/v1/novels/${editingNovel.value.id}`, form.value)
    } else {
      await apiPost(`${apiBase}/api/v1/novels`, form.value)
    }
    
    closeModal()
    await fetchNovels()
  } catch (error) {
    console.error('Error saving novel:', error)
  }
}

const closeModal = () => {
  showCreateModal.value = false
  showEditModal.value = false
  editingNovel.value = null
  form.value = {
    title: '',
    author: '',
    description: '',
    status: 'ongoing',
    total_chapters: 0
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('vi-VN')
}

onMounted(async () => {
  await fetchNovels()
})
</script> 