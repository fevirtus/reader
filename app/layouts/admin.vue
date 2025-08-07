<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Sidebar -->
    <div class="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
      <div class="flex items-center justify-center h-16 px-4 bg-blue-600">
        <h1 class="text-xl font-bold text-white">Admin Panel</h1>
      </div>
      
      <nav class="mt-8">
        <div class="px-4">
          <div class="space-y-2">
            <NuxtLink
              to="/admin"
              class="flex items-center px-4 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
              :class="{ 'bg-blue-50 text-blue-700': $route.path === '/admin' }"
            >
              <svg class="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
              </svg>
              Dashboard
            </NuxtLink>
            
            <NuxtLink
              to="/admin/novels"
              class="flex items-center px-4 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
              :class="{ 'bg-blue-50 text-blue-700': $route.path === '/admin/novels' }"
            >
              <svg class="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Quản lý truyện
            </NuxtLink>
            
            <NuxtLink
              to="/admin/upload"
              class="flex items-center px-4 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
              :class="{ 'bg-blue-50 text-blue-700': $route.path === '/admin/upload' }"
            >
              <svg class="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload truyện
            </NuxtLink>
            
            <NuxtLink
              to="/admin/users"
              class="flex items-center px-4 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
              :class="{ 'bg-blue-50 text-blue-700': $route.path === '/admin/users' }"
            >
              <svg class="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              Quản lý người dùng
            </NuxtLink>
          </div>
        </div>
        
        <div class="mt-8 px-4">
          <div class="border-t border-gray-200 pt-4">
            <NuxtLink
              to="/"
              class="flex items-center px-4 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
            >
              <svg class="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Về trang chủ
            </NuxtLink>
          </div>
        </div>
      </nav>
    </div>

    <!-- Main content -->
    <div class="pl-64">
      <slot />
    </div>
  </div>
</template>

<script setup>
// Layout logic here if needed
</script> 