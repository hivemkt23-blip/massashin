'use client'
import { useState, useEffect } from 'react'
import { Product, OptionGroup, CartItemOption } from '@/types'
import { formatCurrency, cn } from '@/lib/utils'
import { useCartStore } from '@/store/cart'
import { X, Minus, Plus, Users, ChevronDown } from 'lucide-react'
import Image from 'next/image'
import Button from '@/components/ui/Button'

interface Props {
  product: Product | null
  onClose: () => void
}

export default function ProductModal({ product, onClose }: Props) {
  const { addItem } = useCartStore()
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (product) {
      setQuantity(1)
      setNotes('')
      setSelectedOptions({})
      setErrors({})
    }
  }, [product])

  useEffect(() => {
    if (product) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [product])

  if (!product) return null

  const groups: OptionGroup[] = product.option_groups ?? []

  const toggleOption = (group: OptionGroup, itemId: string) => {
    setSelectedOptions((prev) => {
      const current = prev[group.id] ?? []
      if (group.max_selections === 1) {
        return { ...prev, [group.id]: [itemId] }
      }
      if (current.includes(itemId)) {
        return { ...prev, [group.id]: current.filter((id) => id !== itemId) }
      }
      if (current.length >= group.max_selections) return prev
      return { ...prev, [group.id]: [...current, itemId] }
    })
    setErrors((prev) => ({ ...prev, [group.id]: '' }))
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    for (const group of groups) {
      if (group.required) {
        const selected = selectedOptions[group.id] ?? []
        if (selected.length < group.min_selections) {
          newErrors[group.id] = `Escolha pelo menos ${group.min_selections} opção`
        }
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const optionsTotal = groups.reduce((sum, group) => {
    const selected = selectedOptions[group.id] ?? []
    return sum + group.option_items
      .filter((item) => selected.includes(item.id))
      .reduce((s, item) => s + item.price_add, 0)
  }, 0)

  const unitPrice = product.price + optionsTotal
  const total = unitPrice * quantity

  const handleAdd = () => {
    if (!validate()) return

    const cartOptions: CartItemOption[] = groups.flatMap((group) => {
      const selected = selectedOptions[group.id] ?? []
      return group.option_items
        .filter((item) => selected.includes(item.id))
        .map((item) => ({
          group_id: group.id,
          group_name: group.name,
          item_id: item.id,
          item_name: item.name,
          price_add: item.price_add,
        }))
    })

    for (let i = 0; i < quantity; i++) {
      addItem(product, cartOptions, notes)
    }
    // addItem already opens cart; reset quantity to avoid double-adding
    if (quantity > 1) {
      // We added in a loop so quantity is handled
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-lg bg-[var(--bg-card)] rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header imagem */}
        {product.image_url ? (
          <div className="relative h-52 sm:h-64 flex-shrink-0">
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 512px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] to-transparent" />
          </div>
        ) : (
          <div className="h-16 flex-shrink-0" />
        )}

        {/* Botão fechar */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
        >
          <X size={16} />
        </button>

        {/* Conteúdo scrollável */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 pt-2">
          {/* Título e info */}
          <div className="mb-4">
            <h2 className="text-xl font-bold text-[var(--text)]">{product.name}</h2>
            {product.serves > 1 && (
              <p className="flex items-center gap-1 text-[var(--text-muted)] text-sm mt-0.5">
                <Users size={13} />
                Serve {product.serves} {product.serves === 1 ? 'pessoa' : 'pessoas'}
              </p>
            )}
            {product.description && (
              <p className="text-[var(--text-muted)] text-sm mt-2 leading-relaxed">
                {product.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[var(--red)] font-bold text-lg">{formatCurrency(product.price)}</span>
              {product.original_price && (
                <span className="text-[var(--text-muted)] text-sm line-through">
                  {formatCurrency(product.original_price)}
                </span>
              )}
            </div>
          </div>

          {/* Grupos de opções */}
          {groups.map((group) => {
            const selected = selectedOptions[group.id] ?? []
            const error = errors[group.id]

            return (
              <div key={group.id} className="mb-4">
                <div className={cn(
                  'flex items-center justify-between p-2.5 rounded-lg mb-2',
                  error ? 'bg-red-900/20 border border-red-800' : 'bg-[var(--bg-elevated)]'
                )}>
                  <div>
                    <p className="font-semibold text-sm text-[var(--text)]">{group.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {group.required ? 'Obrigatório · ' : 'Opcional · '}
                      {group.max_selections === 1
                        ? 'Escolha 1 opção'
                        : `Escolha até ${group.max_selections} opções`}
                    </p>
                    {error && <p className="text-red-400 text-xs mt-0.5">{error}</p>}
                  </div>
                  {group.required && (
                    <span className="text-xs bg-[var(--red)] text-white px-2 py-0.5 rounded-full font-medium">
                      Obrigatório
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  {group.option_items.map((item) => {
                    const isSelected = selected.includes(item.id)
                    const isRadio = group.max_selections === 1

                    return (
                      <button
                        key={item.id}
                        onClick={() => toggleOption(group, item.id)}
                        className={cn(
                          'w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-150 text-left',
                          isSelected
                            ? 'border-[var(--red)] bg-[var(--red)]/10'
                            : 'border-[var(--border)] hover:border-[var(--red)]/40 hover:bg-[var(--bg-elevated)]'
                        )}
                      >
                        {/* Radio / Checkbox visual */}
                        <div className={cn(
                          'flex-shrink-0 transition-all',
                          isRadio
                            ? cn('w-4 h-4 rounded-full border-2', isSelected ? 'border-[var(--red)] bg-[var(--red)]' : 'border-[var(--text-muted)]')
                            : cn('w-4 h-4 rounded border-2 flex items-center justify-center', isSelected ? 'border-[var(--red)] bg-[var(--red)]' : 'border-[var(--text-muted)]')
                        )}>
                          {!isRadio && isSelected && (
                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                              <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--text)]">{item.name}</p>
                          {item.description && (
                            <p className="text-xs text-[var(--text-muted)] mt-0.5">{item.description}</p>
                          )}
                        </div>

                        {item.price_add > 0 && (
                          <span className="flex-shrink-0 text-sm text-[var(--red)] font-medium">
                            +{formatCurrency(item.price_add)}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Observações */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-[var(--text)] mb-1.5">
              Algum comentário?
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 140))}
              placeholder="Ex: sem gengibre, molho à parte..."
              rows={2}
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text-muted)] resize-none focus:outline-none focus:border-[var(--red)] transition-colors"
            />
            <p className="text-right text-xs text-[var(--text-muted)] mt-0.5">{notes.length}/140</p>
          </div>
        </div>

        {/* Footer fixo */}
        <div className="flex-shrink-0 border-t border-[var(--border)] p-4 bg-[var(--bg-card)]">
          <div className="flex items-center gap-3">
            {/* Quantidade */}
            <div className="flex items-center gap-2 border border-[var(--border)] rounded-lg p-1">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-elevated)] transition-colors"
              >
                <Minus size={16} />
              </button>
              <span className="w-6 text-center font-semibold text-[var(--text)] text-sm">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-8 h-8 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-elevated)] transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Botão adicionar */}
            <Button onClick={handleAdd} className="flex-1" size="lg">
              Adicionar · {formatCurrency(total)}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
