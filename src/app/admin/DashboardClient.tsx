'use client'
import { useMemo, useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { ORDER_STATUS_LABELS, PAYMENT_LABELS, Review, ReviewStatus } from '@/types'
import { createClient } from '@/lib/supabase/client'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { ShoppingBag, TrendingUp, Users, MessageSquare, Package, Award, AlertTriangle, Star, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const COLORS = ['#c8102e', '#e85d04', '#f48c06', '#dc2f02', '#9d0208', '#6a040f']

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

function ReviewStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} size={12} className={s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-600'} />
      ))}
    </div>
  )
}

interface Props {
  orders: any[]
  orderItems: any[]
  reviews: Review[]
}

function StatCard({ icon: Icon, label, value, sub, color = 'red' }: any) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--text-muted)]">{label}</p>
          <p className="text-2xl font-bold text-[var(--text)] mt-1">{value}</p>
          {sub && <p className="text-xs text-[var(--text-muted)] mt-0.5">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-[var(--red)]/10`}>
          <Icon size={20} className="text-[var(--red)]" />
        </div>
      </div>
    </div>
  )
}

export default function DashboardClient({ orders, orderItems, reviews: initialReviews }: Props) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews)
  const [reviewFilter, setReviewFilter] = useState<ReviewStatus | 'all'>('all')
  const [replyModal, setReplyModal] = useState<Review | null>(null)
  const [replyText, setReplyText] = useState('')
  const [savingReply, setSavingReply] = useState(false)
  const supabase = createClient()

  const updateStatus = async (id: string, status: ReviewStatus) => {
    await supabase.from('reviews').update({ status }).eq('id', id)
    setReviews(prev => prev.map(r => r.id === id ? { ...r, status } : r))
  }

  const openReply = (r: Review) => { setReplyText(r.admin_reply ?? ''); setReplyModal(r) }

  const saveReply = async () => {
    if (!replyModal) return
    setSavingReply(true)
    await supabase.from('reviews').update({ admin_reply: replyText.trim() || null }).eq('id', replyModal.id)
    setReviews(prev => prev.map(r => r.id === replyModal.id ? { ...r, admin_reply: replyText.trim() || null } : r))
    setReplyModal(null)
    setSavingReply(false)
  }

  const filteredReviews = reviewFilter === 'all' ? reviews : reviews.filter(r => r.status === reviewFilter)
  const pendingCount = reviews.filter(r => r.status === 'pending').length
  const avgRating = reviews.filter(r => r.status === 'approved').length
    ? (reviews.filter(r => r.status === 'approved').reduce((s, r) => s + r.rating, 0) / reviews.filter(r => r.status === 'approved').length)
    : 0
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const weekAgo = new Date(now.getTime() - 7 * 86400000)
  const monthAgo = new Date(now.getTime() - 30 * 86400000)

  const todayOrders = orders.filter(o => o.created_at?.slice(0, 10) === todayStr)
  const weekOrders = orders.filter(o => new Date(o.created_at) >= weekAgo)
  const monthOrders = orders.filter(o => new Date(o.created_at) >= monthAgo)

  const totalRevenue = orders.reduce((s: number, o: any) => s + (o.total ?? 0), 0)
  const monthRevenue = monthOrders.reduce((s: number, o: any) => s + (o.total ?? 0), 0)
  const whatsappSent = orders.filter((o: any) => o.whatsapp_sent).length

  // Itens mais e menos vendidos
  const itemSales = useMemo(() => {
    const map: Record<string, { name: string; qty: number; revenue: number }> = {}
    for (const item of orderItems) {
      if (!map[item.product_name]) map[item.product_name] = { name: item.product_name, qty: 0, revenue: 0 }
      map[item.product_name].qty += item.quantity ?? 0
      map[item.product_name].revenue += item.subtotal ?? 0
    }
    return Object.values(map).sort((a, b) => b.qty - a.qty)
  }, [orderItems])

  const top10 = itemSales.slice(0, 10)
  const bottom5 = [...itemSales].sort((a, b) => a.qty - b.qty).slice(0, 5)

  // Pedidos por status
  const byStatus = useMemo(() => {
    const map: Record<string, number> = {}
    for (const o of orders) {
      map[o.status] = (map[o.status] ?? 0) + 1
    }
    return Object.entries(map).map(([status, count]) => ({
      name: (ORDER_STATUS_LABELS as Record<string, string>)[status] ?? status,
      value: count,
    }))
  }, [orders])

  // Pedidos por forma de pagamento
  const byPayment = useMemo(() => {
    const map: Record<string, number> = {}
    for (const o of orders) {
      const label = (PAYMENT_LABELS as Record<string, string>)[o.payment_method] ?? o.payment_method
      map[label] = (map[label] ?? 0) + 1
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [orders])

  // Regiões mais atendidas
  const byRegion = useMemo(() => {
    const map: Record<string, number> = {}
    for (const o of orders) {
      const neighborhood = o.addresses?.neighborhood ?? 'Não informado'
      map[neighborhood] = (map[neighborhood] ?? 0) + 1
    }
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [orders])

  // Pedidos por dia (últimos 7 dias)
  const last7days = useMemo(() => {
    const days: { date: string; label: string; pedidos: number; receita: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000)
      const ds = d.toISOString().slice(0, 10)
      const dayOrders = orders.filter(o => o.created_at?.slice(0, 10) === ds)
      days.push({
        date: ds,
        label: d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
        pedidos: dayOrders.length,
        receita: dayOrders.reduce((s, o) => s + (o.total ?? 0), 0),
      })
    }
    return days
  }, [orders])

  const customTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3 text-xs shadow-xl">
        <p className="font-bold text-[var(--text)] mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' && p.name?.includes('R$') ? formatCurrency(p.value) : p.value}</p>
        ))}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Dashboard</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">Visão geral do restaurante</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ShoppingBag} label="Pedidos hoje" value={todayOrders.length} sub={`${weekOrders.length} na semana`} />
        <StatCard icon={TrendingUp} label="Receita total" value={formatCurrency(totalRevenue)} sub={`${formatCurrency(monthRevenue)} este mês`} />
        <StatCard icon={MessageSquare} label="Avaliações pendentes" value={pendingCount} sub={`${reviews.length} no total · ⭐ ${avgRating.toFixed(1)} média`} />
        <StatCard icon={Package} label="Itens cadastrados" value={itemSales.length} sub="produtos distintos vendidos" />
      </div>

      {/* Gráfico de pedidos por dia */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
        <h2 className="font-bold text-[var(--text)] mb-4">Pedidos — últimos 7 dias</h2>
        {last7days.some(d => d.pedidos > 0) ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={last7days}>
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={customTooltip} />
              <Bar dataKey="pedidos" name="Pedidos" fill="var(--red)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState text="Nenhum pedido nos últimos 7 dias" />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Itens mais vendidos */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
          <h2 className="font-bold text-[var(--text)] mb-1 flex items-center gap-2">
            <Award size={16} className="text-[var(--red)]" /> Top 10 mais vendidos
          </h2>
          {top10.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={top10} layout="vertical" margin={{ left: 8 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} width={120} axisLine={false} tickLine={false} />
                <Tooltip content={customTooltip} />
                <Bar dataKey="qty" name="Qtd vendida" fill="var(--red)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState text="Nenhuma venda registrada ainda" />}
        </div>

        {/* Itens menos vendidos */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
          <h2 className="font-bold text-[var(--text)] mb-1 flex items-center gap-2">
            <AlertTriangle size={16} className="text-yellow-500" /> 5 menos vendidos
          </h2>
          {bottom5.length > 0 ? (
            <div className="mt-3 space-y-2">
              {bottom5.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                  <span className="text-sm text-[var(--text)] truncate flex-1">{item.name}</span>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-[var(--text-muted)]">{formatCurrency(item.revenue)}</span>
                    <span className="text-sm font-bold text-yellow-500">{item.qty}x</span>
                  </div>
                </div>
              ))}
            </div>
          ) : <EmptyState text="Nenhuma venda registrada ainda" />}
        </div>

        {/* Regiões */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
          <h2 className="font-bold text-[var(--text)] mb-4 flex items-center gap-2">
            <Users size={16} className="text-[var(--red)]" /> Pedidos por bairro
          </h2>
          {byRegion.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byRegion} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} width={110} axisLine={false} tickLine={false} />
                <Tooltip content={customTooltip} />
                <Bar dataKey="value" name="Pedidos" fill="#e85d04" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState text="Nenhum pedido com endereço salvo" />}
        </div>

        {/* Status dos pedidos */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
          <h2 className="font-bold text-[var(--text)] mb-4">Status dos pedidos</h2>
          {byStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                  {byStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={customTooltip} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyState text="Nenhum pedido ainda" />}
        </div>
      </div>

      {/* Avaliações */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="font-bold text-[var(--text)] flex items-center gap-2">
            <Star size={16} className="text-yellow-400" /> Avaliações dos clientes
          </h2>
          <div className="flex gap-1.5 flex-wrap">
            {(['all', 'pending', 'approved', 'rejected'] as const).map(s => (
              <button
                key={s}
                onClick={() => setReviewFilter(s)}
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium transition-all',
                  reviewFilter === s ? 'bg-[var(--red)] text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text)]'
                )}
              >
                {s === 'all' ? `Todas (${reviews.length})` : `${STATUS_LABELS[s]} (${reviews.filter(r => r.status === s).length})`}
              </button>
            ))}
          </div>
        </div>

        {filteredReviews.length === 0 ? (
          <EmptyState text="Nenhuma avaliação encontrada" />
        ) : (
          <div className="space-y-3">
            {filteredReviews.map(r => (
              <div key={r.id} className="bg-[var(--bg-elevated)] rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium text-sm text-[var(--text)]">{r.user_name}</span>
                      <ReviewStars rating={r.rating} />
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_COLORS[r.status])}>
                        {STATUS_LABELS[r.status]}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {new Date(r.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    {r.comment && <p className="text-sm text-[var(--text-muted)]">{r.comment}</p>}
                    {r.admin_reply && (
                      <div className="mt-2 pl-3 border-l-2 border-[var(--red)]">
                        <p className="text-xs font-semibold text-[var(--red)] mb-0.5">Sua resposta</p>
                        <p className="text-sm text-[var(--text-muted)]">{r.admin_reply}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {r.status !== 'approved' && (
                      <button onClick={() => updateStatus(r.id, 'approved')} title="Aprovar"
                        className="p-1.5 rounded-lg text-green-400 hover:bg-green-900/20 transition-colors">
                        <Check size={14} />
                      </button>
                    )}
                    {r.status !== 'rejected' && (
                      <button onClick={() => updateStatus(r.id, 'rejected')} title="Rejeitar"
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-900/20 transition-colors">
                        <X size={14} />
                      </button>
                    )}
                    <button onClick={() => openReply(r)} title="Responder"
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-card)] transition-colors">
                      <MessageSquare size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de resposta */}
      {replyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setReplyModal(null)} />
          <div className="relative w-full max-w-md bg-[var(--bg-card)] rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <h2 className="font-bold text-[var(--text)]">Responder avaliação</h2>
              <button onClick={() => setReplyModal(null)} className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text)]"><X size={18} /></button>
            </div>
            <div className="px-5 py-4">
              <div className="bg-[var(--bg-elevated)] rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-[var(--text)]">{replyModal.user_name}</span>
                  <ReviewStars rating={replyModal.rating} />
                </div>
                {replyModal.comment && <p className="text-sm text-[var(--text-muted)]">{replyModal.comment}</p>}
              </div>
              <label className="text-xs text-[var(--text-muted)] mb-1.5 block">Sua resposta pública</label>
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                rows={4}
                placeholder="Escreva uma resposta que ficará visível no site..."
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--red)] transition-colors resize-none"
              />
            </div>
            <div className="flex gap-3 px-5 py-4 border-t border-[var(--border)]">
              <button onClick={() => setReplyModal(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
                Cancelar
              </button>
              <button onClick={saveReply} disabled={savingReply}
                className="flex-1 px-4 py-2 rounded-lg bg-[var(--red)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60">
                {savingReply ? 'Salvando...' : 'Salvar resposta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Últimos pedidos */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
        <h2 className="font-bold text-[var(--text)] mb-4">Últimos 10 pedidos</h2>
        {orders.length === 0 ? (
          <EmptyState text="Nenhum pedido ainda" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {['#', 'Data', 'Total', 'Pagamento', 'Status', 'WhatsApp'].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-[var(--text-muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {orders.slice(0, 10).map((o: any) => (
                  <tr key={o.id} className="hover:bg-[var(--bg-elevated)] transition-colors">
                    <td className="py-2.5 px-3 font-mono text-xs text-[var(--text-muted)]">#{o.order_number}</td>
                    <td className="py-2.5 px-3 text-[var(--text-muted)] text-xs">
                      {new Date(o.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-[var(--red)]">{formatCurrency(o.total)}</td>
                    <td className="py-2.5 px-3 text-xs text-[var(--text-muted)]">{(PAYMENT_LABELS as Record<string, string>)[o.payment_method] ?? o.payment_method}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] text-[var(--text)]">
                        {(ORDER_STATUS_LABELS as Record<string, string>)[o.status] ?? o.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-xs font-medium ${o.whatsapp_sent ? 'text-green-400' : 'text-[var(--text-muted)]'}`}>
                        {o.whatsapp_sent ? '✓ Enviado' : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <p className="text-3xl mb-2">🍣</p>
      <p className="text-sm text-[var(--text-muted)]">{text}</p>
    </div>
  )
}
