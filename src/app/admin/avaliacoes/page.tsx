'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Review, ReviewStatus } from '@/types'
import { Star, Check, X, MessageSquare, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: 'Pendente',
  approved: 'Aprovada',
  rejected: 'Rejeitada',
}

const STATUS_COLORS: Record<ReviewStatus, string> = {
  pending: 'bg-yellow-900/30 text-yellow-400',
  approved: 'bg-green-900/30 text-green-400',
  rejected: 'bg-zinc-800 text-zinc-400',
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} size={13} className={s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-600'} />
      ))}
    </div>
  )
}

export default function AvaliacoesAdmin() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<ReviewStatus | 'all'>('all')
  const [replyModal, setReplyModal] = useState<Review | null>(null)
  const [replyText, setReplyText] = useState('')
  const [saving, setSaving] = useState(false)

  const supabase = createClient()

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false })
    setReviews((data as Review[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const updateStatus = async (id: string, status: ReviewStatus) => {
    await supabase.from('reviews').update({ status }).eq('id', id)
    setReviews(prev => prev.map(r => r.id === id ? { ...r, status } : r))
  }

  const openReply = (r: Review) => {
    setReplyText(r.admin_reply ?? '')
    setReplyModal(r)
  }

  const saveReply = async () => {
    if (!replyModal) return
    setSaving(true)
    await supabase.from('reviews').update({ admin_reply: replyText.trim() || null }).eq('id', replyModal.id)
    setReviews(prev => prev.map(r => r.id === replyModal.id ? { ...r, admin_reply: replyText.trim() || null } : r))
    setReplyModal(null)
    setSaving(false)
  }

  const filtered = filter === 'all' ? reviews : reviews.filter(r => r.status === filter)

  const counts = {
    all: reviews.length,
    pending: reviews.filter(r => r.status === 'pending').length,
    approved: reviews.filter(r => r.status === 'approved').length,
    rejected: reviews.filter(r => r.status === 'rejected').length,
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Avaliações</h1>
          <p className="text-sm text-[var(--text-muted)]">{reviews.length} avaliações recebidas</p>
        </div>
        <button onClick={load} className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-elevated)] transition-colors">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
              filter === s
                ? 'bg-[var(--red)] text-white'
                : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text)]'
            )}
          >
            {s === 'all' ? 'Todas' : STATUS_LABELS[s]} ({counts[s]})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[var(--red)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-[var(--text-muted)] text-sm">Nenhuma avaliação encontrada</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <div key={r.id} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-medium text-sm text-[var(--text)]">{r.user_name}</p>
                    <Stars rating={r.rating} />
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_COLORS[r.status])}>
                      {STATUS_LABELS[r.status]}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {new Date(r.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  {r.comment && <p className="text-sm text-[var(--text-muted)] mb-2">{r.comment}</p>}
                  {r.admin_reply && (
                    <div className="mt-2 pl-3 border-l-2 border-[var(--red)]">
                      <p className="text-xs font-semibold text-[var(--red)] mb-0.5">Sua resposta</p>
                      <p className="text-sm text-[var(--text-muted)]">{r.admin_reply}</p>
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {r.status !== 'approved' && (
                    <button
                      onClick={() => updateStatus(r.id, 'approved')}
                      title="Aprovar"
                      className="p-1.5 rounded-lg text-green-400 hover:bg-green-900/20 transition-colors"
                    >
                      <Check size={15} />
                    </button>
                  )}
                  {r.status !== 'rejected' && (
                    <button
                      onClick={() => updateStatus(r.id, 'rejected')}
                      title="Rejeitar"
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-900/20 transition-colors"
                    >
                      <X size={15} />
                    </button>
                  )}
                  <button
                    onClick={() => openReply(r)}
                    title="Responder"
                    className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-elevated)] transition-colors"
                  >
                    <MessageSquare size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de resposta */}
      {replyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setReplyModal(null)} />
          <div className="relative w-full max-w-md bg-[var(--bg-card)] rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <h2 className="font-bold text-[var(--text)]">Responder avaliação</h2>
              <button onClick={() => setReplyModal(null)} className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text)]">
                <X size={18} />
              </button>
            </div>
            <div className="px-5 py-4">
              <div className="bg-[var(--bg-elevated)] rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-[var(--text)]">{replyModal.user_name}</p>
                  <Stars rating={replyModal.rating} />
                </div>
                {replyModal.comment && <p className="text-sm text-[var(--text-muted)]">{replyModal.comment}</p>}
              </div>
              <label className="text-xs text-[var(--text-muted)] mb-1.5 block">Sua resposta</label>
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                rows={4}
                placeholder="Escreva uma resposta pública para esta avaliação..."
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--red)] transition-colors resize-none"
              />
            </div>
            <div className="flex gap-3 px-5 py-4 border-t border-[var(--border)]">
              <button
                onClick={() => setReplyModal(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveReply}
                disabled={saving}
                className="flex-1 px-4 py-2 rounded-lg bg-[var(--red)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {saving ? 'Salvando...' : 'Salvar resposta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
