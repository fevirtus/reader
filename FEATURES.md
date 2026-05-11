# Features - Reader Web

Trang thai tinh nang cho web app `reader`.

## Guest

| Feature | Status | Notes |
|---|---|---|
| Home boards / browse | done | Goi API browse, hot/recommendation sections |
| Genre listing/detail | done | `/api/genres`, `/api/novels/browse` |
| Search + suggest | partial | Suggest da co web, can tiep tuc canh edge cases |
| Novel detail + chapter list | done | Chi tiet + comment/thread load |

## User

| Feature | Status | Notes |
|---|---|---|
| Google login (NextAuth) | done | Session cookie auth |
| Bookmark CRUD | done | Qua `/api/user/bookmarks` |
| Reading progress sync | partial | Co call API, can them parity checks |
| Reading settings | done | `/api/user/settings` |
| Comment on novel/chapter | done | `/api/truyen/{id}/comments` |
| Rating | done | `/api/truyen/{id}/rate` |
| Recommendations | done | `/api/user/recommendations` |

## MOD/ADMIN

| Feature | Status | Notes |
|---|---|---|
| MOD dashboard/workflows | partial | Mot phan route mod da co, tiep tuc bo sung |
| EPUB import wizard | done | `/mod/import`: `/api/mod/the-loai`, `POST /api/import/uploads/preview`, `/api/mod/epub`, `/api/mod/epub/ai-suggest` |

## Dependencies

- Contract: `reader/CONTRACT.md`
- Mapping: `reader/CROSS_REPO_ENDPOINT_MATRIX.md`
