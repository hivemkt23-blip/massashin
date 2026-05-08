import { CartItem, Address, PaymentMethod, PAYMENT_LABELS, RESTAURANT_COORDS } from '@/types'

export function formatOrderMessage(
  orderNumber: number,
  items: CartItem[],
  address: Address,
  paymentMethod: PaymentMethod,
  deliveryFee: number,
  customerNotes?: string
): string {
  const subtotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
  const total = subtotal + deliveryFee

  const itemLines = items
    .map((item) => {
      const optLines = item.selected_options
        .map((o) => `   ↳ ${o.item_name}${o.price_add > 0 ? ` (+R$ ${o.price_add.toFixed(2)})` : ''}`)
        .join('\n')
      const noteLine = item.item_notes ? `   📝 Obs: ${item.item_notes}` : ''
      return [
        `• ${item.quantity}x ${item.product.name} — R$ ${(item.unit_price * item.quantity).toFixed(2)}`,
        optLines,
        noteLine,
      ]
        .filter(Boolean)
        .join('\n')
    })
    .join('\n')

  const addressLine = [
    `${address.street}, ${address.number}`,
    address.complement,
    address.neighborhood,
    `${address.city} - ${address.state}`,
    address.zip_code ? `CEP: ${address.zip_code}` : '',
  ]
    .filter(Boolean)
    .join(', ')

  return [
    `🍣 *MASSASHIN* — Pedido #${orderNumber}`,
    '',
    `📦 *ITENS:*`,
    itemLines,
    '',
    `💰 *RESUMO:*`,
    `Subtotal: R$ ${subtotal.toFixed(2)}`,
    `Taxa de entrega: R$ ${deliveryFee.toFixed(2)}`,
    `*Total: R$ ${total.toFixed(2)}*`,
    '',
    `💳 *Pagamento:* ${PAYMENT_LABELS[paymentMethod]}`,
    '',
    `📍 *Endereço de entrega:*`,
    addressLine,
    customerNotes ? `\n📝 *Obs. geral:* ${customerNotes}` : '',
  ]
    .filter((l) => l !== undefined)
    .join('\n')
}

export function buildWhatsAppUrl(message: string): string {
  const encoded = encodeURIComponent(message)
  return `https://wa.me/${RESTAURANT_COORDS.whatsapp}?text=${encoded}`
}
