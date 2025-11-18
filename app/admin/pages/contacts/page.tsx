import { serverApi } from "@/lib/server-fetch"
import { ContactsForm } from "./contacts-form"

async function fetchPage() {
  try {
    const res = await serverApi(`/admin/pages/contacts`)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function ContactsAdminPage() {
  const data = await fetchPage()
  return <ContactsForm initialData={data} />
}
