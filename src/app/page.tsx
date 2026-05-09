import { createClient } from '@/lib/supabase/server'
import { Category, Product } from '@/types'
import CatalogClient from './CatalogClient'

export const revalidate = 3600

export default async function HomePage() {
  const supabase = await createClient()

  const [{ data: categories }, { data: products }, { data: settings }] = await Promise.all([
    supabase.from('categories').select('*').eq('active', true).order('display_order'),
    supabase.from('products').select(`*, option_groups(*, option_items(*))`).eq('active', true).order('display_order'),
    supabase.from('site_settings').select('key, value'),
  ])

  const bannerUrl = settings?.find(s => s.key === 'banner_url')?.value ?? null

  return (
    <CatalogClient
      categories={(categories as Category[]) ?? []}
      products={(products as Product[]) ?? []}
      bannerUrl={bannerUrl}
    />
  )
}
