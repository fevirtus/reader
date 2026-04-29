import { requireModSessionUser } from "@/lib/server-auth"
import { ImportClient } from "./import-client"

export default async function ModImportPage() {
  await requireModSessionUser()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Import EPUB</h1>
      <p className="text-muted-foreground mb-6">
        Quản lý nguồn EPUB trên NAS, chạy convert, map chapter và hoàn tất import.
      </p>
      <ImportClient />
    </div>
  )
}
