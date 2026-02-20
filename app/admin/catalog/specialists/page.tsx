"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { SpecialistFormDialog, type ServiceOption } from "./specialist-form"

type Specialist = {
  id: number
  firstName: string
  lastName: string
  specialization: string
  experienceYears: number
  serviceIds?: number[]
  services?: Array<{ id?: number | null; name?: string | null; serviceId?: number | null; service?: { id?: number | null; name?: string | null } }>
}

type ServiceApi = {
  id: number
  name: string
  categoryName?: string | null
}

export default function SpecialistsPage() {
  const [specialists, setSpecialists] = useState<Specialist[]>([])
  const [services, setServices] = useState<ServiceOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const servicesById = useMemo(() => new Map(services.map((service) => [service.id, service.label])), [services])

  async function loadSpecialists() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/catalog/specialists`)
      if (!res.ok) throw new Error(await res.text())
      const payload = await res.json()
      setSpecialists(parseList<Specialist>(payload))
    } catch (e: unknown) {
      setSpecialists([])
      const message = e instanceof Error ? e.message : "Не удалось загрузить специалистов"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  async function loadServices() {
    try {
      const res = await fetch(`/api/admin/catalog/services`)
      if (!res.ok) throw new Error(await res.text())
      const payload = await res.json()
      const list = parseList<ServiceApi>(payload)
      setServices(
        list
          .filter((service) => typeof service.id === "number")
          .map((service) => ({
            id: service.id,
            label: service.categoryName ? `${service.categoryName}: ${service.name}` : service.name,
          }))
      )
    } catch {
      setServices([])
    }
  }

  useEffect(() => {
    void loadSpecialists()
    void loadServices()
  }, [])

  async function deleteSpecialist(id: number) {
    const approved = window.confirm("Удалить специалиста?")
    if (!approved) return

    setError(null)
    try {
      const res = await fetch(`/api/admin/catalog/specialists/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error(await res.text())
      await loadSpecialists()
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Не удалось удалить специалиста"
      setError(message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Специалисты</h1>
          <p className="text-sm text-muted-foreground">Управляйте карточками специалистов и их связями с услугами.</p>
        </div>
        <SpecialistFormDialog
          services={services}
          triggerLabel="+ Добавить специалиста"
          onCompleted={() => {
            void loadSpecialists()
          }}
        />
      </div>

      {loading && <div className="text-sm text-muted-foreground">Загрузка...</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {!loading && !specialists.length && <div className="text-sm text-muted-foreground">Нет данных</div>}

      {!!specialists.length && (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr>
                <th className="text-left p-2">ФИО</th>
                <th className="text-left p-2">Специализация</th>
                <th className="text-left p-2">Стаж</th>
                <th className="text-left p-2">Услуги</th>
                <th className="text-left p-2">Действия</th>
              </tr>
            </thead>
            <tbody>
              {specialists.map((specialist) => (
                <tr key={specialist.id} className="border-t align-top">
                  <td className="p-2">{`${specialist.firstName} ${specialist.lastName}`.trim()}</td>
                  <td className="p-2">{specialist.specialization}</td>
                  <td className="p-2">{specialist.experienceYears}</td>
                  <td className="p-2 text-muted-foreground">
                    {buildServicesLabel(specialist, servicesById)}
                  </td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      <SpecialistFormDialog
                        specialistId={specialist.id}
                        services={services}
                        triggerLabel="Редактировать"
                        onCompleted={() => {
                          void loadSpecialists()
                        }}
                      />
                      <Button type="button" variant="ghost" onClick={() => void deleteSpecialist(specialist.id)}>
                        Удалить
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function parseList<T>(payload: unknown, keys: string[] = ["items"]): T[] {
  if (Array.isArray(payload)) return payload as T[]
  if (payload && typeof payload === "object") {
    for (const key of keys) {
      const candidate = (payload as Record<string, unknown>)[key]
      if (Array.isArray(candidate)) return candidate as T[]
    }
  }
  return []
}

function buildServicesLabel(specialist: Specialist, servicesById: Map<number, string>): string {
  const fromIds = (specialist.serviceIds ?? [])
    .map((id) => servicesById.get(id))
    .filter((label): label is string => typeof label === "string")

  if (fromIds.length) return fromIds.join(", ")

  const fromRelations = (specialist.services ?? [])
    .map((service) => {
      if (typeof service?.name === "string" && service.name.trim() !== "") return service.name
      if (typeof service?.service?.name === "string" && service.service.name.trim() !== "") return service.service.name
      if (typeof service?.id === "number") return servicesById.get(service.id)
      if (typeof service?.serviceId === "number") return servicesById.get(service.serviceId)
      if (typeof service?.service?.id === "number") return servicesById.get(service.service.id)
      return null
    })
    .filter((label): label is string => typeof label === "string" && label.trim() !== "")

  if (fromRelations.length) return fromRelations.join(", ")
  return "—"
}
