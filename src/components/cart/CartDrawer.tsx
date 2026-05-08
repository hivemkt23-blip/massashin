'use client'
import { useCartStore } from '@/store/cart'
import { formatCurrency, cn } from '@/lib/utils'
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import Button from '@/components/ui/Button'

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, subtotal } = useCartStore()
  const sub = subtotal()

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-full sm:w-[420px] bg-[var(--bg-card)] z-50 flex flex-col shadow-2xl transition-transform duration-300',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--border)] flex-shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-[var(--red)]" />
            <h2 className="font-bold text-[var(--text)] text-lg">Meu Pedido</h2>
            {items.length > 0 && (
              <span className="text-xs text-[var(--text-muted)] font-medium">
                ({items.reduce((s, i) => s + i.quantity, 0)} {items.length === 1 ? 'item' : 'itens'})
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-elevated)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Lista de itens */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center">
                <ShoppingBag size={28} className="text-[var(--text-muted)]" />
              </div>
              <div>
                <p className="font-semibold text-[var(--text)]">Seu carrinho está vazio</p>
                <p className="text-sm text-[var(--text-muted)] mt-1">Adicione itens do cardápio para começar</p>
              </div>
              <Button variant="outline" onClick={closeCart} size="sm">
                Ver cardápio
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {items.map((item) => (
                <div key={item.id} className="p-4 flex gap-3">
                  {item.product.image_url && (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-[var(--bg-elevated)]">
                      <Image
                        src={item.product.image_url}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[var(--text)] leading-tight">
                      {item.product.name}
                    </p>

                    {item.selected_options.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {item.selected_options.map((opt, i) => (
                          <p key={i} className="text-xs text-[var(--text-muted)]">
                            · {opt.item_name}
                            {opt.price_add > 0 && ` (+${formatCurrency(opt.price_add)})`}
                          </p>
                        ))}
                      </div>
                    )}

                    {item.item_notes && (
                      <p className="text-xs text-[var(--text-muted)] mt-1 italic">
                        "{item.item_notes}"
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      <span className="font-bold text-[var(--red)] text-sm">
                        {formatCurrency(item.unit_price * item.quantity)}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center rounded border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--red)] hover:border-[var(--red)] transition-colors"
                        >
                          {item.quantity === 1 ? <Trash2 size={12} /> : <Minus size={12} />}
                        </button>
                        <span className="w-6 text-center text-sm font-semibold text-[var(--text)]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center rounded border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--red)] hover:border-[var(--red)] transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="flex-shrink-0 border-t border-[var(--border)] p-4 space-y-3 bg-[var(--bg-card)]">
            <div className="flex justify-between text-sm text-[var(--text-muted)]">
              <span>Subtotal</span>
              <span className="font-medium text-[var(--text)]">{formatCurrency(sub)}</span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Taxa de entrega calculada no checkout
            </p>

            <Link href="/checkout" onClick={closeCart} className="block">
              <Button className="w-full" size="lg">
                Finalizar pedido
                <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
