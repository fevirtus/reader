import { requireModSessionUser } from "@/lib/server-auth"
import { MissingFieldsClient } from "./missing-fields-client"

export default async function ModMissingFieldsPage() {
    await requireModSessionUser()

    return <MissingFieldsClient />
}
