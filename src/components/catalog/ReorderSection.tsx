'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/store/cart'
import { Product } from '@/types'
import { RotateCcw, ShoppingBag } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface LastOrderItem {
  product_id: string
  product_name: string
  product_price: number
  quantity: number
  subtotal: number
}

interface Props {
  products: Product[]
  onSelectProduct: (p: Product) => void
}

export default function ReorderSection({ products, onSelectProduct }: Props) {
  const [items, setItems] = useState<LastOrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const { addItem } = useCartStore()

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: orders } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (!orders?.length) { setLoading(false); return }

      const { data: orderItems } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orders[0].id)

      setItems(orderItems ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const handleReorder = (item: LastOrderItem) => {
    const product = products.find(p => p.id === item.product_id)
    if (product) {
      if (product.option_groups?.length) {
        onSelectProduct(product)
      } else {
        addItem(product, [], '')
      }
    }
  }

  if (loading || items.length === 0) return null

  return (
    <section className="mb-10 scroll-mt-32">
      <h2 className="text-lg font-bold text-[var(--text)] mb-4 pb-2 border-b border-[var(--border)] flex items-center gap-2">
        <span className="w-1 h-5 bg-blue-500 rounded-full" />
        <RotateCcw size={16} className="text-blue-500" />
        Pedir novamente
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item, i) => {
          const product = products.find(p => p.id === item.product_id)
          return (
            <div key={i} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-[var(--text)] text-sm line-clamp-1">{item.product_name}</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{item.quantity}x · {formatCurrency(item.product_price)}</p>
              </div>
              <button
                onClick={() => handleReorder(item)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--red)] text-white text-xs font-medium rounded-lg hover:opacity-90 transition-opacity flex-shrink-0"
              >
                <ShoppingBag size={13} />
                Pedir
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
