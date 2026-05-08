'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Button from '@/components/ui/Button'
import { User, LogOut, Package, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default function PerfilPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.replace('/auth'); return }
      setUser(data.user)
      const { data: prof } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()
      setProfile(prof)
      setLoading(false)
    })
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[var(--red)] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-lg mx-auto px-4 py-8">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-20 h-20 rounded-full bg-[var(--red)] flex items-center justify-center text-white text-3xl font-bold">
            {(profile?.full_name ?? user?.email ?? 'U')[0].toUpperCase()}
          </div>
          <div className="text-center">
            <p className="font-bold text-[var(--text)] text-lg">{profile?.full_name ?? 'Usuário'}</p>
            <p className="text-[var(--text-muted)] text-sm">{user?.email}</p>
          </div>
        </div>

        {/* Menu */}
        <div className="space-y-2">
          <Link
            href="/pedidos"
            className="flex items-center justify-between p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl hover:border-[var(--red)]/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Package size={20} className="text-[var(--red)]" />
              <span className="font-medium text-[var(--text)]">Meus pedidos</span>
            </div>
            <ChevronRight size={16} className="text-[var(--text-muted)]" />
          </Link>
        </div>

        <Button
          onClick={handleLogout}
          variant="danger"
          className="w-full mt-6"
        >
          <LogOut size={16} />
          Sair da conta
        </Button>
      </main>
    </div>
  )
}
