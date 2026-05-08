'use client'
import { ShoppingBag, User, Clock } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { isRestaurantOpen } from '@/lib/delivery'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  const { totalItems, toggleCart } = useCartStore()
  const count = totalItems()
  const open = isRestaurantOpen()

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur-sm transition-colors">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-full bg-[var(--red)] flex items-center justify-center text-white font-bold text-lg leading-none select-none">
            M
          </div>
          <div>
            <span className="font-bold text-lg text-[var(--text)] tracking-wide">Massashin</span>
            <span className={cn(
              'ml-2 text-xs px-1.5 py-0.5 rounded-full font-medium',
              open ? 'bg-green-900/50 text-green-400' : 'bg-zinc-800 text-zinc-400'
            )}>
              {open ? 'Aberto' : 'Fechado'}
            </span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
          <Clock size={13} />
          <span>Seg–Sex 11h–21h30 · Sáb 21h45 · Dom 21h</span>
        </div>

        <div className="flex items-center gap-1">
          <ThemeToggle />

          <Link
            href="/perfil"
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-elevated)] transition-colors"
            aria-label="Minha conta"
          >
            <User size={20} />
          </Link>

          <button
            onClick={toggleCart}
            className="relative p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-elevated)] transition-colors"
            aria-label="Carrinho"
          >
            <ShoppingBag size={20} />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[var(--red)] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
