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
            <h1 class="text-3xl font-bold text-gray-900">Upload Truyện</h1>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <!-- Upload Form -->
          <form @submit.prevent="handleUpload" class="space-y-6">
            <!-- File Upload -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Chọn file EPUB
              </label>
              <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                <div class="space-y-1 text-center">
                  <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  <div class="flex text-sm text-gray-600">
                    <label for="file-upload" class="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                      <span>Upload file</span>
                      <input 
                        id="file-upload" 
                        name="file-upload" 
                        type="file" 
                        accept=".epub"
                        class="sr-only"
                        @change="handleFileSelect"
                        required
                      />
                    </label>
                    <p class="pl-1">hoặc kéo thả vào đây</p>
                  </div>
                  <p class="text-xs text-gray-500">EPUB files only, max 100MB</p>
                </div>
              </div>
              <div v-if="selectedFile" class="mt-2 text-sm text-gray-600">
                <p>File đã chọn: {{ selectedFile.name }}</p>
                <p>Kích thước: {{ formatFileSize(selectedFile.size) }}</p>
              </div>
            </div>

            <!-- Novel Title Override -->
            <div>
              <label for="novel-title" class="block text-sm font-medium text-gray-700">
                Tên truyện (tùy chọn)
              </label>
              <div class="mt-1">
                <input
                  type="text"
                  id="novel-title"
                  v-model="novelTitle"
                  class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Để trống để sử dụng tên từ file EPUB"
                />
              </div>
              <p class="mt-1 text-sm text-gray-500">
                Nếu để trống, hệ thống sẽ sử dụng tên từ metadata của file EPUB
              </p>
            </div>

            <!-- Upload Progress -->
            <div v-if="uploading" class="space-y-2">
              <div class="flex justify-between text-sm text-gray-600">
                <span>Đang upload...</span>
                <span>{{ uploadProgress }}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div 
                  class="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  :style="{ width: uploadProgress + '%' }"
                ></div>
              </div>
            </div>

            <!-- Error Message -->
            <div v-if="error" class="bg-red-50 border border-red-200 rounded-md p-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-red-800">Lỗi upload</h3>
                  <div class="mt-2 text-sm text-red-700">
                    {{ error }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Success Message -->
            <div v-if="uploadSuccess" class="bg-green-50 border border-green-200 rounded-md p-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-green-800">Upload thành công!</h3>
                  <div class="mt-2 text-sm text-green-700">
                    <p>Truyện: {{ uploadResult?.novel?.title }}</p>
                    <p>Số chương: {{ uploadResult?.total_chapters_created }}</p>
                    <NuxtLink 
                      :to="`/novel/${uploadResult?.novel?.id}`" 
                      class="text-green-600 hover:text-green-500 underline"
                    >
                      Xem truyện
                    </NuxtLink>
                  </div>
                </div>
              </div>
            </div>

            <!-- Submit Button -->
            <div class="flex justify-end space-x-3">
              <button
                type="button"
                @click="resetForm"
                class="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Reset
              </button>
              <button
                type="submit"
                :disabled="!selectedFile || uploading"
                class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg v-if="uploading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ uploading ? 'Đang upload...' : 'Upload Truyện' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Upload History -->
      <div class="mt-8 bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Lịch sử upload</h3>
          <div class="flow-root">
            <ul class="-mb-8">
              <li v-for="upload in uploadHistory" :key="upload.id" class="relative pb-8">
                <div class="relative flex space-x-3">
                  <div>
                    <span class="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
                      <svg class="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                    </span>
                  </div>
                  <div class="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                    <div>
                      <p class="text-sm text-gray-900">{{ upload.novel_title }}</p>
                      <p class="text-sm text-gray-500">{{ upload.chapters_count }} chương</p>
                    </div>
                    <div class="text-right text-sm whitespace-nowrap text-gray-500">
                      <time>{{ formatDate(upload.created_at) }}</time>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'admin',
  layout: 'admin'
})

const { apiPost } = useApi()
const config = useRuntimeConfig()
const apiBase = config.public.apiBase

// State
const selectedFile = ref(null)
const novelTitle = ref('')
const uploading = ref(false)
const uploadProgress = ref(0)
const error = ref('')
const uploadSuccess = ref(false)
const uploadResult = ref(null)
const uploadHistory = ref([])

// Handle file selection
const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.epub')) {
      error.value = 'Chỉ chấp nhận file EPUB'
      return
    }
    
    // Validate file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      error.value = 'File quá lớn (tối đa 100MB)'
      return
    }
    
    selectedFile.value = file
    error.value = ''
    uploadSuccess.value = false
  }
}

// Format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Handle upload
const handleUpload = async () => {
  if (!selectedFile.value) {
    error.value = 'Vui lòng chọn file EPUB'
    return
  }

  try {
    uploading.value = true
    uploadProgress.value = 0
    error.value = ''
    uploadSuccess.value = false

    const formData = new FormData()
    formData.append('epub_file', selectedFile.value)
    if (novelTitle.value) {
      formData.append('novel_title', novelTitle.value)
    }

    // Simulate progress
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += 10
      }
    }, 200)

    const response = await fetch(`${apiBase}/api/v1/novels/upload-epub`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('session_token')}`
      },
      body: formData
    })

    clearInterval(progressInterval)
    uploadProgress.value = 100

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Upload failed: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    uploadResult.value = result
    uploadSuccess.value = true
    
    // Add to history
    uploadHistory.value.unshift({
      id: Date.now(),
      novel_title: result.novel.title,
      chapters_count: result.total_chapters_created,
      created_at: new Date().toISOString()
    })

    // Reset form after success
    setTimeout(() => {
      resetForm()
    }, 3000)

  } catch (err) {
    error.value = err.message
    uploadProgress.value = 0
  } finally {
    uploading.value = false
  }
}

// Reset form
const resetForm = () => {
  selectedFile.value = null
  novelTitle.value = ''
  error.value = ''
  uploadSuccess.value = false
  uploadResult.value = null
  uploadProgress.value = 0
  
  // Reset file input
  const fileInput = document.getElementById('file-upload')
  if (fileInput) {
    fileInput.value = ''
  }
}

// Format date
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(async () => {
  // Admin check is handled by middleware
})
</script> 