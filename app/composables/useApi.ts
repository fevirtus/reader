export const useApi = () => {
  const { handleUnauthorized, getAuthHeaders } = useAuth()

  // Helper function để gọi API với authentication
  const apiCall = async (url: string, options: RequestInit = {}) => {
    try {
      const token = localStorage.getItem('session_token')
      console.log('apiCall - Token check:', token ? 'Token exists' : 'No token')
      
      if (!token) {
        throw new Error('No session token found')
      }

      console.log('apiCall - Making request to:', url)
      console.log('apiCall - Headers:', getAuthHeaders())

      const response = await fetch(url, {
        ...options,
        headers: {
          ...getAuthHeaders(),
          ...options.headers
        }
      })

      console.log('apiCall - Response status:', response.status)

      if (response.status === 401) {
        // Unauthorized - chuyển về login
        console.log('apiCall - Unauthorized, redirecting to login')
        handleUnauthorized()
        throw new Error('Unauthorized')
      }

      if (!response.ok) {
        const errorText = await response.text()
        console.error('apiCall - API Error:', response.status, errorText)
        throw new Error(`API Error: ${response.status} - ${errorText}`)
      }

      return response
    } catch (error) {
      if (error instanceof Error && error.message === 'Unauthorized') {
        throw error
      }
      console.error('API call failed:', error)
      throw error
    }
  }

  // Helper function để gọi API và parse JSON response
  const apiGet = async (url: string) => {
    const response = await apiCall(url, { method: 'GET' })
    return response.json()
  }

  const apiPost = async (url: string, data: any) => {
    const response = await apiCall(url, {
      method: 'POST',
      body: JSON.stringify(data)
    })
    return response.json()
  }

  const apiPut = async (url: string, data: any) => {
    const response = await apiCall(url, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
    return response.json()
  }

  const apiDelete = async (url: string) => {
    const response = await apiCall(url, { method: 'DELETE' })
    return response.json()
  }

  return {
    apiCall,
    apiGet,
    apiPost,
    apiPut,
    apiDelete
  }
} 