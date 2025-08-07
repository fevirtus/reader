# Reader App

Ứng dụng đọc truyện online với giao diện đẹp và dễ sử dụng.

## Tính năng

### Cho người dùng
- Đăng nhập/đăng ký với Google OAuth
- Xem danh sách truyện với pagination
- Tìm kiếm truyện theo tên, tác giả
- Lọc truyện theo trạng thái (đang tiến hành/hoàn thành)
- Đọc truyện với giao diện đẹp
- Theo dõi tiến độ đọc

### Cho Admin
- Dashboard với thống kê tổng quan
- Quản lý truyện (thêm, sửa, xóa)
- Upload truyện từ file EPUB
- Quản lý người dùng và phân quyền
- Xem hoạt động gần đây

## Cài đặt

### Backend (Python/FastAPI)

1. Clone repository:
```bash
git clone <repository-url>
cd reader-be
```

2. Cài đặt dependencies:
```bash
pip install -r requirements.txt
# hoặc sử dụng uv
uv sync
```

3. Cấu hình environment:
```bash
cp env.example .env
# Chỉnh sửa .env với thông tin Supabase và OAuth
```

4. Chạy backend:
```bash
uvicorn main:app --reload
```

### Frontend (Nuxt.js)

1. Cài đặt dependencies:
```bash
cd reader
npm install
# hoặc
bun install
```

2. Cấu hình environment:
```bash
# Tạo .env.local với API_BASE_URL
echo "API_BASE_URL=http://localhost:8000" > .env.local
```

3. Chạy frontend:
```bash
npm run dev
# hoặc
bun dev
```

## Tạo Admin User

1. Đăng ký tài khoản thông qua OAuth trên frontend
2. Chạy script tạo admin:

```bash
cd reader-be
python scripts/create_admin.py your-email@example.com "Your Name"
```

3. Đăng nhập lại trên frontend, bạn sẽ thấy link "Admin Panel" trong menu user

## Sử dụng Admin Panel

### Dashboard
- Xem thống kê tổng quan: số truyện, chương, người dùng, lượt xem
- Xem hoạt động gần đây

### Quản lý truyện
- Xem danh sách tất cả truyện
- Thêm truyện mới
- Chỉnh sửa thông tin truyện
- Xóa truyện

### Upload truyện
- Upload file EPUB
- Hệ thống tự động trích xuất thông tin từ EPUB
- Tạo truyện và các chương tự động

### Quản lý người dùng
- Xem danh sách người dùng
- Thay đổi quyền người dùng (user/admin)

## Công nghệ sử dụng

### Frontend
- Nuxt.js 3
- Vue.js 3
- Tailwind CSS
- TypeScript

### Backend
- FastAPI
- Supabase (PostgreSQL)
- Python 3.11+

## License

MIT License
