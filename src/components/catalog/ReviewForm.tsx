'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ReviewForm({ onSubmitted }: { onSubmitted: () => void }) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (rating === 0) { setError('Selecione uma nota de 1 a 5 estrelas.'); return }
    setSaving(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) { setError('Você precisa estar logado para avaliar.'); setSaving(false); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const { error: err } = await supabase.from('reviews').insert({
      user_id: user.id,
      user_name: profile?.full_name || user.email?.split('@')[0] || 'Cliente',
      rating,
      comment: comment.trim() || null,
      status: 'pending',
    })

    if (err) { setError('Erro ao enviar avaliação. Tente novamente.'); setSaving(false); return }

    setDone(true)
    setSaving(false)
    onSubmitted()
  }

  if (done) {
    return (
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 text-center">
        <p className="text-2xl mb-2">🎉</p>
        <p className="font-semibold text-[var(--text)]">Avaliação enviada!</p>
        <p className="text-sm text-[var(--text-muted)] mt-1">Ela será publicada após aprovação.</p>
      </div>
    )
  }

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
      <h3 className="font-semibold text-[var(--text)] mb-4">Deixe sua avaliação</h3>

      {/* Estrelas */}
      <div className="flex gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            onClick={() => setRating(s)}
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(0)}
            className="transition-transform hover:scale-110"
          >
            <Star
              size={28}
              className={cn(
                'transition-colors',
                (hover || rating) >= s ? 'fill-yellow-400 text-yellow-400' : 'text-[var(--border)]'
              )}
            />
          </button>
        ))}
        {rating > 0 && (
          <span className="ml-2 text-sm text-[var(--text-muted)] self-center">
            {['', 'Péssimo', 'Ruim', 'Regular', 'Bom', 'Excelente'][rating]}
          </span>
        )}
      </div>

      {/* Comentário */}
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Conte como foi sua experiência... (opcional)"
        rows={3}
        className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--red)] transition-colors resize-none mb-3"
      />

      {error && <p className="text-sm text-red-400 mb-3">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={saving}
        className="px-5 py-2 bg-[var(--red)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        {saving ? 'Enviando...' : 'Enviar avaliação'}
      </button>
    </div>
  )
}
