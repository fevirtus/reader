# Features - Reader Web

Trang thai tinh nang cho web app `reader`.

## Guest

| Feature | Status | Notes |
|---|---|---|
| Home boards / browse | done | Hot carousel, xep hang danh gia/luot doc, truyen moi cap nhat |
| Genre listing/detail | done | `/api/genres`, `/api/novels/browse` |
| Search + suggest | partial | Suggest da co web, can tiep tuc canh edge cases |
| Novel detail + chapter list | done | Chi tiet + rating interactive |

## User

| Feature | Status | Notes |
|---|---|---|
| Google login (NextAuth) | done | Session cookie auth |
| Bookshelf (dang doc / da doc) | done | 2 tab; khong con kệ danh dau |
| Mark as read | done | `POST /api/user/bookmarks` action `markAsRead` |
| Reading progress sync | partial | Co call API, can them parity checks |
| Reading settings | done | `/api/user/settings` |
| Rating | done | `/api/truyen/{id}/rate` thang 1-10 |

## MOD/ADMIN

| Feature | Status | Notes |
|---|---|---|
| MOD dashboard/workflows | partial | Mot phan route mod da co |
| EPUB import wizard | done | `/mod/import` |

## Da loai bo

- Comment, de cu (user/editor), admin truyen thieu du lieu, quan ly de cu

## Dependencies

- Contract: `reader/CONTRACT.md`
- Mapping: `reader/CROSS_REPO_ENDPOINT_MATRIX.md`
