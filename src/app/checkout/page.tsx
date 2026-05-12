'use client'
import { useState, useEffect } from 'react'
import { useCartStore } from '@/store/cart'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { fetchAddressByCep, geocodeAddress, getDeliveryInfo } from '@/lib/delivery'
import { formatOrderMessage, buildWhatsAppUrl } from '@/lib/whatsapp'
import { formatCurrency, formatCep, formatPhone } from '@/lib/utils'
import { DeliveryZone, PaymentMethod, PAYMENT_LABELS, Address } from '@/types'
import Header from '@/components/Header'
import Button from '@/components/ui/Button'
import { MapPin, CreditCard, MessageSquare, ChevronLeft, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

type Step = 'address' | 'payment' | 'review'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, subtotal, clearCart } = useCartStore()
  const sub = subtotal()

  const [step, setStep] = useState<Step>('address')
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([])
  const [deliveryInfo, setDeliveryInfo] = useState<{ zone: DeliveryZone; distanceKm: number } | null>(null)
  const [outOfRange, setOutOfRange] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix')
  const [generalNotes, setGeneralNotes] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [geocoding, setGeocoding] = useState(false)

  const [address, setAddress] = useState({
    street: '', number: '', complement: '', neighborhood: '', zip_code: '',
  })

  useEffect(() => {
    if (items.length === 0) router.replace('/')
  }, [items, router])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))

    supabase.from('delivery_zones').select('*').order('radius_km_max').then(({ data }) => {
      if (data) setDeliveryZones(data as DeliveryZone[])
    })
  }, [])

  const handleCepChange = async (cep: string) => {
    const formatted = formatCep(cep)
    setAddress((prev) => ({ ...prev, zip_code: formatted }))
    if (formatted.replace('-', '').length === 8) {
      const result = await fetchAddressByCep(formatted)
      if (result) {
        setAddress((prev) => ({
          ...prev,
          street: result.logradouro || prev.street,
          neighborhood: result.bairro || prev.neighborhood,
        }))
      }
    }
  }

  const calculateDelivery = async () => {
    if (!address.street || !address.number || !address.neighborhood) return
    setGeocoding(true)
    setOutOfRange(false)
    setDeliveryInfo(null)

    const fullAddress = `${address.street} ${address.number}, ${address.neighborhood}, Dourados, MS`
    const coords = await geocodeAddress(fullAddress)

    if (!coords) {
      setOutOfRange(true)
      setGeocoding(false)
      return
    }

    const info = getDeliveryInfo(coords.lat, coords.lng, deliveryZones)
    if (!info) {
      setOutOfRange(true)
    } else {
      setDeliveryInfo(info)
      setOutOfRange(false)
    }
    setGeocoding(false)
  }

  const handleSubmit = async () => {
    if (!deliveryInfo) return
    setSubmitting(true)

    try {
      const fullAddress: Address = {
        id: '',
        user_id: user?.id ?? '',
        label: 'Entrega',
        street: address.street,
        number: address.number,
        complement: address.complement,
        neighborhood: address.neighborhood,
        city: 'Dourados',
        state: 'MS',
        zip_code: address.zip_code,
        latitude: null,
        longitude: null,
        is_default: false,
      }

      // Salva pedido via API route (service role — funciona com ou sem login)
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: {
            user_id: user?.id ?? null,
            street: address.street,
            number: address.number,
            complement: address.complement,
            neighborhood: address.neighborhood,
            city: 'Dourados',
            state: 'MS',
            zip_code: address.zip_code,
          },
          order: {
            user_id: user?.id ?? null,
            payment_method: paymentMethod,
            subtotal: sub,
            delivery_fee: deliveryInfo.zone.delivery_fee,
            total: sub + deliveryInfo.zone.delivery_fee,
            delivery_time_min: deliveryInfo.zone.delivery_time_min,
            customer_notes: generalNotes || null,
            customer_phone: customerPhone || null,
          },
          items: items.map(item => ({
            product_id: item.product.id,
            product_name: item.product.name,
            product_price: item.unit_price,
            quantity: item.quantity,
            item_notes: item.item_notes || null,
            subtotal: item.unit_price * item.quantity,
            options: item.selected_options.map(opt => ({
              group_name: opt.group_name,
              item_name: opt.item_name,
              price_add: opt.price_add,
            })),
          })),
        }),
      })

      const data = await res.json()
      const orderNumber = data.order_number ?? Math.floor(Math.random() * 90000) + 10000

      // Abre WhatsApp
      const msg = formatOrderMessage(
        orderNumber,
        items,
        fullAddress,
        paymentMethod,
        deliveryInfo.zone.delivery_fee,
        generalNotes
      )
      const waUrl = buildWhatsAppUrl(msg)
      clearCart()
      window.open(waUrl, '_blank')
      router.push(user ? '/pedidos' : '/')
    } finally {
      setSubmitting(false)
    }
  }

  if (items.length === 0) return null

  const total = sub + (deliveryInfo?.zone.delivery_fee ?? 0)

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Voltar */}
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] mb-6 transition-colors">
          <ChevronLeft size={16} />
          Voltar ao cardápio
        </Link>

        <h1 className="text-2xl font-bold text-[var(--text)] mb-6">Finalizar Pedido</h1>

        {/* Etapas */}
        <div className="space-y-4">
          {/* ENDEREÇO */}
          <section className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
            <h2 className="flex items-center gap-2 font-bold text-[var(--text)] mb-4">
              <MapPin size={18} className="text-[var(--red)]" />
              Endereço de entrega
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-1">
                <label className="text-xs text-[var(--text-muted)] mb-1 block">CEP</label>
                <input
                  value={address.zip_code}
                  onChange={(e) => handleCepChange(e.target.value)}
                  placeholder="00000-000"
                  className="input-field w-full"
                />
              </div>
              <div className="col-span-1">
                <label className="text-xs text-[var(--text-muted)] mb-1 block">Número</label>
                <input
                  value={address.number}
                  onChange={(e) => setAddress((p) => ({ ...p, number: e.target.value }))}
                  placeholder="Ex: 123"
                  className="input-field w-full"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-[var(--text-muted)] mb-1 block">Rua / Avenida</label>
                <input
                  value={address.street}
                  onChange={(e) => setAddress((p) => ({ ...p, street: e.target.value }))}
                  placeholder="Nome da rua"
                  className="input-field w-full"
                />
              </div>
              <div className="col-span-1">
                <label className="text-xs text-[var(--text-muted)] mb-1 block">Bairro</label>
                <input
                  value={address.neighborhood}
                  onChange={(e) => setAddress((p) => ({ ...p, neighborhood: e.target.value }))}
                  placeholder="Bairro"
                  className="input-field w-full"
                />
              </div>
              <div className="col-span-1">
                <label className="text-xs text-[var(--text-muted)] mb-1 block">Complemento</label>
                <input
                  value={address.complement}
                  onChange={(e) => setAddress((p) => ({ ...p, complement: e.target.value }))}
                  placeholder="Apto, bloco..."
                  className="input-field w-full"
                />
              </div>
            </div>

            <Button
              onClick={calculateDelivery}
              variant="outline"
              className="mt-3 w-full"
              loading={geocoding}
              disabled={!address.street || !address.number || !address.neighborhood}
            >
              {geocoding ? 'Calculando...' : 'Calcular taxa de entrega'}
            </Button>

            {outOfRange && (
              <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-red-900/20 border border-red-800 text-red-400 text-sm">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <p>Infelizmente não realizamos entregas nessa região. Nosso raio máximo de entrega é de 10 km a partir do Shopping Avenida Center.</p>
              </div>
            )}

            {deliveryInfo && (
              <div className="mt-3 p-3 rounded-lg bg-green-900/20 border border-green-800 text-green-400 text-sm">
                ✓ Entrega disponível · Taxa: <strong>{formatCurrency(deliveryInfo.zone.delivery_fee)}</strong> · Tempo estimado: <strong>{deliveryInfo.zone.delivery_time_min} min</strong>
              </div>
            )}
          </section>

          {/* PAGAMENTO */}
          <section className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
            <h2 className="flex items-center gap-2 font-bold text-[var(--text)] mb-4">
              <CreditCard size={18} className="text-[var(--red)]" />
              Forma de pagamento
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(PAYMENT_LABELS) as [PaymentMethod, string][]).map(([method, label]) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`p-3 rounded-lg border text-sm font-medium text-left transition-all ${
                    paymentMethod === method
                      ? 'border-[var(--red)] bg-[var(--red)]/10 text-[var(--text)]'
                      : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--red)]/40'
                  }`}
                >
                  {method === 'pix' && '🏦 '}
                  {method === 'credit_card' && '💳 '}
                  {method === 'debit_card' && '💳 '}
                  {method === 'cash' && '💵 '}
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-2">
              O pagamento é realizado na entrega.
            </p>
          </section>

          {/* OBSERVAÇÕES */}
          <section className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
            <h2 className="flex items-center gap-2 font-bold text-[var(--text)] mb-3">
              <MessageSquare size={18} className="text-[var(--red)]" />
              Observações gerais <span className="text-[var(--text-muted)] font-normal text-sm">(opcional)</span>
            </h2>
            <textarea
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="Ex: deixar na portaria, não toque a campainha..."
              rows={2}
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text-muted)] resize-none focus:outline-none focus:border-[var(--red)] transition-colors"
            />
            <div className="mt-3">
              <label className="block text-xs text-[var(--text-muted)] mb-1">WhatsApp para atualizações <span className="opacity-60">(opcional)</span></label>
              <input
                type="tel"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder="(67) 99999-9999"
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--red)] transition-colors"
              />
              <p className="text-xs text-[var(--text-muted)] mt-1">Vamos te notificar quando seu pedido estiver a caminho 🛵</p>
            </div>
          </section>

          {/* RESUMO */}
          <section className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
            <h2 className="font-bold text-[var(--text)] mb-3">Resumo do pedido</h2>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-[var(--text-muted)]">{item.quantity}x {item.product.name}</span>
                  <span className="text-[var(--text)]">{formatCurrency(item.unit_price * item.quantity)}</span>
                </div>
              ))}
              <div className="border-t border-[var(--border)] pt-2 mt-2 space-y-1">
                <div className="flex justify-between text-sm text-[var(--text-muted)]">
                  <span>Subtotal</span>
                  <span>{formatCurrency(sub)}</span>
                </div>
                <div className="flex justify-between text-sm text-[var(--text-muted)]">
                  <span>Taxa de entrega</span>
                  <span>{deliveryInfo ? formatCurrency(deliveryInfo.zone.delivery_fee) : '—'}</span>
                </div>
                <div className="flex justify-between font-bold text-[var(--text)] text-base pt-1">
                  <span>Total</span>
                  <span className="text-[var(--red)]">{deliveryInfo ? formatCurrency(total) : '—'}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Login opcional */}
          {!user && (
            <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-sm text-[var(--text-muted)]">
              <Link href="/auth" className="text-[var(--red)] font-medium hover:underline">
                Faça login
              </Link>{' '}
              para salvar seus endereços e acompanhar histórico de pedidos. Ou continue sem conta.
            </div>
          )}

          {/* Botão finalizar */}
          <Button
            onClick={handleSubmit}
            disabled={!deliveryInfo || outOfRange}
            loading={submitting}
            size="lg"
            className="w-full"
          >
            {submitting ? 'Processando...' : '📱 Enviar pedido pelo WhatsApp'}
          </Button>
          <p className="text-center text-xs text-[var(--text-muted)]">
            Ao confirmar, você será redirecionado ao WhatsApp para enviar o pedido ao restaurante.
          </p>
        </div>
      </main>

      <style jsx>{`
        .input-field {
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 14px;
          color: var(--text);
          transition: border-color 0.15s;
        }
        .input-field:focus {
          outline: none;
          border-color: var(--red);
        }
        .input-field::placeholder {
          color: var(--text-muted);
        }
      `}</style>
    </div>
  )
}
