# Hướng dẫn Test Reader App

## Bước 1: Khởi động Frontend

```bash
# Terminal 1
bun run dev
```

Frontend sẽ chạy tại: http://localhost:3000

## Bước 2: Khởi động Demo Backend

```bash
# Terminal 2
cd demo-backend
npm install
node demo-backend.js
```

Backend sẽ chạy tại: http://localhost:8000

## Bước 3: Test OAuth Flow

1. Truy cập http://localhost:3000
2. Bạn sẽ thấy trang chủ với thông báo "Bạn chưa đăng nhập"
3. Click "Đăng nhập ngay" hoặc truy cập http://localhost:3000/login
4. Click "Đăng nhập với Google"
5. Bạn sẽ được chuyển hướng đến demo callback
6. Sau khi đăng nhập thành công, bạn sẽ được chuyển về trang chủ với thông tin user

## Test Cases

### ✅ Test Case 1: Trang chủ khi chưa đăng nhập
- Truy cập http://localhost:3000
- Kết quả mong đợi: Hiển thị "Bạn chưa đăng nhập" và nút "Đăng nhập ngay"

### ✅ Test Case 2: Trang login
- Truy cập http://localhost:3000/login
- Kết quả mong đợi: Hiển thị form đăng nhập với nút Google

### ✅ Test Case 3: OAuth Flow
- Click "Đăng nhập với Google"
- Kết quả mong đợi: Chuyển hướng đến callback và đăng nhập thành công

### ✅ Test Case 4: Trang chủ sau khi đăng nhập
- Sau khi đăng nhập thành công
- Kết quả mong đợi: Hiển thị thông tin user và nút "Đăng xuất"

### ✅ Test Case 5: Đăng xuất
- Click "Đăng xuất"
- Kết quả mong đợi: Chuyển về trang login

## API Endpoints Test

### Test OAuth Auth
```bash
curl http://localhost:8000/api/v1/oauth/google/auth
```

### Test OAuth Callback
```bash
curl "http://localhost:8000/api/v1/oauth/google/callback?code=demo_code_123"
```

### Test User Profile
```bash
curl -H "Authorization: Bearer demo_session_token_123" http://localhost:8000/api/v1/user/profile
```

## Troubleshooting

### Lỗi CORS
- Đảm bảo backend đã cài đặt và sử dụng CORS middleware

### Lỗi kết nối backend
- Kiểm tra backend có đang chạy tại port 8000 không
- Kiểm tra console browser để xem lỗi network

### Lỗi authentication
- Kiểm tra localStorage có chứa session_token không
- Kiểm tra network tab để xem request/response 