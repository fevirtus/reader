import { requireModSessionUser } from "@/lib/server-auth"
import { GenreClient } from "./genre-client"

export default async function ModTheLoaiPage() {
  await requireModSessionUser()

  return <GenreClient />
}
