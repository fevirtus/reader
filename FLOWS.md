# Flows - Reader Web

Luon xem `reader-api` la canonical behavior.

## Flow 1: Web Login and Session

- Trigger: user bam dang nhap Google.
- Preconditions: env OAuth hop le.
- Steps:
  1. User xac thuc Google qua NextAuth.
  2. Web co session cookie.
  3. Web goi endpoint user de hydrate profile/state.
- Success: user vao trang co tinh nang ca nhan hoa.

## Flow 2: Browse -> Novel Detail -> Read Chapter

- Trigger: user click tu home/search/genre.
- Steps:
  1. Goi `/api/novels/browse` hoac `/api/novels/{idOrSlug}`.
  2. Goi `/api/truyen/{id}/chapters` lay muc luc.
  3. Doc chapter qua luong chapter hien co cua web.
- Failure handling:
  - 404: thong bao khong tim thay truyen/chuong.
  - 5xx: retry UI + fallback message.

## Flow 3: Bookmark and Progress Sync

- Trigger: user bookmark hoac chuyen chuong.
- Steps:
  1. Bookmark: `GET/POST/DELETE /api/user/bookmarks`.
  2. Progress: `POST /api/user/reading-progress`.
  3. UI cap nhat trang thai optimistic + reconcile API.
- Expected parity: cung nghia status voi mobile.

## Flow 4: Comment / Rating / Recommendation

- Comment: `GET/POST /api/truyen/{id}/comments`.
- Rating: `POST /api/truyen/{id}/rate`.
- Recommendation: `/api/user/recommendations`.
- Error rules: follow `CONTRACT.md`.
