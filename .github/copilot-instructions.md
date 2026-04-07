# Project Guidelines

## Code Style
- Dùng TypeScript strict, ưu tiên typing tường minh cho props, API payload và server helpers.
- Tách rõ Server Component và Client Component. Chỉ thêm `"use client"` khi cần state/effect/event handler.
- Giữ naming theo dự án: route tiếng Việt dạng kebab-case (`dang-nhap`, `the-loai`, `tim-kiem`, `tu-sach`), component file dạng kebab-case.
- Dùng TailwindCSS utility + component trong `components/ui`; không tự ý đổi pattern UI nếu chưa cần.

## Architecture
- `app/`: Next.js App Router pages + route handlers.
- `components/`: UI/domain components tái sử dụng.
- `lib/`: tầng truy cập dữ liệu, auth, context, helper dùng chung.
- `prisma/`: schema PostgreSQL; MongoDB model nằm trong `lib/models/`.
- App dùng kiến trúc hybrid DB: PostgreSQL (dữ liệu cấu trúc) + MongoDB (nội dung chương).
- API user-facing thường đi qua proxy routes trong `app/api/**` và `READER_API_ORIGIN`.

## Build and Test
- Cài đặt: `pnpm install`
- Dev server: `pnpm dev`
- Lint: `pnpm lint`
- Build production: `pnpm build`
- Chạy production: `pnpm start`
- Prisma: `npx prisma db push` (hoặc `npx prisma migrate dev`) và `npx prisma generate`
- Kiểm tra kết nối DB/AI nếu cần: `node test-db.js`, `node test-ai.js`

## Conventions
- Ưu tiên dùng helper sẵn có trong `lib/server-api.ts` cho gọi backend ở server side.
- Luồng auth đi qua NextAuth config trong `lib/auth.ts`; không tạo cơ chế xác thực song song trừ khi có yêu cầu rõ ràng.
- Khi sửa API route proxy (`app/api/**`), luôn giữ nguyên behavior forward headers/token nếu route đang bảo vệ quyền.
- Không mở rộng phạm vi thay đổi sang backend Python trong repo khác nếu yêu cầu chỉ thuộc web repo.

## Pitfalls
- Thiếu biến môi trường (`DATABASE_URL`, `MONGODB_URI`, `NEXTAUTH_SECRET`, `READER_API_ORIGIN`) sẽ gây lỗi khó chẩn đoán.
- Nếu Prisma Client chưa generate, import từ `@prisma/client` có thể fail.
- Nếu `reader-api` chưa chạy đúng origin, các route `/api/*` proxy sẽ lỗi upstream.
- `next.config.mjs` đang cho phép bỏ qua lỗi type ở build; vẫn cần giữ chất lượng type khi sửa code.

## Key References
- Tổng quan setup và môi trường: `README.md`
- Auth + session callbacks: `lib/auth.ts`
- App shell và providers: `app/layout.tsx`
- API helper và error model: `lib/server-api.ts`
- Proxy mod route pattern: `app/api/mod/[...path]/route.ts`
- Data model quan hệ: `prisma/schema.prisma`
