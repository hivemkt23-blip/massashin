'use client'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ORDER_STATUS_LABELS, PAYMENT_LABELS } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { Clock, ChevronDown, Search, Printer, MessageCircle } from 'lucide-react'
import { printOrder } from '@/lib/print'

const STATUS_OPTIONS = ['pending', 'confirmed', 'preparing', 'delivering', 'delivered', 'cancelled']
const STATUS_COLORS: Record<string, string> = {
  pending:    'bg-yellow-900/30 text-yellow-400 border-yellow-800',
  confirmed:  'bg-blue-900/30 text-blue-400 border-blue-800',
  preparing:  'bg-orange-900/30 text-orange-400 border-orange-800',
  delivering: 'bg-purple-900/30 text-purple-400 border-purple-800',
  delivered:  'bg-green-900/30 text-green-400 border-green-800',
  cancelled:  'bg-red-900/30 text-red-400 border-red-800',
}

const STATUS_WA_MSG: Record<string, string> = {
  confirmed:  '✅ Olá! Seu pedido foi *confirmado* e já está sendo preparado. Em breve chegará até você! 🍱',
  preparing:  '👨‍🍳 Seu pedido está *em preparo*! Nossa equipe está caprichando no seu pedido.',
  delivering: '🛵 Seu pedido *saiu para entrega*! Em breve chegará até você. Fique de olho!',
  delivered:  '🎉 Seu pedido foi *entregue*! Esperamos que aproveite muito. Obrigado pela preferência! 🙏',
  cancelled:  '❌ Infelizmente seu pedido foi *cancelado*. Entre em contato conosco para mais informações.',
}

// Gera beep via Web Audio API
function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const sequence = [880, 1100, 880]
    let time = ctx.currentTime
    sequence.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.4, time)
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25)
      osc.start(time)
      osc.stop(time + 0.25)
      time += 0.28
    })
  } catch {}
}

