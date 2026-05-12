import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function serviceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(req: NextRequest) {
  try {
    const { address, order, items } = await req.json()
    const supabase = serviceSupabase()

    // Verifica se user_id tem perfil cadastrado (evita erro de FK)
    let validUserId: string | null = order.user_id || null
    if (validUserId) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', validUserId)
        .single()
      if (!profile) validUserId = null // perfil não existe, trata como guest
    }

    // Salva endereço
    const { data: savedAddr, error: addrError } = await supabase
      .from('addresses')
      .insert({
        user_id: validUserId,
        label: 'Entrega',
        street: address.street,
        number: address.number,
        complement: address.complement || null,
        neighborhood: address.neighborhood,
        city: address.city || 'Dourados',
        state: address.state || 'MS',
        zip_code: address.zip_code || null,
      })
      .select('id')
      .single()

    if (addrError) {
      return NextResponse.json({ error: `address: ${addrError.message}` }, { status: 500 })
    }

    // Salva pedido
    const { data: savedOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: validUserId,
        address_id: savedAddr.id,
        status: 'pending',
        payment_method: order.payment_method,
        subtotal: order.subtotal,
        delivery_fee: order.delivery_fee,
        total: order.total,
        delivery_time_min: order.delivery_time_min,
        customer_notes: order.customer_notes || null,
        customer_phone: order.customer_phone || null,
      })
      .select('id, order_number')
      .single()

    if (orderError) {
      return NextResponse.json({ error: `order: ${orderError.message}` }, { status: 500 })
    }

    // Salva itens
    for (const item of items) {
      const { data: orderItem } = await supabase
        .from('order_items')
        .insert({
          order_id: savedOrder.id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_price: item.product_price,
          quantity: item.quantity,
          item_notes: item.item_notes || null,
          subtotal: item.subtotal,
        })
        .select('id')
        .single()

      if (orderItem && item.options && item.options.length > 0) {
        await supabase.from('order_item_options').insert(
          item.options.map((opt: any) => ({
            order_item_id: orderItem.id,
            option_group_name: opt.group_name,
            option_item_name: opt.item_name,
            price_add: opt.price_add,
          }))
        )
      }
    }

    return NextResponse.json({ ok: true, order_number: savedOrder.order_number, order_id: savedOrder.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
