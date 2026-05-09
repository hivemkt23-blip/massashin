export interface Category {
  id: string
  name: string
  slug: string
  display_order: number
  active: boolean
}

export interface OptionItem {
  id: string
  group_id: string
  name: string
  description: string | null
  price_add: number
  active: boolean
  display_order: number
}

export interface OptionGroup {
  id: string
  product_id: string
  name: string
  required: boolean
  min_selections: number
  max_selections: number
  display_order: number
  option_items: OptionItem[]
}

export interface Product {
  id: string
  category_id: string
  name: string
  description: string | null
  price: number
  original_price: number | null
  image_url: string | null
  serves: number
  active: boolean
  display_order: number
  option_groups?: OptionGroup[]
}

export interface DeliveryZone {
  id: string
  radius_km_max: number
  delivery_time_min: number
  delivery_fee: number
}

export interface UserProfile {
  id: string
  full_name: string | null
  phone: string | null
}

export interface Address {
  id: string
  user_id: string
  label: string
  street: string
  number: string
  complement: string | null
  neighborhood: string
  city: string
  state: string
  zip_code: string | null
  latitude: number | null
  longitude: number | null
  is_default: boolean
}

export type PaymentMethod = 'pix' | 'credit_card' | 'debit_card' | 'cash'
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'delivering' | 'delivered' | 'cancelled'

export interface Order {
  id: string
  order_number: number
  user_id: string
  address_id: string
  status: OrderStatus
  payment_method: PaymentMethod
  subtotal: number
  delivery_fee: number
  total: number
  delivery_time_min: number | null
  customer_notes: string | null
  whatsapp_sent: boolean
  created_at: string
  addresses?: Address
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  product_price: number
  quantity: number
  item_notes: string | null
  subtotal: number
  order_item_options?: OrderItemOption[]
}

export interface OrderItemOption {
  id: string
  order_item_id: string
  option_group_name: string
  option_item_name: string
  price_add: number
}

// Cart types
export interface CartItemOption {
  group_id: string
  group_name: string
  item_id: string
  item_name: string
  price_add: number
}

export interface CartItem {
  id: string // unique cart item id (product_id + options hash)
  product: Product
  quantity: number
  selected_options: CartItemOption[]
  item_notes: string
  unit_price: number // price + options total
}

export interface BusinessHours {
  day: string
  open: string
  close: string
}

export const BUSINESS_HOURS: BusinessHours[] = [
  { day: 'Segunda-feira', open: '11:00', close: '21:30' },
  { day: 'Terça-feira',   open: '11:00', close: '21:30' },
  { day: 'Quarta-feira',  open: '11:00', close: '21:30' },
  { day: 'Quinta-feira',  open: '11:00', close: '21:30' },
  { day: 'Sexta-feira',   open: '11:00', close: '21:30' },
  { day: 'Sábado',        open: '11:00', close: '21:45' },
  { day: 'Domingo',       open: '11:00', close: '21:00' },
]

export const RESTAURANT_COORDS = {
  lat: -22.2194,
  lng: -54.8058,
  name: 'Massashin',
  address: 'Av. Marcelino Pires, 3600 · Shopping Avenida Center · Dourados, MS',
  whatsapp: '5567992350880',
}

export type ReviewStatus = 'pending' | 'approved' | 'rejected'

export interface Review {
  id: string
  user_id: string | null
  user_name: string
  rating: number
  comment: string | null
  status: ReviewStatus
  admin_reply: string | null
  created_at: string
}

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  pix: 'PIX',
  credit_card: 'Cartão de Crédito (maquininha)',
  debit_card: 'Cartão de Débito (maquininha)',
  cash: 'Dinheiro',
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Aguardando confirmação',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  delivering: 'Saiu para entrega',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
}
