import { Suspense } from "react"
import ServicesPageClient from "./ServicesPageClient"

export default function ServicesPage() {
  return (
    <Suspense fallback={<div className="space-y-4">Загрузка...</div>}>
      <ServicesPageClient />
    </Suspense>
  )
}
