import { ref, readonly } from 'vue'

// Interface cho Chapter
interface Chapter {
  id: number
  novel_id: number
  title: string
  chapter_number: number
  content_file: string
  word_count: number
  views: number
  created_at: string
  updated_at: string
}

// Interface cho Chapter Content
interface ChapterContent {
  content: string
  format: 'markdown' | 'html'
  chapter_info: {
    id: number
    title: string
    chapter_number: number
    novel_id: number
  }
}

// Interface cho API Response với pagination
interface ChaptersResponse {
  items: Chapter[]
  total: number
  page: number
  limit: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
  next_page: number | null
  prev_page: number | null
}

export const useChapters = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase

  const chapters = ref<Chapter[]>([])
  const loading = ref(false)
  const error = ref('')
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(20)

  // Interface cho params
  interface ChapterParams {
    novel_id: number
    skip?: number
    limit?: number
    page?: number
  }

  // Lấy danh sách chapters
  const fetchChapters = async (params: ChapterParams) => {
    try {
      loading.value = true
      error.value = ''

      const queryParams = new URLSearchParams()
      
      // Required params
      queryParams.append('novel_id', params.novel_id.toString())
      
      // Optional params
      if (params.skip !== undefined) queryParams.append('skip', params.skip.toString())
      if (params.limit !== undefined) queryParams.append('limit', params.limit.toString())
      if (params.page !== undefined) {
        const skip = (params.page - 1) * (params.limit || 20)
        queryParams.append('skip', skip.toString())
      }

      const url = `${apiBase}/api/v1/chapters${queryParams.toString() ? '?' + queryParams.toString() : ''}`

      const response = await fetch(url)
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch chapters: ${response.status} - ${errorText}`)
      }

      const data: ChaptersResponse = await response.json()
      
      // Handle new API response format
      if (data.items && Array.isArray(data.items)) {
        chapters.value = data.items
        total.value = data.total
        currentPage.value = data.page
        pageSize.value = data.limit
      } else {
        chapters.value = []
        total.value = 0
      }
      
      return data
    } catch (err) {
      console.error('Error fetching chapters:', err)
      error.value = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải danh sách chương'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Lấy nội dung chapter
  const fetchChapterContent = async (chapterId: number, format: 'markdown' | 'html' = 'markdown') => {
    try {
      loading.value = true
      error.value = ''

      const url = `${apiBase}/api/v1/chapters/${chapterId}?format=${format}`
      console.log('Fetching chapter content from:', url)

      const response = await fetch(url)
      
      if (response.status === 404) {
        throw new Error('Chương không tồn tại')
      }

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch chapter content: ${response.status} - ${errorText}`)
      }

      const data: ChapterContent = await response.json()
      console.log('Chapter content fetched successfully:', data)
      return data
    } catch (err) {
      console.error('Error fetching chapter content:', err)
      error.value = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải nội dung chương'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Lấy trang chapters
  const fetchPage = async (page: number, novelId: number, pageSize: number = 20) => {
    const skip = (page - 1) * pageSize
    currentPage.value = page
    return await fetchChapters({ novel_id: novelId, skip, limit: pageSize })
  }

  // Reset state
  const reset = () => {
    chapters.value = []
    loading.value = false
    error.value = ''
    total.value = 0
    currentPage.value = 1
  }

  return {
    chapters: readonly(chapters),
    loading: readonly(loading),
    error: readonly(error),
    total: readonly(total),
    currentPage: readonly(currentPage),
    pageSize: readonly(pageSize),
    fetchChapters,
    fetchChapterContent,
    fetchPage,
    reset
  }
} 