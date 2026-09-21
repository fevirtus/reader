# Reader — Web

Ứng dụng đọc truyện trên web và giao diện quản lý nội dung của bộ Reader.

- `reader`: giao diện Next.js cho người đọc và MOD/ADMIN.
- `reader-api`: backend chung, xử lý nghiệp vụ, xác thực và lưu trữ.
- `reader-app`: ứng dụng Flutter cho người đọc.

## Phạm vi hiện tại

Người đọc có thể duyệt/tìm truyện, xem thể loại và bảng xếp hạng, đọc chương,
đánh giá truyện, quản lý tủ sách đang đọc/đã đọc và lưu thiết lập đọc.
Tiến độ được gửi qua thao tác `updateProgress` của API bookmarks.
Bình luận và đề cử không còn trong phạm vi hiện tại.

MOD/ADMIN có giao diện quản lý truyện, chương, thể loại, ảnh bìa và import EPUB.
Import hỗ trợ preview, gợi ý metadata bằng AI, chỉnh cách tách chương và áp dụng
kết quả; có cả giao diện import từng file và theo lô.

## Kiến trúc và xác thực

- `app/`: trang, server rendering và route handlers.
- `components/`: giao diện dùng chung.
- `lib/server-api.ts`, `lib/server-auth.ts`: gọi backend từ server.
- `next.config.mjs` và `app/api/`: rewrite/proxy tới `READER_API_ORIGIN`.

Google ID token được gửi tới `/api/auth/login` của web; route này gọi
`POST /api/auth/mobile-login` trên backend và lưu access token vào cookie
HttpOnly `reader_access_token`. `/api/auth/session` lấy thông tin user từ backend;
`/api/auth/logout` xóa cookie. Route NextAuth cũ trả `410`.

Nghiệp vụ và truy cập dữ liệu của các luồng hiện tại đi qua API. Repo vẫn giữ
Prisma schema, migrations và dependency cũ; chúng không có nghĩa web sở hữu
một database riêng. Không cần chạy `prisma db push` để khởi động web với backend
đã được chuẩn bị.

## Chạy local

Cần Node.js, pnpm và backend đang chạy. Dockerfile hiện dùng Node 22.
Tạo `.env` với:

```dotenv
READER_API_ORIGIN=http://localhost:8000
GOOGLE_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
```

Client ID này phải nằm trong danh sách cho phép của backend. Endpoint cấu hình
web ưu tiên `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, rồi `WEB_GOOGLE_CLIENT_ID`, rồi
`GOOGLE_CLIENT_ID`; tránh để giá trị cũ ở biến có mức ưu tiên cao hơn.
Luồng đăng nhập hiện tại không dùng Google client secret trên web.

```bash
pnpm install
pnpm exec prisma generate
pnpm dev
```

Web chạy tại `http://localhost:3000`.

```bash
pnpm exec tsc --noEmit
pnpm build
pnpm start
```

`next.config.mjs` đang bật `typescript.ignoreBuildErrors`, nên build thành công
không thay thế việc kiểm tra TypeScript riêng.

## Docker

Dùng cấu hình chạy chung trong [reader-api](../reader-api/README.md).
Cấu hình đó build web từ repo `../reader`, mở cổng 3000 và gọi API nội bộ qua
`http://api:8000`. File `docker-compose.yml` trong repo web là cấu hình triển khai
riêng với giá trị môi trường cố định và cổng 3003, không phải cấu hình local chung.

Container áp dụng `READER_API_ORIGIN` cho cả server fetch và proxy lúc khởi động,
kể cả khi image được build với địa chỉ khác. Trong Kubernetes namespace `reader`,
đặt `READER_API_ORIGIN=http://reader-api` (Service port 80). Địa chỉ này chỉ dành
cho server web; ứng dụng mobile tiếp tục dùng URL HTTPS công khai của backend.

## Tài liệu dùng chung

Các liên kết dưới đây giả định ba repo được checkout cạnh nhau:

- [Backend và lưu trữ](../reader-api/README.md)
- [API contract hiện tại](../reader-api/CONTRACT.md)
- [Đối chiếu tính năng web/mobile](../reader-api/CROSS_REPO_ENDPOINT_MATRIX.md)

Khi đổi endpoint hoặc hành vi chung, cập nhật tài liệu tại backend và kiểm tra
các client đang sử dụng. Không sao chép contract sang từng repo.
