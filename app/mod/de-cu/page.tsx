import { requireModSessionUser } from "@/lib/server-auth"
import { RecommendationClient } from "./recommendation-client"

export default async function ModRecommendationPage() {
  await requireModSessionUser()

  return <RecommendationClient />
}