export default function PedidosAdmin() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [newOrderAlert, setNewOrderAlert] = useState(false)
  const knownIds = useRef<Set<string>>(new Set())
  const supabase = createClient()

  const load = async () => {
    const { data } = await supabase
      .from('orders')
      .select(`*, addresses(*), order_items(*, order_item_options(*)), user_profiles(full_name, phone)`)
      .order('created_at', { ascending: false })
    setOrders(data ?? [])
    setLoading(false)
    return data ?? []
  }

  // Carrega inicial e guarda IDs conhecidos
  useEffect(() => {
    load().then(data => {
      data.forEach((o: any) => knownIds.current.add(o.id))
    })
  }, [])

  // Realtime: escuta novos pedidos
  useEffect(() => {
    const channel = supabase
      .channel('new-orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        const newOrder = payload.new as any
        if (!knownIds.current.has(newOrder.id)) {
          knownIds.current.add(newOrder.id)
          playBeep()
          setNewOrderAlert(true)
          load() // recarrega lista
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const updateStatus = async (orderId: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', orderId)
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
  }

  const sendWhatsApp = (order: any, status: string) => {
    const phone = order.customer_phone || order.user_profiles?.phone
    if (!phone) {
      alert('Telefone do cliente não cadastrado.')
      return
    }
    const numero = phone.replace(/\D/g, '')
    const msg = STATUS_WA_MSG[status]
    if (!msg) return
    const msgCompleta = `${msg}\n\n*Pedido #${order.order_number}* — ${formatCurrency(order.total)}`
    window.open(`https://wa.me/55${numero}?text=${encodeURIComponent(msgCompleta)}`, '_blank')
  }

  const filtered = orders.filter(o => {
    const matchSearch = search
      ? String(o.order_number).includes(search) ||
        o.addresses?.neighborhood?.toLowerCase().includes(search.toLowerCase())
      : true
    const matchStatus = filterStatus ? o.status === filterStatus : true
    return matchSearch && matchStatus
  })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Pedidos</h1>
          <p className="text-sm text-[var(--text-muted)]">{orders.length} pedidos no total</p>
        </div>
        <button onClick={() => { load(); setNewOrderAlert(false) }} className="text-sm text-[var(--red)] hover:underline">↻ Atualizar</button>
      </div>

      {/* Alerta novo pedido */}
      {newOrderAlert && (
        <div
          className="mb-4 p-3 rounded-xl bg-green-500/20 border border-green-500/40 text-green-400 font-semibold text-sm flex items-center justify-between cursor-pointer animate-pulse"
          onClick={() => setNewOrderAlert(false)}
        >
          <span>🔔 Novo pedido chegou!</span>
          <span className="text-xs opacity-70">clique para dispensar</span>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por #pedido ou bairro..."
            className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg pl-9 pr-3 py-2 text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--red)] transition-colors"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--red)]"
        >
          <option value="">Todos os status</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{(ORDER_STATUS_LABELS as Record<string, string>)[s]}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[var(--red)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-16 text-[var(--text-muted)]">
              <p className="text-4xl mb-2">🍱</p>
              <p>Nenhum pedido encontrado</p>
            </div>
          )}
          {filtered.map(order => (
            <div key={order.id} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
              {/* Header */}
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[var(--bg-elevated)] transition-colors"
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-sm font-bold text-[var(--text)]">#{order.order_number}</span>
                  <div className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                    <Clock size={11} />
                    {new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {order.addresses?.neighborhood && (
                    <span className="text-xs text-[var(--text-muted)]">📍 {order.addresses.neighborhood}</span>
                  )}
                  {order.customer_notes && (
                    <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      ⚠️ Obs
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-bold text-[var(--red)] text-sm">{formatCurrency(order.total)}</span>

                  <button
                    onClick={e => { e.stopPropagation(); printOrder(order) }}
                    title="Imprimir pedido"
                    className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-elevated)] transition-colors flex-shrink-0"
                  >
                    <Printer size={15} />
                  </button>

                  {/* Seletor de status */}
                  <select
                    value={order.status}
                    onChange={e => {
                      e.stopPropagation()
                      const newStatus = e.target.value
                      updateStatus(order.id, newStatus)
                      // Pergunta se quer notificar cliente
                      if (STATUS_WA_MSG[newStatus]) {
                        const phone = order.customer_phone || order.user_profiles?.phone
                        if (phone) {
                          setTimeout(() => {
                            if (confirm(`Notificar cliente via WhatsApp sobre "${(ORDER_STATUS_LABELS as Record<string,string>)[newStatus]}"?`)) {
                              sendWhatsApp({ ...order, status: newStatus }, newStatus)
                            }
                          }, 100)
                        }
                      }
                    }}
                    onClick={e => e.stopPropagation()}
                    className={`text-xs px-2 py-1 rounded-full border font-medium bg-transparent cursor-pointer focus:outline-none ${STATUS_COLORS[order.status]}`}
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s} className="bg-[var(--bg-card)] text-[var(--text)]">
                        {(ORDER_STATUS_LABELS as Record<string, string>)[s]}
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    size={16}
                    className={`text-[var(--text-muted)] transition-transform ${expanded === order.id ? 'rotate-180' : ''}`}
                  />
                </div>
              </div>

              {/* Detalhes expandidos */}
              {expanded === order.id && (
                <div className="border-t border-[var(--border)] px-4 py-4 space-y-4">
                  {/* Itens */}
                  <div>
                    <p className="text-xs font-semibold text-[var(--text-muted)] mb-2 uppercase tracking-wide">Itens do pedido</p>
                    <div className="space-y-1.5">
                      {order.order_items?.map((item: any) => (
                        <div key={item.id}>
                          <div className="flex justify-between text-sm">
                            <span className="text-[var(--text)]">{item.quantity}x {item.product_name}</span>
                            <span className="font-medium text-[var(--text)]">{formatCurrency(item.subtotal)}</span>
                          </div>
                          {item.order_item_options?.map((opt: any, i: number) => (
                            <p key={i} className="text-xs text-[var(--text-muted)] ml-4">↳ {opt.option_item_name}{opt.price_add > 0 ? ` (+${formatCurrency(opt.price_add)})` : ''}</p>
                          ))}
                          {item.item_notes && <p className="text-xs text-[var(--text-muted)] ml-4 italic">"{item.item_notes}"</p>}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {order.addresses && (
                      <div>
                        <p className="text-xs font-semibold text-[var(--text-muted)] mb-1 uppercase tracking-wide">Endereço</p>
                        <p className="text-[var(--text)]">{order.addresses.street}, {order.addresses.number}</p>
                        {order.addresses.complement && <p className="text-[var(--text-muted)] text-xs">{order.addresses.complement}</p>}
                        <p className="text-[var(--text-muted)] text-xs">{order.addresses.neighborhood} — {order.addresses.city}</p>
                        {order.addresses.zip_code && <p className="text-[var(--text-muted)] text-xs">CEP: {order.addresses.zip_code}</p>}
                      </div>
                    )}

                    <div>
                      <p className="text-xs font-semibold text-[var(--text-muted)] mb-1 uppercase tracking-wide">Pagamento</p>
                      <p className="text-[var(--text)]">{(PAYMENT_LABELS as Record<string, string>)[order.payment_method]}</p>
                      <div className="mt-2 space-y-0.5 text-xs text-[var(--text-muted)]">
                        <p>Subtotal: {formatCurrency(order.subtotal)}</p>
                        <p>Entrega: {formatCurrency(order.delivery_fee)}</p>
                        <p className="font-bold text-[var(--red)] text-sm">Total: {formatCurrency(order.total)}</p>
                      </div>
                    </div>
                  </div>

                  {order.customer_notes && (
                    <div className="p-3 rounded-lg border border-amber-500/40 bg-amber-500/10 text-sm flex gap-2">
                      <span className="text-lg leading-none">⚠️</span>
                      <div>
                        <p className="font-bold text-amber-400 text-xs uppercase tracking-wide mb-0.5">Observação do cliente</p>
                        <p className="text-amber-200">{order.customer_notes}</p>
                      </div>
                    </div>
                  )}

                  {/* Botões de ação */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => printOrder(order)}
                      className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg text-sm text-[var(--text)] hover:border-[var(--red)] hover:text-[var(--red)] transition-colors flex-1 justify-center"
                    >
                      <Printer size={15} />
                      Imprimir (80mm)
                    </button>

                    {/* WhatsApp manual */}
                    {STATUS_WA_MSG[order.status] && (
                      <button
                        onClick={() => sendWhatsApp(order, order.status)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-400 hover:bg-green-500/20 transition-colors flex-1 justify-center"
                      >
                        <MessageCircle size={15} />
                        Notificar cliente
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
