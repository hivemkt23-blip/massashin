import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Providers from '@/components/Providers'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title: 'Massashin — Culinária Japonesa em Dourados',
  description: 'Peça online os melhores combinados, sushis, temakis e pratos quentes do Massashin. Entrega em Dourados - MS.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={geist.variable} suppressHydrationWarning>
      <body className="min-h-screen antialiased bg-[var(--bg)] text-[var(--text)] transition-colors duration-200">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
