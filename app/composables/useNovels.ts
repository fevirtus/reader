import { ref, readonly } from 'vue'

// Interface cho Novel
interface Novel {
  id: number
  title: string
  author: string
  description?: string
  cover_image?: string
  status: 'ongoing' | 'completed'
  total_chapters: number
  views: number
  rating: number
  created_at: string
  updated_at: string
  word_count?: number
  tags?: string[]
}

export const useNovels = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase

  const novels = ref<Novel[]>([])
  const loading = ref(false)
  const error = ref('')
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(20)

  // Interface cho params
  interface NovelParams {
    skip?: number
    limit?: number
    page?: number
    search?: string
    status?: string
    author?: string
  }

  // Lấy danh sách novels
  const fetchNovels = async (params: NovelParams = {}) => {
    try {
      loading.value = true
      error.value = ''

      const queryParams = new URLSearchParams()
      
      // Thêm các params
      if (params.skip !== undefined) queryParams.append('skip', params.skip.toString())
      if (params.limit !== undefined) queryParams.append('limit', params.limit.toString())
      if (params.page !== undefined) {
        const skip = (params.page - 1) * (params.limit || 20)
        queryParams.append('skip', skip.toString())
      }
      if (params.search) queryParams.append('search', params.search)
      if (params.status) queryParams.append('status', params.status)
      if (params.author) queryParams.append('author', params.author)

      const url = `${apiBase}/api/v1/novels${queryParams.toString() ? '?' + queryParams.toString() : ''}`

      const response = await fetch(url)
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch novels: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      
      // Handle new API response format
      if (data.items && Array.isArray(data.items)) {
        novels.value = data.items
        total.value = data.total
      } else {
        novels.value = []
        total.value = 0
      }
      
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải danh sách truyện'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Lấy thông tin novel theo ID
  const fetchNovelById = async (novelId: string | number) => {
    try {
      loading.value = true
      error.value = ''

      const url = `${apiBase}/api/v1/novels/${novelId}`

      const response = await fetch(url)

      if (response.status === 404) {
        throw new Error('Truyện không tồn tại')
      }

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch novel: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log('Novel details fetched successfully:', data)
      return data
    } catch (err) {
      console.error('Error fetching novel details:', err)
      error.value = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải thông tin truyện'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Tìm kiếm novels
  const searchNovels = async (searchQuery: string) => {
    return await fetchNovels({ search: searchQuery, limit: 50 })
  }

  // Lọc theo trạng thái
  const filterByStatus = async (status: string) => {
    return await fetchNovels({ status, limit: 50 })
  }

  // Lọc theo tác giả
  const filterByAuthor = async (author: string) => {
    return await fetchNovels({ author, limit: 50 })
  }

  // Lấy trang novels
  const fetchPage = async (page: number, pageSize: number = 20) => {
    const skip = (page - 1) * pageSize
    currentPage.value = page
    return await fetchNovels({ skip, limit: pageSize })
  }

  return {
    novels: readonly(novels),
    loading: readonly(loading),
    error: readonly(error),
    total: readonly(total),
    currentPage: readonly(currentPage),
    pageSize: readonly(pageSize),
    fetchNovels,
    fetchNovelById,
    searchNovels,
    filterByStatus,
    filterByAuthor,
    fetchPage
  }
} 