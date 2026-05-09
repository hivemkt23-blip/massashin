'use client'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { PAYMENT_LABELS } from '@/types'
import { Printer, MessageCircle, Calendar, TrendingUp, ShoppingBag, DollarSign, ChevronDown } from 'lucide-react'
import { printCashReport } from '@/lib/print'

const PAYMENT_METHODS = ['pix', 'credit_card', 'debit_card', 'cash'] as const

function StatCard({ icon: Icon, label, value, sub, accent = false }: any) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? 'bg-[var(--red)]/10 border-[var(--red)]/30' : 'bg-[var(--bg-card)] border-[var(--border)]'}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-[var(--text-muted)]">{label}</p>
          <p className={`text-xl font-bold mt-0.5 ${accent ? 'text-[var(--red)]' : 'text-[var(--text)]'}`}>{value}</p>
          {sub && <p className="text-xs text-[var(--text-muted)] mt-0.5">{sub}</p>}
        </div>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${accent ? 'bg-[var(--red)]/20' : 'bg-[var(--bg-elevated)]'}`}>
          <Icon size={18} className={accent ? 'text-[var(--red)]' : 'text-[var(--text-muted)]'} />
        </div>
      </div>
    </div>
  )
}

export default function FluxoCaixaPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))
  const [tab, setTab] = useState<'day' | 'month' | 'year'>('day')
  const [closing, setClosing] = useState(false)
  const [closeMsg, setCloseMsg] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      // Busca pedidos entregues (delivered) do ano atual para cobrir dia/mês/ano
      const year = selectedDate.slice(0, 4)
      const { data } = await supabase
        .from('orders')
        .select('id, order_number, total, subtotal, delivery_fee, payment_method, status, created_at')
        .gte('created_at', `${year}-01-01T00:00:00`)
        .lte('created_at', `${year}-12-31T23:59:59`)
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false })
      setOrders(data ?? [])
      setLoading(false)
    }
    load()
  }, [selectedDate])

  // Filtros por período
  const dayOrders = useMemo(() =>
    orders.filter(o => o.created_at?.slice(0, 10) === selectedDate), [orders, selectedDate])

  const monthOrders = useMemo(() => {
    const ym = selectedDate.slice(0, 7)
    return orders.filter(o => o.created_at?.slice(0, 7) === ym)
  }, [orders, selectedDate])

  const yearOrders = useMemo(() => orders, [orders])

  const current = tab === 'day' ? dayOrders : tab === 'month' ? monthOrders : yearOrders

  // Agrupamento por forma de pagamento
  const byPayment = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {}
    for (const o of current) {
      if (!map[o.payment_method]) map[o.payment_method] = { total: 0, count: 0 }
      map[o.payment_method].total += o.total ?? 0
      map[o.payment_method].count += 1
    }
    return map
  }, [current])

  const totalVendas = current.reduce((s, o) => s + (o.total ?? 0), 0)
  const totalPedidos = current.length
  const ticketMedio = totalPedidos > 0 ? totalVendas / totalPedidos : 0
  const totalEntrega = current.reduce((s, o) => s + (o.delivery_fee ?? 0), 0)
  const totalProdutos = current.reduce((s, o) => s + (o.subtotal ?? 0), 0)

  const tabLabel = tab === 'day'
    ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : tab === 'month'
      ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      : selectedDate.slice(0, 4)

  // Fechar caixa — envia WhatsApp para telefones cadastrados
  const handleFecharCaixa = async () => {
    if (tab !== 'day') return
    setClosing(true)

    const { data: settings } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'notification_phones')
      .single()

    const phones: string[] = settings?.value ? JSON.parse(settings.value) : []

    const payLines = PAYMENT_METHODS
      .filter(m => byPayment[m])
      .map(m => `• ${(PAYMENT_LABELS as Record<string, string>)[m]}: ${formatCurrency(byPayment[m]?.total ?? 0)} (${byPayment[m]?.count} ped.)`)
      .join('\n')

    const msg = encodeURIComponent(
      `🍣 *FECHAMENTO DE CAIXA — MASSASHIN*\n` +
      `📅 ${tabLabel}\n\n` +
      `🛒 Pedidos: ${totalPedidos}\n` +
      `💰 Total vendido: *${formatCurrency(totalVendas)}*\n` +
      `🎫 Ticket médio: ${formatCurrency(ticketMedio)}\n\n` +
      `*Formas de pagamento:*\n${payLines}\n\n` +
      `🚚 Taxa de entrega: ${formatCurrency(totalEntrega)}\n` +
      `📦 Produtos: ${formatCurrency(totalProdutos)}\n\n` +
      `_Relatório gerado automaticamente pelo sistema Massashin_`
    )

    if (phones.length === 0) {
      setCloseMsg('⚠️ Nenhum telefone cadastrado para notificação. Cadastre em Configurações.')
    } else {
      phones.forEach((phone, i) => {
        const clean = phone.replace(/\D/g, '')
        setTimeout(() => {
          window.open(`https://wa.me/55${clean}?text=${msg}`, '_blank')
        }, i * 600)
      })
      setCloseMsg(`✅ WhatsApp aberto para ${phones.length} contato(s). Confirme o envio no WhatsApp.`)
    }
    setClosing(false)
  }

  const handlePrint = () => printCashReport({ tab, tabLabel, current, byPayment, totalVendas, totalPedidos, ticketMedio, totalEntrega, totalProdutos })

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Fluxo de Caixa</h1>
          <p className="text-sm text-[var(--text-muted)]">Controle financeiro por período</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--red)]"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[var(--bg-elevated)] rounded-xl p-1 w-fit">
        {(['day', 'month', 'year'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t ? 'bg-[var(--red)] text-white shadow' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            {t === 'day' ? '📅 Dia' : t === 'month' ? '📆 Mês' : '📊 Ano'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-[var(--red)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <p className="text-xs text-[var(--text-muted)] mb-4 uppercase tracking-wide font-semibold">{tabLabel}</p>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <StatCard icon={DollarSign} label="Total vendido" value={formatCurrency(totalVendas)} accent />
            <StatCard icon={ShoppingBag} label="Pedidos" value={totalPedidos} sub={`ticket médio ${formatCurrency(ticketMedio)}`} />
            <StatCard icon={TrendingUp} label="Em produtos" value={formatCurrency(totalProdutos)} />
            <StatCard icon={Calendar} label="Em entregas" value={formatCurrency(totalEntrega)} />
          </div>

          {/* Formas de pagamento */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden mb-6">
            <div className="px-5 py-3 border-b border-[var(--border)]">
              <h2 className="font-semibold text-[var(--text)]">Formas de pagamento</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-elevated)]">
                <tr>
                  {['Forma', 'Pedidos', 'Total', '% do dia'].map(h => (
                    <th key={h} className="text-left px-5 py-2.5 text-xs font-semibold text-[var(--text-muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {PAYMENT_METHODS.map(m => {
                  const data = byPayment[m]
                  if (!data) return null
                  const pct = totalVendas > 0 ? (data.total / totalVendas) * 100 : 0
                  return (
                    <tr key={m} className="hover:bg-[var(--bg-elevated)] transition-colors">
                      <td className="px-5 py-3 font-medium text-[var(--text)]">
                        {m === 'pix' ? '💳' : m === 'credit_card' ? '💳' : m === 'debit_card' ? '💳' : '💵'}{' '}
                        {(PAYMENT_LABELS as Record<string, string>)[m]}
                      </td>
                      <td className="px-5 py-3 text-[var(--text-muted)]">{data.count}</td>
                      <td className="px-5 py-3 font-bold text-[var(--text)]">{formatCurrency(data.total)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden max-w-24">
                            <div className="h-full bg-[var(--red)] rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-[var(--text-muted)]">{pct.toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {Object.keys(byPayment).length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-[var(--text-muted)]">Nenhuma venda neste período</td></tr>
                )}
              </tbody>
              {Object.keys(byPayment).length > 0 && (
                <tfoot className="bg-[var(--bg-elevated)]">
                  <tr>
                    <td className="px-5 py-3 font-bold text-[var(--text)]">TOTAL</td>
                    <td className="px-5 py-3 font-bold text-[var(--text)]">{totalPedidos}</td>
                    <td className="px-5 py-3 font-bold text-[var(--red)] text-base">{formatCurrency(totalVendas)}</td>
                    <td className="px-5 py-3 text-xs text-[var(--text-muted)]">100%</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Últimos pedidos do período */}
          {current.length > 0 && (
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden mb-6">
              <div className="px-5 py-3 border-b border-[var(--border)]">
                <h2 className="font-semibold text-[var(--text)]">Pedidos do período</h2>
              </div>
              <div className="overflow-x-auto max-h-72 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--bg-elevated)] sticky top-0">
                    <tr>
                      {['#', 'Horário', 'Pagamento', 'Total'].map(h => (
                        <th key={h} className="text-left px-4 py-2 text-xs font-semibold text-[var(--text-muted)]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {current.map(o => (
                      <tr key={o.id} className="hover:bg-[var(--bg-elevated)] transition-colors">
                        <td className="px-4 py-2 font-mono text-xs text-[var(--text-muted)]">#{o.order_number}</td>
                        <td className="px-4 py-2 text-xs text-[var(--text-muted)]">
                          {new Date(o.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-2 text-xs text-[var(--text-muted)]">
                          {(PAYMENT_LABELS as Record<string, string>)[o.payment_method] ?? o.payment_method}
                        </td>
                        <td className="px-4 py-2 font-bold text-[var(--red)]">{formatCurrency(o.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex flex-wrap gap-3 items-center">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-sm font-medium text-[var(--text)] hover:border-[var(--red)] hover:text-[var(--red)] transition-colors"
            >
              <Printer size={16} />
              Imprimir relatório
            </button>

            {tab === 'day' && (
              <button
                onClick={handleFecharCaixa}
                disabled={closing || totalPedidos === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-700 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                <MessageCircle size={16} />
                {closing ? 'Enviando...' : 'Fechar caixa + enviar WhatsApp'}
              </button>
            )}

            {closeMsg && (
              <p className="text-sm text-[var(--text-muted)] w-full mt-1">{closeMsg}</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
