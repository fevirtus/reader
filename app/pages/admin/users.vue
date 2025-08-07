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
            <h1 class="text-3xl font-bold text-gray-900">Quản lý Người dùng</h1>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <!-- Filters -->
      <div class="bg-white shadow rounded-lg mb-6">
        <div class="px-4 py-5 sm:p-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Tìm kiếm</label>
              <input
                v-model="filters.search"
                type="text"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Email, tên..."
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Vai trò</label>
              <select
                v-model="filters.role"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Tất cả</option>
                <option value="user">Người dùng</option>
                <option value="admin">Admin</option>
              </select>
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

      <!-- Users Table -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Người dùng
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vai trò
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="user in users" :key="user.id" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-10 w-10">
                        <div class="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <svg class="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">{{ user.name || 'Chưa có tên' }}</div>
                        <div class="text-sm text-gray-500">ID: {{ user.id }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ user.email }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      :class="[
                        'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                      ]"
                    >
                      {{ user.role === 'admin' ? 'Admin' : 'Người dùng' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ formatDate(user.created_at) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Hoạt động
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex items-center justify-end space-x-2">
                      <button
                        @click="changeUserRole(user)"
                        :class="[
                          'text-sm font-medium rounded-md px-3 py-1',
                          user.role === 'admin' 
                            ? 'text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100' 
                            : 'text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100'
                        ]"
                      >
                        {{ user.role === 'admin' ? 'Hủy Admin' : 'Thành Admin' }}
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

    <!-- Role Change Modal -->
    <div v-if="showRoleModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Thay đổi vai trò</h3>
          <div class="space-y-4">
            <div>
              <p class="text-sm text-gray-600">
                Bạn có chắc chắn muốn thay đổi vai trò của <strong>{{ selectedUser?.name || selectedUser?.email }}</strong>?
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Vai trò mới</label>
              <select
                v-model="newRole"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="user">Người dùng</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div class="flex justify-end space-x-3">
              <button
                @click="closeRoleModal"
                class="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Hủy
              </button>
              <button
                @click="confirmRoleChange"
                class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Xác nhận
              </button>
            </div>
          </div>
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

const { apiGet, apiPost } = useApi()
const config = useRuntimeConfig()
const apiBase = config.public.apiBase

// State
const users = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

const filters = ref({
  search: '',
  role: ''
})

const showRoleModal = ref(false)
const selectedUser = ref(null)
const newRole = ref('user')

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
const fetchUsers = async () => {
  try {
    loading.value = true
    
    const queryParams = new URLSearchParams()
    queryParams.append('page', currentPage.value.toString())
    queryParams.append('limit', pageSize.value.toString())
    
    if (filters.value.search) queryParams.append('search', filters.value.search)
    if (filters.value.role) queryParams.append('role', filters.value.role)
    
    const response = await apiGet(`${apiBase}/api/v1/admin/users?${queryParams.toString()}`)
    
    users.value = response.items || []
    total.value = response.total || 0
    
  } catch (error) {
    console.error('Error fetching users:', error)
  } finally {
    loading.value = false
  }
}

const applyFilters = () => {
  currentPage.value = 1
  fetchUsers()
}

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    fetchUsers()
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    fetchUsers()
  }
}

const goToPage = (page) => {
  currentPage.value = page
  fetchUsers()
}

const changeUserRole = (user) => {
  selectedUser.value = user
  newRole.value = user.role === 'admin' ? 'user' : 'admin'
  showRoleModal.value = true
}

const confirmRoleChange = async () => {
  try {
    await apiPost(`${apiBase}/api/v1/admin/users/role`, {
      user_id: selectedUser.value.id,
      role: newRole.value
    })
    
    // Update local state
    const userIndex = users.value.findIndex(u => u.id === selectedUser.value.id)
    if (userIndex !== -1) {
      users.value[userIndex].role = newRole.value
    }
    
    closeRoleModal()
  } catch (error) {
    console.error('Error changing user role:', error)
  }
}

const closeRoleModal = () => {
  showRoleModal.value = false
  selectedUser.value = null
  newRole.value = 'user'
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('vi-VN')
}

onMounted(async () => {
  await fetchUsers()
})
</script> 