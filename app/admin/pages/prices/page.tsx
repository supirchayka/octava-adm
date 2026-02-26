import { serverApi } from "@/lib/server-fetch"
import { PricesForm } from "./prices-form"

async function fetchPage() {
  try {
    const res = await serverApi(`/admin/pages/prices`)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function PricesAdminPage() {
  const data = await fetchPage()
  return <PricesForm initialData={data} />
}
