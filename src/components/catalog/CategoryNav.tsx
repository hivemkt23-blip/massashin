'use client'
import { Category } from '@/types'
import { cn } from '@/lib/utils'
import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

interface Props {
  categories: Category[]
  activeSlug: string
  onSelect: (slug: string) => void
}

export default function CategoryNav({ categories, activeSlug, onSelect }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const active = categories.find(c => c.slug === activeSlug)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (slug: string) => {
    onSelect(slug)
    setOpen(false)
  }

  return (
    <div className="sticky top-16 z-30 bg-[var(--bg)]/95 backdrop-blur-sm border-b border-[var(--border)]">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-3">
        {/* Dropdown de categorias */}
        <div ref={ref} className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--red)] text-white text-sm font-medium min-w-[200px] justify-between"
          >
            <span className="truncate">{active?.name ?? 'Categorias'}</span>
            <ChevronDown size={15} className={cn('flex-shrink-0 transition-transform duration-200', open && 'rotate-180')} />
          </button>

          {open && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto">
              {categories.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => handleSelect(cat.slug)}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors',
                    activeSlug === cat.slug
                      ? 'bg-[var(--red)]/10 text-[var(--red)] font-medium'
                      : 'text-[var(--text)] hover:bg-[var(--bg-elevated)]'
                  )}
                >
                  <span>{cat.name}</span>
                  {activeSlug === cat.slug && <Check size={14} className="flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Atalhos rápidos (primeiros 4) */}
        <div className="hidden md:flex items-center gap-1 overflow-hidden">
          {categories.slice(0, 5).map((cat) => (
            <button
              key={cat.slug}
              onClick={() => handleSelect(cat.slug)}
              className={cn(
                'whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex-shrink-0',
                activeSlug === cat.slug
                  ? 'bg-[var(--red)] text-white'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-elevated)]'
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
