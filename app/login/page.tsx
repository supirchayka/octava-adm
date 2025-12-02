"use client"

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"

export default function LoginPage() {
  const sp = useSearchParams()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      })
      if (!r.ok) {
        const j = await r.json().catch(() => ({}))
        throw new Error(j?.message || "Ошибка входа")
      }
      const next = sp.get("next") || "/admin"
      router.replace(next)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Ошибка входа"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-2xl border p-6 shadow-sm bg-white">
        <h1 className="text-2xl font-semibold mb-4">Вход в админку</h1>
        <label className="text-sm">Email</label>
        <input
          className="mt-1 mb-3 w-full rounded-md border px-3 py-2 outline-none focus:ring-2"
          type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="admin@example.com" required
        />
        <label className="text-sm">Пароль</label>
        <input
          className="mt-1 mb-4 w-full rounded-md border px-3 py-2 outline-none focus:ring-2"
          type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="••••••••" required
        />
        {error && <div className="text-red-600 text-sm mb-3">{error}</div>}
        <button
          disabled={loading}
          className="w-full rounded-md bg-black text-white py-2 font-medium disabled:opacity-50"
        >
          {loading ? "Входим..." : "Войти"}
        </button>
      </form>
    </div>
  )
}
