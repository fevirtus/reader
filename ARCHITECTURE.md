# Reader Suite Architecture (Web)

Tai lieu nay mo ta vai tro cua `reader` (web app) trong bo 3 he thong: Web + Android + API.

## Vai tro trong he thong

- `reader` la frontend web cho end-user va mot phan workflow cho MOD/ADMIN.
- `reader` KHONG duoc tro thanh noi xu ly business logic chinh.
- `reader-api` la API trung tam, la nguon su that cho contract va domain behavior.

## Nguyen tac thong nhat voi mobile + backend

- API-first: moi tinh nang user-facing moi phai co endpoint ro rang trong `reader-api`.
- Contract-first: web va mobile dung chung schema response, error code, pagination.
- Auth parity:
  - Web: NextAuth session cookies.
  - Mobile: Bearer JWT.
  - Ca hai deu map vao cung user identity trong backend.
- Data ownership:
  - PostgreSQL: metadata co cau truc (user, novel, genre, comment, bookmark...).
  - MongoDB: chapter content, recommendation payload lon.

## Kien truc module web

- App layer (`app/*`): route, rendering, page composition.
- UI layer (`components/*`): reusable components, khong chua business rule quan trong.
- Data access layer: goi REST API qua `READER_API_ORIGIN` cho endpoint da migrate.
- Auth adapter: dong bo session NextAuth va profile API.

## Quy uoc tich hop API

- Base URL local: `http://localhost:8000` (qua `READER_API_ORIGIN`).
- Khong hard-code endpoint trong component; gom theo domain (novels, chapters, user...).
- Luon xu ly 3 nhom loi:
  - validation/business (`4xx`)
  - auth (`401/403`)
  - he thong (`5xx`)

## Definition of Done (Web)

- Tinh nang moi co endpoint tai `reader-api` hoac da duoc architect chap thuan.
- Khong duplicate business logic voi mobile.
- Da test luong auth va state dong bo profile/bookmark/progress.
- README va contract docs duoc cap nhat neu co thay doi API.
