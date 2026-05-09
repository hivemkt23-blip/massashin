'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Review } from '@/types'
import { Star } from 'lucide-react'

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s}
          size={size}
          className={s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-[var(--border)]'}
        />
      ))}
    </div>
  )
}

export default function ReviewsList({ refreshKey }: { refreshKey: number }) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const supabase = createClient()
      const { data } = await supabase
        .from('reviews')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
      setReviews((data as Review[]) ?? [])
      setLoading(false)
    }
    load()
  }, [refreshKey])

  if (loading) return (
    <div className="flex justify-center py-8">
      <div className="w-6 h-6 border-2 border-[var(--red)] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (reviews.length === 0) return (
    <p className="text-sm text-[var(--text-muted)] text-center py-6">Ainda não há avaliações. Seja o primeiro!</p>
  )

  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length

  return (
    <div className="space-y-4">
      {/* Média geral */}
      <div className="flex items-center gap-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
        <div className="text-center">
          <p className="text-3xl font-bold text-[var(--text)]">{avg.toFixed(1)}</p>
          <Stars rating={Math.round(avg)} size={16} />
          <p className="text-xs text-[var(--text-muted)] mt-1">{reviews.length} avaliação{reviews.length !== 1 ? 'ões' : ''}</p>
        </div>
        <div className="flex-1 space-y-1">
          {[5, 4, 3, 2, 1].map(s => {
            const count = reviews.filter(r => r.rating === s).length
            const pct = reviews.length ? (count / reviews.length) * 100 : 0
            return (
              <div key={s} className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-muted)] w-2">{s}</span>
                <Star size={10} className="fill-yellow-400 text-yellow-400 flex-shrink-0" />
                <div className="flex-1 h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-[var(--text-muted)] w-3 text-right">{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Lista */}
      {reviews.map(r => (
        <div key={r.id} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <p className="font-medium text-sm text-[var(--text)]">{r.user_name}</p>
              <Stars rating={r.rating} />
            </div>
            <span className="text-xs text-[var(--text-muted)] flex-shrink-0">
              {new Date(r.created_at).toLocaleDateString('pt-BR')}
            </span>
          </div>
          {r.comment && <p className="text-sm text-[var(--text-muted)] mb-2">{r.comment}</p>}
          {r.admin_reply && (
            <div className="mt-2 pl-3 border-l-2 border-[var(--red)]">
              <p className="text-xs font-semibold text-[var(--red)] mb-0.5">Resposta do restaurante</p>
              <p className="text-sm text-[var(--text-muted)]">{r.admin_reply}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
