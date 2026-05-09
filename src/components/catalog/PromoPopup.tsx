'use client'
import { useState, useEffect } from 'react'
import { X, Tag } from 'lucide-react'
import { Product } from '@/types'
import { formatCurrency } from '@/lib/utils'
import Image from 'next/image'

interface Props {
  products: Product[]
  onSelectProduct: (p: Product) => void
}

export default function PromoPopup({ products, onSelectProduct }: Props) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (products.length === 0) return
    const seen = sessionStorage.getItem('promo_popup_seen')
    if (!seen) setTimeout(() => setShow(true), 800)
  }, [products])

  const close = () => {
    sessionStorage.setItem('promo_popup_seen', '1')
    setShow(false)
  }

  if (!show || products.length === 0) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={close} />
      <div className="relative w-full max-w-md bg-[var(--bg-card)] rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-[var(--red)]">
          <div>
            <p className="text-white font-bold text-base flex items-center gap-2">
              <Tag size={16} /> Promoções especiais
            </p>
            <p className="text-white/80 text-xs mt-0.5">Só por tempo limitado!</p>
          </div>
          <button onClick={close} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
          {products.map(p => (
            <button
              key={p.id}
              onClick={() => { onSelectProduct(p); close() }}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--border)] transition-colors text-left"
            >
              {p.image_url ? (
                <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                  <Image src={p.image_url} alt={p.name} fill className="object-cover" sizes="56px" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-lg bg-[var(--border)] flex items-center justify-center text-2xl flex-shrink-0">🍣</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[var(--text)] text-sm line-clamp-1">{p.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[var(--red)] font-bold text-sm">{formatCurrency(p.price)}</span>
                  {p.original_price && (
                    <span className="text-[var(--text-muted)] text-xs line-through">{formatCurrency(p.original_price)}</span>
                  )}
                </div>
              </div>
              <span className="text-xs text-white bg-[var(--red)] px-2.5 py-1 rounded-full flex-shrink-0 font-medium">Ver</span>
            </button>
          ))}
        </div>

        <div className="px-4 pb-4">
          <button onClick={close} className="w-full py-2.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
            Fechar e continuar navegando
          </button>
        </div>
      </div>
    </div>
  )
}
