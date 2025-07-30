# Reader App

Ứng dụng đọc truyện online với giao diện đẹp và dễ sử dụng, được xây dựng bằng Nuxt 3.

## Tính năng

- ✅ Đăng nhập với Google OAuth
- ✅ Giao diện responsive và hiện đại
- ✅ Quản lý session tự động
- ✅ Middleware bảo vệ trang
- 🔄 Tìm kiếm và duyệt truyện (đang phát triển)
- 🔄 Đọc truyện online (đang phát triển)
- 🔄 Lưu truyện yêu thích (đang phát triển)

## Cài đặt

```bash
# Cài đặt dependencies
npm install

# Chạy development server
npm run dev

# Build cho production
npm run build
```

## Test với Demo Backend

Để test OAuth flow, bạn có thể sử dụng demo backend:

```bash
# Cài đặt dependencies cho demo backend
npm install express cors

# Chạy demo backend
cd demo-backend
npm install
node demo-backend.js
```

Sau đó truy cập `http://localhost:3000` và thử đăng nhập với Google.

## Cấu hình Backend

Ứng dụng cần backend API chạy tại `http://localhost:8000` với các endpoint:

### OAuth Google
- `GET /api/v1/oauth/google/auth` - Lấy URL xác thực Google
- `GET /api/v1/oauth/google/callback?code={code}` - Xử lý callback từ Google

### User Profile (tùy chọn)
- `GET /api/v1/user/profile` - Lấy thông tin user (cần Authorization header)

## Cấu trúc dự án

```
app/
├── pages/
│   ├── index.vue          # Trang chủ
│   └── login.vue          # Trang đăng nhập
├── composables/
│   └── useAuth.ts         # Composable quản lý auth
├── middleware/
│   └── auth.ts            # Middleware bảo vệ trang
└── assets/
    └── css/
        └── main.css       # Styles chính
```

## Sử dụng

1. Truy cập `http://localhost:3000`
2. Nếu chưa đăng nhập, sẽ được chuyển hướng đến trang login
3. Click "Đăng nhập với Google" để bắt đầu quá trình OAuth
4. Sau khi đăng nhập thành công, sẽ được chuyển về trang chủ

## Công nghệ sử dụng

- **Frontend**: Nuxt 3, Vue 3, TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Google OAuth 2.0
- **State Management**: Vue Composition API

## Phát triển

### Thêm OAuth provider mới

1. Cập nhật `useAuth.ts` để thêm method mới
2. Cập nhật UI trong `login.vue`
3. Thêm endpoint tương ứng trong backend

### Thêm tính năng mới

1. Tạo component trong `app/components/`
2. Tạo composable nếu cần trong `app/composables/`
3. Tạo page mới trong `app/pages/`

## License

MIT
