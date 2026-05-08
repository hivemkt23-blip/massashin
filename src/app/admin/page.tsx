import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export const revalidate = 0

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [
    { data: orders },
    { data: orderItems },
    { data: addresses },
  ] = await Promise.all([
    supabase.from('orders').select('*, addresses(neighborhood, city)').order('created_at', { ascending: false }),
    supabase.from('order_items').select('product_name, quantity, subtotal, order_id, orders(created_at, status)'),
    supabase.from('addresses').select('neighborhood'),
  ])

  return <DashboardClient orders={orders ?? []} orderItems={orderItems ?? []} />
}
