'use client'
import { useState } from 'react'
import Image from 'next/image'
import { Lock, Eye, EyeOff } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function AdminLoginPage() {
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      window.location.href = '/admin'
    } else {
      setError('Senha incorreta.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-3">
            <Image src="/logo.png" alt="Massashin" width={80} height={80} className="object-cover w-full h-full" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Painel Admin</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">Massashin — Área Restrita</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Senha de acesso"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl pl-9 pr-10 py-3 text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--red)] transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)]"
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && (
            <p className="text-red-400 text-sm p-3 bg-red-900/20 rounded-lg border border-red-900">{error}</p>
          )}

          <Button type="submit" loading={loading} className="w-full" size="lg">
            Entrar no painel
          </Button>
        </form>
      </div>
    </div>
  )
}
