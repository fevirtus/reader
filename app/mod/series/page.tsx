import { requireModSessionUser } from "@/lib/server-auth"
import { SeriesClient } from "./series-client"

export default async function ModSeriesPage() {
  await requireModSessionUser()

  return <SeriesClient />
}
