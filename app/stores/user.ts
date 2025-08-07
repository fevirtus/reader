import { defineStore } from 'pinia'

interface User {
  id: string
  email: string
  username?: string
  role?: string
  created_at?: string
  updated_at?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  lastFetch: number | null
  tokenExpiry: number | null
}

export const useUserStore = defineStore('user', {
  state: (): AuthState => ({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    lastFetch: null,
    tokenExpiry: null
  }),

  getters: {
    // Kiểm tra xem user có phải admin không
    isAdmin: (state) => state.user?.role === 'admin',
    
    // Kiểm tra xem token có còn hợp lệ không
    isTokenValid: (state) => {
      if (!state.tokenExpiry) return false
      return Date.now() < state.tokenExpiry
    },
    
    // Kiểm tra xem có cần fetch user info không
    shouldFetchUser: (state) => {
      // Nếu chưa có user hoặc token không hợp lệ
      if (!state.user || !state.isTokenValid) return true
      
      // Nếu đã fetch quá 5 phút trước
      if (state.lastFetch && Date.now() - state.lastFetch > 5 * 60 * 1000) return true
      
      return false
    }
  },

  actions: {
    // Khởi tạo store từ localStorage
    init() {
      if (process.client) {
        try {
          const token = localStorage.getItem('session_token')
          const userData = localStorage.getItem('user_data')
          const tokenExpiry = localStorage.getItem('token_expiry')
          
          if (token) {
            this.token = token
            this.isAuthenticated = true
          }
          
          if (userData) {
            try {
              this.user = JSON.parse(userData)
            } catch (e) {
              console.error('Error parsing user data:', e)
            }
          }
          
          if (tokenExpiry) {
            this.tokenExpiry = parseInt(tokenExpiry)
          }
        } catch (error) {
          console.warn('Failed to initialize user store from localStorage:', error)
        }
      }
    },

    // Set token và lưu vào localStorage
    setToken(token: string, expiryMinutes: number = 30) {
      this.token = token
      this.isAuthenticated = true
      this.tokenExpiry = Date.now() + (expiryMinutes * 60 * 1000)
      
      if (process.client) {
        localStorage.setItem('session_token', token)
        localStorage.setItem('token_expiry', this.tokenExpiry.toString())
      }
    },

    // Set user info và cache
    setUser(user: User) {
      this.user = user
      this.lastFetch = Date.now()
      
      if (process.client) {
        localStorage.setItem('user_data', JSON.stringify(user))
      }
    },

    // Fetch user info từ API
    async fetchUserInfo() {
      if (!this.token || !this.isTokenValid) {
        this.logout()
        return null
      }

      if (!this.shouldFetchUser) {
        return this.user
      }

      this.isLoading = true
      
      try {
        const config = useRuntimeConfig()
        const apiBase = config.public.apiBase
        
        const response = await fetch(`${apiBase}/api/v1/user/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        })
        
        if (response.status === 401) {
          this.logout()
          return null
        }
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        this.setUser(data)
        return data
      } catch (error) {
        console.error('Error fetching user info:', error)
        return null
      } finally {
        this.isLoading = false
      }
    },

    // Login user
    async login(email: string, password: string) {
      this.isLoading = true
      
      try {
        const config = useRuntimeConfig()
        const apiBase = config.public.apiBase
        
        const response = await fetch(`${apiBase}/api/v1/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ email, password })
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        
        this.setToken(data.access_token, data.expires_in || 30)
        await this.fetchUserInfo()
        
        return { success: true, user: this.user }
      } catch (error) {
        console.error('Login error:', error)
        return { success: false, error: error.message || 'Login failed' }
      } finally {
        this.isLoading = false
      }
    },

    // OAuth login
    async oauthLogin(provider: string) {
      this.isLoading = true
      
      try {
        const config = useRuntimeConfig()
        const apiBase = config.public.apiBase
        
        const response = await fetch(`${apiBase}/api/v1/oauth/${provider}/auth`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        
        // Redirect to OAuth URL
        if (data.auth_url) {
          window.location.href = data.auth_url
        } else {
          throw new Error('No auth URL received from server')
        }
        
        return { success: true }
      } catch (error) {
        console.error('OAuth login error:', error)
        return { success: false, error: error.message || 'OAuth login failed' }
      } finally {
        this.isLoading = false
      }
    },

    // Handle OAuth callback
    async handleOAuthCallback(code: string, state: string) {
      this.isLoading = true
      
      try {
        const config = useRuntimeConfig()
        const apiBase = config.public.apiBase
        
        const response = await fetch(`${apiBase}/api/v1/oauth/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ code, state })
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        
        this.setToken(data.access_token, data.expires_in || 30)
        await this.fetchUserInfo()
        
        return { success: true, user: this.user }
      } catch (error) {
        console.error('OAuth callback error:', error)
        return { success: false, error: error.message || 'OAuth callback failed' }
      } finally {
        this.isLoading = false
      }
    },

    // Logout user
    logout() {
      this.user = null
      this.token = null
      this.isAuthenticated = false
      this.lastFetch = null
      this.tokenExpiry = null
      
      if (process.client) {
        localStorage.removeItem('session_token')
        localStorage.removeItem('user_data')
        localStorage.removeItem('token_expiry')
      }
    },

    // Check auth status (được gọi khi app khởi động)
    async checkAuthStatus() {
      if (!this.token) {
        return false
      }
      
      if (!this.isTokenValid) {
        this.logout()
        return false
      }
      
      if (this.shouldFetchUser) {
        await this.fetchUserInfo()
      }
      
      return this.isAuthenticated
    },

    // Clear cache (force fetch lại user info)
    clearCache() {
      this.lastFetch = null
      if (process.client) {
        localStorage.removeItem('user_data')
      }
    }
  }
}) 