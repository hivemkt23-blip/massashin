import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem, CartItemOption, Product } from '@/types'
import { generateCartItemId } from '@/lib/utils'

interface CartState {
  items: CartItem[]
  isOpen: boolean
  addItem: (product: Product, options: CartItemOption[], notes: string) => void
  removeItem: (cartItemId: string) => void
  updateQuantity: (cartItemId: string, quantity: number) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  totalItems: () => number
  subtotal: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product, options, notes) => {
        const optionItemIds = options.map((o) => o.item_id)
        const cartItemId = generateCartItemId(product.id, optionItemIds)
        const optionsTotal = options.reduce((sum, o) => sum + o.price_add, 0)
        const unit_price = product.price + optionsTotal

        set((state) => {
          const existing = state.items.find((i) => i.id === cartItemId)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === cartItemId ? { ...i, quantity: i.quantity + 1 } : i
              ),
              isOpen: true,
            }
          }
          return {
            items: [
              ...state.items,
              { id: cartItemId, product, quantity: 1, selected_options: options, item_notes: notes, unit_price },
            ],
            isOpen: true,
          }
        })
      },

      removeItem: (cartItemId) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== cartItemId) })),

      updateQuantity: (cartItemId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.id !== cartItemId)
              : state.items.map((i) => (i.id === cartItemId ? { ...i, quantity } : i)),
        })),

      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: () => get().items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0),
    }),
    { name: 'massashin-cart' }
  )
)
