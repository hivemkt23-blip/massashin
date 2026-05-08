import { DeliveryZone, RESTAURANT_COORDS } from '@/types'

// Haversine formula: distância em km entre dois pontos geográficos
export function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180
}

export function getDeliveryInfo(
  customerLat: number,
  customerLng: number,
  zones: DeliveryZone[]
): { zone: DeliveryZone; distanceKm: number } | null {
  const distanceKm = getDistanceKm(
    RESTAURANT_COORDS.lat,
    RESTAURANT_COORDS.lng,
    customerLat,
    customerLng
  )

  const sortedZones = [...zones].sort((a, b) => a.radius_km_max - b.radius_km_max)
  const zone = sortedZones.find((z) => distanceKm <= z.radius_km_max)

  if (!zone) return null
  return { zone, distanceKm }
}

// Geocodificação de CEP via ViaCEP (gratuito, sem API key)
export interface ViaCepResult {
  logradouro: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}

export async function fetchAddressByCep(cep: string): Promise<ViaCepResult | null> {
  const cleaned = cep.replace(/\D/g, '')
  if (cleaned.length !== 8) return null
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`)
    const data: ViaCepResult = await res.json()
    if (data.erro) return null
    return data
  } catch {
    return null
  }
}

// Geocodificação por endereço via Nominatim (OpenStreetMap, gratuito)
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const encoded = encodeURIComponent(address + ', Dourados, MS, Brasil')
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'pt-BR' } }
    )
    const data = await res.json()
    if (!data.length) return null
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch {
    return null
  }
}

export function isRestaurantOpen(): boolean {
  const now = new Date()
  const day = now.getDay() // 0=dom, 1=seg, ..., 6=sab
  const hours = now.getHours()
  const minutes = now.getMinutes()
  const currentTime = hours * 60 + minutes

  // Horários em minutos
  const openTime = 11 * 60 // 11:00
  const closeMap: Record<number, number> = {
    0: 21 * 60,       // domingo 21:00
    1: 21 * 60 + 30,  // seg-sex 21:30
    2: 21 * 60 + 30,
    3: 21 * 60 + 30,
    4: 21 * 60 + 30,
    5: 21 * 60 + 30,
    6: 21 * 60 + 45,  // sábado 21:45
  }

  return currentTime >= openTime && currentTime < closeMap[day]
}
