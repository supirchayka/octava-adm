import { serverApi } from "@/lib/server-fetch"
import { AboutForm } from "./about-form"

async function fetchPage() {
  try {
    const res = await serverApi(`/admin/pages/about`)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function AboutAdminPage() {
  const data = await fetchPage()
  return <AboutForm initialData={data} />
}
