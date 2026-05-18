# Reader Project

Đây là dự án nền tảng đọc truyện (Web Application) được xây dựng với kiến trúc hiện đại; dữ liệu cấu trúc và metadata người dùng lưu trên PostgreSQL (Prisma), nội dung chương và file quản lý qua API backend (`reader-api`).

## 🚀 Tính năng nổi bật

- **Xác thực & Phân quyền**: Đăng nhập bằng Google Authentication (NextAuth). Hỗ trợ phân quyền người dùng (USER, MOD, ADMIN).
- **Quản lý nội dung (Dành cho MOD/ADMIN)**: Dashboard quản lý truyện, tải lên chương mới, quản lý trạng thái truyện (Đang ra, Hoàn thành, Tạm ngưng).
- **Trải nghiệm đọc**: Khám phá truyện theo thể loại, tìm kiếm truyện, đọc chương qua API backend.
- **Tương tác người dùng**: Tính năng tủ sách (bookmark) giúp lưu lại tiến độ đọc, hỗ trợ bình luận ở truyện và từng chương.

## 🛠 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router), React 19
- **Styling**: [TailwindCSS v4](https://tailwindcss.com/) & [Radix UI](https://www.radix-ui.com/) (shadcn/ui)
- **Database**:
  - **PostgreSQL**: Metadata và dữ liệu người dùng trên web (Prisma). Nội dung chương và file do **reader-api** phục vụ (NAS/R2 tùy cấu hình backend).
- **Auth**: [NextAuth.js](https://next-auth.js.org/)

---

## 💻 Hướng dẫn chạy Local (Phát triển)

### 1. Yêu cầu cài đặt
- [Node.js](https://nodejs.org/) (Khuyến nghị bản LTS)
- [pnpm](https://pnpm.io/) (Tool quản lý package)
- Database: PostgreSQL (local hoặc máy chủ). Backend `reader-api` dùng chung hoặc riêng tùy triển khai.

### 2. Cấu hình môi trường
Tạo file `.env` ở thư mục gốc dựa trên `.env.example` (nếu có) hoặc điền các thông tin sau:

```env
# URL kết nối PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/reader?schema=public"

# Cấu hình NextAuth
NEXTAUTH_SECRET="your-super-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# API backend dùng chung cho web + mobile
READER_API_ORIGIN="http://localhost:8000"

# Cấu hình Google Login
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# Cloudflare R2 (lưu ảnh bìa)
R2_ACCOUNT_ID="your_cloudflare_account_id"
R2_ACCESS_KEY_ID="your_r2_access_key_id"
R2_SECRET_ACCESS_KEY="your_r2_secret_access_key"
R2_BUCKET_NAME="your_r2_bucket_name"
R2_PUBLIC_BASE_URL="https://your-public-r2-domain"
```

### 3. Cài đặt dependencies và khởi tạo DB

```bash
# Cài đặt các gói thư viện
pnpm install

# Đồng bộ schema xuống PostgreSQL và generate Prisma client
npx prisma db push
# hoặc (nếu muốn dùng migrate)
# npx prisma migrate dev

# Generate thư viện Prisma
npx prisma generate
```

### 4. Chạy môi trường phát triển

```bash
pnpm dev
```
Truy cập vào [http://localhost:3000](http://localhost:3000) để xem ứng dụng.

Lưu ý: traffic API user-facing và MOD đi qua `READER_API_ORIGIN` theo hai cách:

- **Rewrites** trong `next.config.mjs`: `/api/genres`, `/api/novels/*`, `/api/chapters/*`, `/api/auth/mobile-login`, `/api/health`, `/api/dev/*`.
- **Route handlers** proxy trong `app/api/*/route.ts`: `/api/truyen/*`, `/api/user/*`, `/api/mod/*`, và `POST /api/import/uploads/preview` (forward request kèm cookie/session).

Một số chỗ server-side gọi API trực tiếp qua `lib/server-api.ts` / `lib/server-auth.ts` (không đi qua rewrite ở trên).

---

## 🏗 Hướng dẫn Build

Để build project cho môi trường production:

```bash
# Đảm bảo Prisma Client đã được generate
npx prisma generate

# Chạy lệnh build của Next.js
pnpm build
```

Sau khi build xong, bạn có thể khởi chạy server production bằng:
```bash
pnpm start
```

---

## 🐳 Triển khai dưới dạng Docker

Bạn có thể dễ dàng triển khai ứng dụng bằng nền tảng Docker. Dưới đây là cách đóng gói và chạy thông qua `docker-compose`.

### 1. Tạo file `Dockerfile`
Tạo file `Dockerfile` ở thư mục gốc của dự án với cấu hình multi-stage build để tối ưu dung lượng:

```dockerfile
# Stage 1: Dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Tạo prisma client
RUN npx prisma generate
# Chạy build
RUN corepack enable pnpm && pnpm build

# Stage 3: Runner
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
```
*(Lưu ý: Để build mục `standalone` hoạt động, bạn cần bổ sung `output: 'standalone'` trong file `next.config.mjs`)*

### 2. Tạo file `docker-compose.yml`
Sử dụng Docker Compose để chạy ứng dụng (giả sử Database của bạn được host riêng hoặc bạn có thể thêm service DB vào file này):

```yaml
version: '3.8'

services:
  web:
    build:
      context: .
      dockerfile: Dockerfile
    image: reader-web:latest
    container_name: reader-app
    ports:
      - "3000:3000"
    env_file:
      - .env
    restart: unless-stopped
```

### 3. Khởi chạy bằng Docker
Chạy lệnh sau để build image và start container:

```bash
# Build và chạy ngầm (detached mode)
docker-compose up -d --build
```

Để xem log của container:
```bash
docker-compose logs -f web
```
Dừng và xóa container:
```bash
docker-compose down
```
