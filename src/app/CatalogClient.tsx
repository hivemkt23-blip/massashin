'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Category, Product } from '@/types'
import Header from '@/components/Header'
import CategoryNav from '@/components/catalog/CategoryNav'
import ProductCard from '@/components/catalog/ProductCard'
import ProductModal from '@/components/catalog/ProductModal'
import CartDrawer from '@/components/cart/CartDrawer'
import PromoPopup from '@/components/catalog/PromoPopup'
import ReorderSection from '@/components/catalog/ReorderSection'
import Footer from '@/components/Footer'
import { Search, X, Star } from 'lucide-react'

interface Props {
  categories: Category[]
  products: Product[]
}

const DESTAQUES_SLUG = '__destaques__'
const REORDER_SLUG = '__reorder__'

export default function CatalogClient({ categories, products }: Props) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [activeCategory, setActiveCategory] = useState(categories[0]?.slug ?? '')
  const [search, setSearch] = useState('')
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})
  const scrolling = useRef(false)

  const promoProducts = products.filter(p => p.original_price && p.original_price > p.price)
  const featuredProducts = products.filter(p => (p as any).featured)

  const productsByCategory = categories.reduce<Record<string, Product[]>>((acc, cat) => {
    acc[cat.slug] = products.filter((p) => p.category_id === cat.id)
    return acc
  }, {})

  const filteredCategories = search.trim()
    ? []
    : categories.filter((c) => productsByCategory[c.slug]?.length > 0)

  const searchResults = search.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.description?.toLowerCase().includes(search.toLowerCase())
      )
    : []

  const scrollToCategory = (slug: string) => {
    if (slug === REORDER_SLUG || slug === DESTAQUES_SLUG) {
      scrolling.current = true
      setActiveCategory(slug)
      sectionRefs.current[slug]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setTimeout(() => { scrolling.current = false }, 800)
      return
    }
    scrolling.current = true
    setActiveCategory(slug)
    sectionRefs.current[slug]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setTimeout(() => { scrolling.current = false }, 800)
  }

  const handleScroll = useCallback(() => {
    if (scrolling.current) return
    const scrollY = window.scrollY + 160
    const allSlugs = [DESTAQUES_SLUG, REORDER_SLUG, ...filteredCategories.map(c => c.slug)]
    for (const slug of [...allSlugs].reverse()) {
      const el = sectionRefs.current[slug]
      if (el && el.offsetTop <= scrollY) {
        setActiveCategory(slug)
        break
      }
    }
  }, [filteredCategories])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const virtualCategories = [
    ...(featuredProducts.length > 0 ? [{ id: DESTAQUES_SLUG, name: '⭐ Destaques', slug: DESTAQUES_SLUG, display_order: -2, active: true }] : []),
    ...filteredCategories,
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <PromoPopup products={promoProducts} onSelectProduct={setSelectedProduct} />

      {/* Hero banner */}
      <div className="bg-gradient-to-br from-[#1a0a0a] via-[var(--bg)] to-[var(--bg)] border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text)]">
              🍣 <span style={{ color: 'var(--red)' }}>Massashin</span>
            </h1>
            <p className="text-[var(--text-muted)] mt-1 text-sm">
              Shopping Avenida Center · Dourados, MS · Entrega a partir de R$ 8,00
            </p>
          </div>

          {/* Busca */}
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar no cardápio..."
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl pl-9 pr-9 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--red)] transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Nav de categorias */}
      {!search && (
        <CategoryNav
          categories={virtualCategories as Category[]}
          activeSlug={activeCategory}
          onSelect={scrollToCategory}
        />
      )}

      {/* Conteúdo principal */}
      <main className="max-w-6xl mx-auto px-4 py-6 flex-1 w-full">
        {search.trim() ? (
          <div>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} para &ldquo;{search}&rdquo;
            </p>
            {searchResults.length === 0 ? (
              <div className="text-center py-16 text-[var(--text-muted)]">
                <p className="text-4xl mb-3">🍱</p>
                <p className="font-semibold text-[var(--text)]">Nenhum item encontrado</p>
                <p className="text-sm mt-1">Tente outro termo de busca</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {searchResults.map((p) => (
                  <ProductCard key={p.id} product={p} onClick={setSelectedProduct} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Seção Destaques */}
            {featuredProducts.length > 0 && (
              <section
                ref={(el) => { sectionRefs.current[DESTAQUES_SLUG] = el }}
                className="mb-10 scroll-mt-32"
              >
                <h2 className="text-lg font-bold text-[var(--text)] mb-4 pb-2 border-b border-[var(--border)] flex items-center gap-2">
                  <span className="w-1 h-5 bg-yellow-500 rounded-full" />
                  <Star size={16} className="text-yellow-500" />
                  Destaques
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {featuredProducts.map((p) => (
                    <ProductCard key={p.id} product={p} onClick={setSelectedProduct} />
                  ))}
                </div>
              </section>
            )}

            {/* Seção Pedir Novamente */}
            <div ref={(el) => { sectionRefs.current[REORDER_SLUG] = el }} className="scroll-mt-32">
              <ReorderSection products={products} onSelectProduct={setSelectedProduct} />
            </div>

            {/* Categorias normais */}
            {filteredCategories.map((cat) => {
              const catProducts = productsByCategory[cat.slug] ?? []
              if (!catProducts.length) return null
              return (
                <section
                  key={cat.slug}
                  ref={(el) => { sectionRefs.current[cat.slug] = el }}
                  className="mb-10 scroll-mt-32"
                >
                  <h2 className="text-lg font-bold text-[var(--text)] mb-4 pb-2 border-b border-[var(--border)] flex items-center gap-2">
                    <span className="w-1 h-5 bg-[var(--red)] rounded-full" />
                    {cat.name}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {catProducts.map((p) => (
                      <ProductCard key={p.id} product={p} onClick={setSelectedProduct} />
                    ))}
                  </div>
                </section>
              )
            })}
          </>
        )}
      </main>

      <Footer />

      {/* Modal de produto */}
      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />

      {/* Drawer do carrinho */}
      <CartDrawer />
    </div>
  )
}
