import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SeriesClient } from "./series-client"

export default async function ModSeriesPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "MOD" && session.user.role !== "ADMIN")) {
    redirect("/")
  }

  return <SeriesClient />
}
