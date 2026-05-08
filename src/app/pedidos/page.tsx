'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Order, ORDER_STATUS_LABELS, PAYMENT_LABELS } from '@/types'
import { formatCurrency } from '@/lib/utils'
import Header from '@/components/Header'
import { Package, ChevronLeft, Clock } from 'lucide-react'
import Link from 'next/link'

const STATUS_COLORS: Record<string, string> = {
  pending:    'bg-yellow-900/30 text-yellow-400 border-yellow-800',
  confirmed:  'bg-blue-900/30 text-blue-400 border-blue-800',
  preparing:  'bg-orange-900/30 text-orange-400 border-orange-800',
  delivering: 'bg-purple-900/30 text-purple-400 border-purple-800',
  delivered:  'bg-green-900/30 text-green-400 border-green-800',
  cancelled:  'bg-red-900/30 text-red-400 border-red-800',
}

export default function PedidosPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.replace('/auth'); return }

      const { data: ordersData } = await supabase
        .from('orders')
        .select(`*, addresses(*), order_items(*, order_item_options(*))`)
        .eq('user_id', data.user.id)
        .order('created_at', { ascending: false })

      setOrders((ordersData as Order[]) ?? [])
      setLoading(false)
    })
  }, [router])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[var(--red)] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <Link href="/perfil" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] mb-6 transition-colors">
          <ChevronLeft size={16} />
          Meu perfil
        </Link>

        <h1 className="text-2xl font-bold text-[var(--text)] mb-6 flex items-center gap-2">
          <Package size={22} className="text-[var(--red)]" />
          Meus Pedidos
        </h1>

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🍱</p>
            <p className="font-semibold text-[var(--text)]">Nenhum pedido ainda</p>
            <p className="text-sm text-[var(--text-muted)] mt-1 mb-6">Seu histórico de pedidos aparecerá aqui.</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--red)] text-white rounded-lg text-sm font-semibold hover:bg-[var(--red-dark)] transition-colors"
            >
              Ver cardápio
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden"
              >
                {/* Header do pedido */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                  <div>
                    <span className="font-bold text-[var(--text)] text-sm">Pedido #{order.order_number}</span>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5 flex items-center gap-1">
                      <Clock size={11} />
                      {new Date(order.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit', month: 'long', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_COLORS[order.status]}`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                </div>

                {/* Itens */}
                <div className="px-4 py-3 space-y-1.5">
                  {order.order_items?.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-[var(--text-muted)]">{item.quantity}x {item.product_name}</span>
                      <span className="text-[var(--text)]">{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-[var(--border)] flex items-center justify-between">
                  <div className="text-xs text-[var(--text-muted)]">
                    {PAYMENT_LABELS[order.payment_method]} · {order.delivery_time_min} min
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[var(--text-muted)]">Total</p>
                    <p className="font-bold text-[var(--red)]">{formatCurrency(order.total)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
