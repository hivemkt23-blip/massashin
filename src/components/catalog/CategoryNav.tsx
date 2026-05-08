'use client'
import { Category } from '@/types'
import { cn } from '@/lib/utils'
import { useEffect, useRef, useState } from 'react'

interface Props {
  categories: Category[]
  activeSlug: string
  onSelect: (slug: string) => void
}

export default function CategoryNav({ categories, activeSlug, onSelect }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showLeft, setShowLeft] = useState(false)
  const [showRight, setShowRight] = useState(false)

  const checkScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setShowLeft(el.scrollLeft > 8)
    setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8)
  }

  useEffect(() => {
    checkScroll()
    const el = scrollRef.current
    el?.addEventListener('scroll', checkScroll, { passive: true })
    window.addEventListener('resize', checkScroll)
    return () => {
      el?.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [categories])

  return (
    <div className="sticky top-16 z-30 bg-[var(--bg)]/95 backdrop-blur-sm border-b border-[var(--border)]">
      <div className="relative max-w-6xl mx-auto">
        {showLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[var(--bg)] to-transparent pointer-events-none z-10" />
        )}
        {showRight && (
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[var(--bg)] to-transparent pointer-events-none z-10" />
        )}
        <div
          ref={scrollRef}
          className="flex gap-1 overflow-x-auto scrollbar-hide px-4 py-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => onSelect(cat.slug)}
              className={cn(
                'whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex-shrink-0',
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
