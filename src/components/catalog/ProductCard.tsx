'use client'
import { Product } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { Users, Plus } from 'lucide-react'
import Image from 'next/image'

interface Props {
  product: Product
  onClick: (product: Product) => void
}

export default function ProductCard({ product, onClick }: Props) {
  const hasDiscount = product.original_price && product.original_price > product.price

  return (
    <button
      onClick={() => onClick(product)}
      className="group w-full text-left rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden hover:border-[var(--red)]/40 hover:bg-[var(--bg-elevated)] transition-all duration-200 fade-up"
    >
      <div className="flex gap-3 p-3">
        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
          <div>
            <h3 className="font-semibold text-[var(--text)] text-sm leading-snug line-clamp-2 group-hover:text-white transition-colors">
              {product.name}
            </h3>
            {product.description && (
              <p className="text-[var(--text-muted)] text-xs mt-1 line-clamp-2 leading-relaxed">
                {product.description}
              </p>
            )}
          </div>

          <div className="flex items-end justify-between gap-2">
            <div>
              {hasDiscount && (
                <span className="text-[var(--text-muted)] text-xs line-through block">
                  {formatCurrency(product.original_price!)}
                </span>
              )}
              <span className="text-[var(--red)] font-bold text-base">
                {formatCurrency(product.price)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {product.serves > 1 && (
                <span className="flex items-center gap-1 text-[var(--text-muted)] text-xs">
                  <Users size={11} />
                  {product.serves} pessoas
                </span>
              )}
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--red)] text-white group-hover:scale-110 transition-transform">
                <Plus size={14} />
              </span>
            </div>
          </div>
        </div>

        {/* Imagem */}
        {product.image_url && (
          <div className="relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-[var(--bg-elevated)]">
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="96px"
            />
            {hasDiscount && (
              <span className="absolute top-1 left-1 bg-[var(--red)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                PROMO
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  )
}
